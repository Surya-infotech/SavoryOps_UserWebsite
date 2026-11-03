import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import EditNoteIcon from "@mui/icons-material/EditNote";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import TakeoutDiningIcon from "@mui/icons-material/TakeoutDining";
import { isDineInOrderType } from "../Orders/orderHelpers.js";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import {
  getCart,
  saveCart,
  clearCart,
  updateCartItemQuantity,
  removeCartItem,
  updateCartItemInstructions,
  updateCartItemAddons,
} from "../../utils/cartService.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import { computeCartBilling } from "../../utils/billingCalculator.js";
import "../../Scss/Pages/Cart/cartpage.scss";

const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;
const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge
 */
const DietIndicator = ({ isVeg, className = "" }) => {
  const { translations = {} } = useLanguage();
  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? translations.veg || "Vegetarian" : translations.nonveg || "Non-Vegetarian"}
      aria-label={isVeg ? translations.veg || "Vegetarian" : translations.nonveg || "Non-Vegetarian"}
    >
      <span className="diet-box">
        <span className="diet-dot" />
      </span>
    </span>
  );
};

/**
 * Determine Diet Info (Veg / Non-Veg) for Cart Items based on item details
 */
const getDietInfo = (item) => {
  if (!item) return { hasDiet: false, isVeg: false };
  if (item.isVeg !== undefined && item.isVeg !== null) {
    return { hasDiet: true, isVeg: Boolean(item.isVeg) };
  }
  const type = (item.itemtype || item.itemType || "").trim().toLowerCase();
  if (type) {
    const isNonVeg = type.includes("non") || type.includes("egg");
    const isVeg = !isNonVeg && (type.includes("veg") || type === "vegan");
    return { hasDiet: isVeg || isNonVeg, isVeg };
  }
  return { hasDiet: false, isVeg: false };
};

const getOrderTypeIcon = (orderType) => {
  const norm = String(orderType || "").toLowerCase().replace(/[-\s_]/g, "");
  if (norm.includes("dine")) return <TableRestaurantIcon fontSize="small" />;
  if (norm.includes("pickup") || norm.includes("takeaway")) return <TakeoutDiningIcon fontSize="small" />;
  if (norm.includes("delivery")) return <DeliveryDiningIcon fontSize="small" />;
  return <TableRestaurantIcon fontSize="small" />;
};

const CartPage = () => {
  const navigate = useNavigate();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const { showSnackbar } = useSnackbar();
  const businessDisplayName = business?.businessname || "";

  const [cartItems, setCartItems] = useState(getCart);
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const [openNotesMap, setOpenNotesMap] = useState({});
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType");
  });
  const [currentOrderNo, setCurrentOrderNo] = useState(() => localStorage.getItem("currentOrderNo"));
  const [currentOrderId, setCurrentOrderId] = useState(() => localStorage.getItem("currentOrderId"));
  const [selectedTableNo, setSelectedTableNo] = useState(() => localStorage.getItem("selectedTableNo"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [posPayload, setPosPayload] = useState(() => {
    return typeof window !== "undefined" ? window.__branchSetting : null;
  });

  // Addon Customization Modal State
  const [editingCartItem, setEditingCartItem] = useState(null);
  const [selectedModalAddonIds, setSelectedModalAddonIds] = useState([]);

  // Sync cart items with global cartUpdated event
  useEffect(() => {
    const handleCartUpdated = (e) => {
      if (e?.detail) {
        setCartItems(e.detail);
      } else {
        setCartItems(getCart());
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, []);

  // Sync active branch currency settings
  useEffect(() => {
    const handleBranchChange = (e) => {
      if (e?.detail) {
        setSelectedBranch(e.detail);
      } else {
        setSelectedBranch(getActiveBranch());
      }
    };

    const handleOrderTypeChange = (e) => {
      const ot = e?.detail?.orderType;
      if (ot) {
        setSelectedOrderType(ot);
      }
    };
    const handleBranchSettingChange = (e) => {
      if (e?.detail) {
        setPosPayload(e.detail);
      }
    };
    const handleStorage = (e) => {
      if (e.key === "selectedOrderType" && e.newValue) {
        setSelectedOrderType(e.newValue);
      }
    };

    window.addEventListener("branchChange", handleBranchChange);
    window.addEventListener("orderTypeChange", handleOrderTypeChange);
    window.addEventListener("branchSettingChange", handleBranchSettingChange);
    window.addEventListener("storage", handleStorage);
    window.dispatchEvent(new CustomEvent("requestBranch"));
    window.dispatchEvent(new CustomEvent("requestBranchSetting"));

    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
      window.removeEventListener("orderTypeChange", handleOrderTypeChange);
      window.removeEventListener("branchSettingChange", handleBranchSettingChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Dynamically update cart items price when order type or branch tax settings change
  useEffect(() => {
    if (!posPayload) return;
    let hasPriceChange = false;
    const updated = cartItems.map((item) => {
      const trueRawPrice = Number(item.rawPrice ?? item.price ?? 0);
      const trueTaxes = Array.isArray(item.taxes) ? item.taxes : [];
      const itemToCalc = {
        ...item,
        price: trueRawPrice,
        rawPrice: trueRawPrice,
        taxes: trueTaxes,
      };
      const newPrice = calculateItemPrice(itemToCalc, posPayload, selectedOrderType);
      if (item.price !== newPrice) {
        hasPriceChange = true;
        return {
          ...item,
          price: newPrice,
          rawPrice: trueRawPrice,
          taxes: trueTaxes,
        };
      }
      return item;
    });

    if (hasPriceChange) {
      setCartItems(updated);
      saveCart(updated);
    }
  }, [posPayload, selectedOrderType, cartItems]);

  const effectiveOrderType = useMemo(() => {
    if (currentOrderNo) {
      return localStorage.getItem("orderType") || "Dine-in";
    }
    if (typeof selectedOrderType === "object" && selectedOrderType !== null) {
      return selectedOrderType?.ordertypename || selectedOrderType?.name || "";
    }
    return String(selectedOrderType || "").trim();
  }, [currentOrderNo, selectedOrderType]);

  const isDineIn = useMemo(() => {
    return isDineInOrderType(effectiveOrderType);
  }, [effectiveOrderType]);

  // Dynamic document title
  useEffect(() => {
    document.title = `${translations.cart || "Cart"} | ${businessDisplayName || "SavoryOps"}`;
  }, [translations, businessDisplayName]);

  // Handlers
  const handleIncrease = (cartItemId) => {
    const item = cartItems.find((i) => i.cartItemId === cartItemId);
    if (item) {
      updateCartItemQuantity(cartItemId, (item.quantity || 1) + 1);
    }
  };

  const handleDecrease = (cartItemId) => {
    const item = cartItems.find((i) => i.cartItemId === cartItemId);
    if (item) {
      updateCartItemQuantity(cartItemId, (item.quantity || 1) - 1);
    }
  };

  const handleRemove = (cartItemId, itemName) => {
    removeCartItem(cartItemId);
    if (typeof showSnackbar === "function") {
      showSnackbar(`${itemName || "Item"} removed from cart`, "info", 2500);
    }
  };


  const toggleInstructions = (cartItemId) => {
    setOpenNotesMap((prev) => ({
      ...prev,
      [cartItemId]: !prev[cartItemId],
    }));
  };

  const handleInstructionsChange = (cartItemId, text) => {
    updateCartItemInstructions(cartItemId, text);
  };

  // Addon Modal Handlers
  const handleOpenAddonModal = (item) => {
    setEditingCartItem(item);
    const initialSelected = (item.addons || [])
      .filter((a) => a && a.selected !== false)
      .map((a) => String(a.addonid || a.id || a._id));
    setSelectedModalAddonIds(initialSelected);
  };

  const toggleModalAddon = (addonKey) => {
    const strKey = String(addonKey);
    setSelectedModalAddonIds((prev) =>
      prev.includes(strKey) ? prev.filter((id) => id !== strKey) : [...prev, strKey]
    );
  };

  const handleSaveAddons = () => {
    if (!editingCartItem) return;
    const available =
      editingCartItem.availableAddons && editingCartItem.availableAddons.length > 0
        ? editingCartItem.availableAddons
        : editingCartItem.addons || [];

    const updatedAddons = available.map((addon) => {
      const key = String(addon.addonid || addon.id || addon._id);
      return {
        addonid: addon.addonid || addon.id || addon._id,
        addonname: addon.addonname || addon.name,
        price: Number(addon.price ?? addon.addonprice ?? 0),
        selected: selectedModalAddonIds.includes(key),
      };
    });

    updateCartItemAddons(editingCartItem.cartItemId, updatedAddons);
    if (typeof showSnackbar === "function") {
      showSnackbar(`Add-ons updated for ${editingCartItem.name}`, "success", 2500);
    }
    setEditingCartItem(null);
  };

  // Calculations & Billing Summary
  const billingSummary = useMemo(() => {
    return computeCartBilling(cartItems, posPayload, selectedOrderType);
  }, [cartItems, posPayload, selectedOrderType]);

  const grandTotal = billingSummary.grandTotal;

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [cartItems]);

  const modalAvailableAddons = useMemo(() => {
    if (!editingCartItem) return [];
    return editingCartItem.availableAddons && editingCartItem.availableAddons.length > 0
      ? editingCartItem.availableAddons
      : editingCartItem.addons || [];
  }, [editingCartItem]);

  const modalComputedTotal = useMemo(() => {
    if (!editingCartItem) return 0;
    const base = Number(editingCartItem.price || 0);
    const addonsSum = modalAvailableAddons
      .filter((a) => selectedModalAddonIds.includes(String(a.addonid || a.id || a._id)))
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
    return (base + addonsSum) * (Number(editingCartItem.quantity) || 1);
  }, [editingCartItem, modalAvailableAddons, selectedModalAddonIds]);

  const handleCancelOrderUpdate = () => {
    localStorage.removeItem("currentOrderNo");
    localStorage.removeItem("currentOrderId");
    localStorage.removeItem("orderType");
    localStorage.removeItem("selectedTableId");
    localStorage.removeItem("selectedTableNo");
    setCurrentOrderNo(null);
    setCurrentOrderId(null);
    setSelectedTableNo(null);
    if (typeof showSnackbar === "function") {
      showSnackbar("Order update cancelled. You are now creating a new order.", "info", 3000);
    }
  };

  const handleProceedCheckout = async () => {
    if (!cartItems.length) {
      if (typeof showSnackbar === "function") {
        showSnackbar(translations.emptycartmessage || "Your cart is empty", "warning");
      }
      return;
    }

    const token = localStorage.getItem(customerTokenName);
    const customerId = localStorage.getItem(customerIdName);

    if (!token || !customerId) {
      if (typeof showSnackbar === "function") {
        showSnackbar(
          translations.pleasesignintoorder || "Please sign in to proceed to checkout",
          "info"
        );
      }
      navigate("/signin", { state: { from: "/cart" } });
      return;
    }

    // Direct Order Update when adding more items to an existing order (same as UserApp)
    if (currentOrderNo) {
      const branchId = selectedBranch?.branchid || localStorage.getItem("selectedBranchid");
      if (!branchId) {
        if (typeof showSnackbar === "function") {
          showSnackbar("Branch information not found. Please try again.", "error");
        }
        return;
      }

      setIsSubmitting(true);
      try {
        const processedItems = cartItems.map((item) => {
          const itemQuantity = Number(item.quantity || 1);
          const itemPrice = Number(item.price || 0);
          const itemRawPrice = Number(item.rawPrice !== undefined ? item.rawPrice : itemPrice);

          const selectedAddons = (item.addons || [])
            .filter((a) => a && a.selected !== false)
            .map((addon) => {
              const rawAddonId = addon.addonid != null ? addon.addonid : (addon.id != null ? addon.id : addon._id);
              const addonPrice = Number(addon.price || addon.addonprice || 0);
              return {
                addonid: rawAddonId != null && !isNaN(Number(rawAddonId)) ? Number(rawAddonId) : rawAddonId,
                id: rawAddonId,
                addonname: addon.addonname || addon.name,
                name: addon.addonname || addon.name,
                addonprice: addonPrice,
                price: addonPrice,
                selected: true,
              };
            });

          const itemAddonsTotal = selectedAddons.reduce((sum, a) => sum + a.price * itemQuantity, 0);
          const itemAmount = Number((itemPrice * itemQuantity + itemAddonsTotal).toFixed(2));
          const resolvedItemId = item.itemid != null ? item.itemid : (item.itemId || item.id || item._id);

          return {
            ...item,
            cartItemId: item.cartItemId,
            itemid: resolvedItemId != null && !isNaN(Number(resolvedItemId)) ? Number(resolvedItemId) : resolvedItemId,
            itemId: resolvedItemId,
            id: resolvedItemId,
            name: item.name || item.itemname,
            itemname: item.name || item.itemname,
            quantity: itemQuantity,
            qty: itemQuantity,
            price: itemPrice,
            rawPrice: itemRawPrice,
            amount: itemAmount,
            addons: selectedAddons,
            taxes: item.taxes || [],
            appliedTaxes: item.appliedTaxes || item.taxes || [],
            itemtype: item.itemtype || (item.isVeg ? "Veg" : "Non-Veg"),
            specialInstructions: item.specialInstructions || "",
          };
        });

        const orderData = {
          items: processedItems,
          subtotal: billingSummary.subtotal,
          subtotalprice: billingSummary.subtotal,
          beforeTaxCharges: billingSummary.beforeTaxCharges,
          taxes: billingSummary.taxRows,
          branchTaxes: billingSummary.taxRows.filter((t) => t.taxLevel === "branch"),
          orderTypeTaxes: billingSummary.taxRows.filter((t) => t.taxLevel === "ordertype"),
          itemTaxes: billingSummary.taxRows.filter((t) => t.taxLevel === "item"),
          totalExclusiveTax: billingSummary.totalExclusiveTax,
          totaltax: billingSummary.totalExclusiveTax,
          afterTaxCharges: billingSummary.afterTaxCharges,
          additionalCharges: billingSummary.additionalCharges,
          specialDayCharges: billingSummary.specialDayCharges,
          additional_charges: billingSummary.additionalCharges,
          special_charges: billingSummary.specialDayCharges,
          specialdaycharges: billingSummary.specialDayCharges,
          roundoff: billingSummary.roundoff,
          roundoffAmount: billingSummary.roundoff?.roundedAmount ?? 0,
          grandTotal: billingSummary.grandTotal,
          totalprice: billingSummary.grandTotal,
          currency: selectedBranch?.currency || selectedBranch?.currencysymbol || "$",
          currencySymbol: selectedBranch?.currencysymbol || "$",
          ordertype: "Dine-in",
          tableid: localStorage.getItem("selectedTableId") || undefined,
          taxApplicationMode: posPayload?.taxApplicationMode || "apply_all",
          inclusiveTaxIncreasesPrice: Boolean(posPayload?.inclusiveTaxIncreasesPrice),
          itemTaxOverridesBranch: Boolean(posPayload?.itemTaxOverridesBranch),
          itemTaxOverridesOrderType: Boolean(posPayload?.itemTaxOverridesOrderType),
          orderTypeTaxOverridesBranch: Boolean(posPayload?.orderTypeTaxOverridesBranch),
        };

        const response = await fetch(
          `${adminPanelBackendPath}/Website/Order/UpdateOrder/${customerId}/${branchId}/${currentOrderNo}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-user": "admin",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(orderData),
          }
        );

        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          clearCart();
          const targetOrderId = currentOrderId;
          localStorage.removeItem("currentOrderNo");
          localStorage.removeItem("currentOrderId");
          localStorage.removeItem("orderType");
          localStorage.removeItem("selectedTableId");
          localStorage.removeItem("selectedTableNo");
          setCurrentOrderNo(null);
          setCurrentOrderId(null);
          setSelectedTableNo(null);

          if (typeof showSnackbar === "function") {
            showSnackbar(
              translations.orderupdatedsuccessfully || "Items added to Order successfully!",
              "success",
              4000
            );
          }

          if (targetOrderId) {
            navigate(`/orderdetails/${targetOrderId}`);
          } else {
            navigate("/orders");
          }
        } else {
          const errorMsg = data?.message || "Failed to add items to order. Please try again.";
          if (typeof showSnackbar === "function") {
            showSnackbar(errorMsg, "error", 4000);
          }
        }
      } catch (err) {
        console.error("Order update error:", err);
        if (typeof showSnackbar === "function") {
          showSnackbar("An unexpected error occurred while updating order.", "error", 4000);
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Normal checkout flow
    const orderTypeStr = typeof selectedOrderType === "object"
      ? String(selectedOrderType?.ordertypename || selectedOrderType?.name || "").trim()
      : String(selectedOrderType || "").trim();
    const normalized = orderTypeStr.toLowerCase().replace(/[\s_-]+/g, "");

    const isDelivery = normalized === "delivery";
    const isPickup = normalized === "pickup";
    const isDineIn = normalized.includes("dine");

    if (isDelivery || isPickup || isDineIn) {
      navigate("/checkout");
    } else {
      if (typeof showSnackbar === "function") {
        showSnackbar(
          translations.selectdeliveryorpickup || "Please select an Order Type to proceed to checkout",
          "warning"
        );
      }
    }
  };

  return (
    <div className={`cart-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs - Exact design and position as ManageAddress */}
      <Breadcrumbs
        items={[
          { label: translations.home || "Home", path: "/" },
          { label: translations.cart || "Cart" },
        ]}
      />

      <div className="cart-container">
        {/* Info Cards Row (Order Type, Table No, Order No) - Matches SavoryOps_UserApp */}
        {(effectiveOrderType || (selectedTableNo && isDineIn) || currentOrderNo) && (
          <div className="cart-info-cards-row">
            {effectiveOrderType && (
              <div className="cart-info-card-wrapper">
                <div className="cart-info-card order-type-card">
                  <div className="cart-info-icon-box">
                    {getOrderTypeIcon(effectiveOrderType)}
                  </div>
                  <div className="cart-info-text-box">
                    <span className="cart-info-value">
                      {translations[effectiveOrderType] || effectiveOrderType}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedTableNo && (isDineIn || currentOrderNo) && (
              <div className="cart-info-card-wrapper">
                <div className="cart-info-card table-no-card">
                  <div className="cart-info-icon-box">
                    <TableRestaurantIcon fontSize="small" />
                  </div>
                  <div className="cart-info-text-box">
                    <span className="cart-info-value">{selectedTableNo}</span>
                  </div>
                </div>
              </div>
            )}

            {currentOrderNo && (
              <div className="cart-info-card-wrapper">
                <div className="cart-info-card order-no-card">
                  <div className="cart-info-icon-box">
                    <ReceiptLongOutlinedIcon fontSize="small" />
                  </div>
                  <div className="cart-info-text-box">
                    <span className="cart-info-value">#{currentOrderNo}</span>
                  </div>
                  <button
                    type="button"
                    className="cart-info-cancel-btn"
                    onClick={handleCancelOrderUpdate}
                    title={translations.cancelupdate || "Cancel adding items to this order"}
                    aria-label="Cancel update"
                  >
                    <CloseIcon fontSize="inherit" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        {/* Empty State */}
        {cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <div className="empty-icon-wrap">
              <ShoppingBagOutlinedIcon className="empty-icon" />
            </div>
            <h2 className="empty-title">{translations.yourcartisempty || "Your cart is empty"}</h2>
            <p className="empty-desc">
              {translations.emptycartmessage ||
                "Looks like you haven't added any dishes yet. Explore our artisanal culinary creations to get started!"}
            </p>
            <Link to="/menu" className="empty-browse-btn">
              <RestaurantMenuIcon fontSize="small" />
              <span>{translations.browsemenu || "Explore Menu"}</span>
              <ArrowForwardIcon fontSize="small" />
            </Link>
          </div>
        ) : (
          <>
            {/* Header with Title */}
            <div className="cart-header-row">
              <div className="cart-title-group">
                <h1 className="cart-page-title">{translations.yourcart || "Your Cart"}</h1>
                <span className="cart-badge-count">
                  {totalQuantity} {totalQuantity === 1 ? translations.item || "item" : translations.items || "items"}
                </span>
              </div>
            </div>

            {/* Main Cart Grid */}
            <div className="cart-layout-grid">
              {/* Left Column: Cart Items List */}
              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const itemKey = item.cartItemId || item.itemId;
                  const itemPrice = Number(item.price || 0);
                  const availableAddons =
                    item.availableAddons && item.availableAddons.length > 0
                      ? item.availableAddons
                      : item.addons && item.addons.length > 0
                        ? item.addons
                        : [];
                  const hasAddons = availableAddons.length > 0;
                  const selectedAddons = (item.addons || []).filter(
                    (a) => a && a.selected !== false
                  );
                  const addonsTotal = selectedAddons.reduce(
                    (sum, a) => sum + Number(a.price || 0),
                    0
                  );
                  const itemSubtotal = (itemPrice + addonsTotal) * (Number(item.quantity) || 1);
                  const itemDiet = getDietInfo(item);
                  const showInstructions = Boolean(openNotesMap[item.cartItemId]);

                  return (
                    <div key={itemKey} className="cart-item-card">
                      {/* 1. Item Image Box */}
                      <div className="cart-item-img-wrap">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="cart-item-img"
                            loading="lazy"
                          />
                        ) : (
                          <div className="cart-item-placeholder">
                            <RestaurantMenuIcon fontSize="inherit" />
                          </div>
                        )}
                      </div>

                      {/* 2. Item Content */}
                      <div className="cart-item-details">
                        <div className="cart-item-header">
                          {itemDiet.hasDiet && (
                            <DietIndicator
                              isVeg={itemDiet.isVeg}
                              className="cart-item-diet-badge"
                            />
                          )}
                          <h4 className="cart-item-title">{item.name}</h4>
                        </div>

                        <span className="cart-item-unit-price">
                          {formatPriceFromBranch(itemPrice, selectedBranch)}
                        </span>

                        {/* Add-ons Option Section */}
                        {hasAddons && (
                          <div className="cart-item-addons-wrapper">
                            {selectedAddons.length > 0 ? (
                              <div className="cart-item-addons-list">
                                <div className="cart-addons-header-row">
                                  <span className="cart-addons-label">
                                    {translations.addons || "Add-ons"}:
                                  </span>
                                  <button
                                    type="button"
                                    className="cart-addon-edit-btn"
                                    onClick={() => handleOpenAddonModal(item)}
                                    title="Customize Add-ons"
                                  >
                                    <EditOutlinedIcon fontSize="inherit" />
                                    <span>{translations.customize || "Customize"}</span>
                                  </button>
                                </div>
                                {selectedAddons.map((addon, aIdx) => (
                                  <div key={addon.addonid || aIdx} className="cart-addon-row">
                                    <span className="addon-name">+ {addon.addonname || addon.name}</span>
                                    <span className="addon-price">
                                      +{formatPriceFromBranch(addon.price || 0, selectedBranch)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="cart-addon-prompt-box">
                                <button
                                  type="button"
                                  className="cart-addon-customize-trigger"
                                  onClick={() => handleOpenAddonModal(item)}
                                  title="Add customizations and add-ons"
                                >
                                  <AddCircleOutlineIcon fontSize="inherit" />
                                  <span>{translations.customizableaddons || "+ Add Add-ons"}</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Special Instructions Note */}
                        <div className="cart-item-instructions-box">
                          <button
                            type="button"
                            className="toggle-instructions-btn"
                            onClick={() => toggleInstructions(item.cartItemId)}
                          >
                            <EditNoteIcon fontSize="small" />
                            <span>
                              {item.specialInstructions
                                ? translations.editspecialinstructions || "Edit instructions"
                                : translations.addspecialinstructions || "Add note / instructions"}
                            </span>
                          </button>

                          {(showInstructions || item.specialInstructions) && (
                            <div className="instructions-input-wrap">
                              <textarea
                                className="instructions-input"
                                placeholder={
                                  translations.specialinstructionshint ||
                                  "e.g. Less spicy, dressing on the side..."
                                }
                                value={item.specialInstructions || ""}
                                onChange={(e) =>
                                  handleInstructionsChange(item.cartItemId, e.target.value)
                                }
                                rows={2}
                              />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Actions: Quantity & Subtotal */}
                      <div className="cart-item-actions-side">
                        <span className="cart-item-subtotal">
                          {formatPriceFromBranch(itemSubtotal, selectedBranch)}
                        </span>

                        <div className="cart-actions-bottom-row">
                          {/* Quantity Pill */}
                          <div className="cart-qty-pill">
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleDecrease(item.cartItemId)}
                              aria-label="Decrease quantity"
                            >
                              <RemoveIcon fontSize="inherit" />
                            </button>
                            <span className="qty-val">{item.quantity}</span>
                            <button
                              type="button"
                              className="qty-btn"
                              onClick={() => handleIncrease(item.cartItemId)}
                              aria-label="Increase quantity"
                            >
                              <AddIcon fontSize="inherit" />
                            </button>
                          </div>

                          {/* Delete Item Button */}
                          <button
                            type="button"
                            className="remove-item-btn"
                            onClick={() => handleRemove(item.cartItemId, item.name)}
                            title="Remove from cart"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <DeleteOutlineOutlinedIcon fontSize="small" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column: Bill Details / Order Summary Card */}
              <div className="cart-summary-sidebar">
                <div className="cart-bill-summary-card">
                  <div className="bill-header">
                    <ReceiptLongOutlinedIcon className="bill-icon" />
                    <h3>{translations.billdetails || "Bill Details"}</h3>
                  </div>

                  <div className="bill-rows-container">
                    {/* Sub Total */}
                    <div className="bill-row">
                      <span className="bill-row-label">{translations.subtotal || "Subtotal"}</span>
                      <span className="bill-row-value">
                        {formatPriceFromBranch(billingSummary.subtotal, selectedBranch)}
                      </span>
                    </div>

                    {/* Before Tax Charges */}
                    {billingSummary.beforeTaxCharges.map((charge, idx) => {
                      const name = charge.name || charge.chargename || charge.eventname;
                      const val = charge.val ?? charge.chargevalue ?? charge.value;
                      const isPct = String(charge.chargetype || charge.chargeType || charge.type || "").toLowerCase().trim() === "percentage";
                      const hasVal = val != null && val !== "";
                      return (
                        <div className="bill-row bill-charge-row" key={charge.id || `btc-${idx}`}>
                          <span className="bill-row-label">
                            {name}{isPct && hasVal ? ` (${val}%)` : ""}
                          </span>
                          <span className="bill-row-value">
                            {formatPriceFromBranch(charge.amount, selectedBranch)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Exclusive Taxes */}
                    {billingSummary.taxRows.map((tax, idx) => {
                      const isPct = String(tax.taxtype || tax.taxType || tax.type || "").toLowerCase().trim() === "percentage";
                      const taxRate = tax.price ?? tax.rate ?? 0;
                      const taxAmount = typeof tax.amount === "number"
                        ? tax.amount
                        : (typeof tax.calculatedAmount === "number"
                          ? tax.calculatedAmount
                          : (isPct
                            ? billingSummary.subtotal * (parseFloat(taxRate) / 100)
                            : parseFloat(taxRate)));
                      const hasRate = taxRate != null && taxRate !== "" && Number(taxRate) > 0;
                      return (
                        <div className="bill-row bill-tax-row" key={tax.taxid || tax._id || tax.taxname || `tax-${idx}`}>
                          <span className="bill-row-label bill-tax-label">
                            <AddIcon className="tax-plus-icon" />
                            <span>{tax.taxname}{isPct && hasRate ? ` (${taxRate}%)` : ""}</span>
                          </span>
                          <span className="bill-row-value">
                            {formatPriceFromBranch(taxAmount, selectedBranch)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Total Tax Summary Line */}
                    {billingSummary.taxRows.length > 0 && (
                      <div className="bill-row bill-total-tax-row">
                        <span className="bill-row-label bill-total-tax-label">
                          {translations.totaltax || "Total Tax"}
                        </span>
                        <span className="bill-row-value bill-total-tax-value">
                          {formatPriceFromBranch(billingSummary.totalExclusiveTax, selectedBranch)}
                        </span>
                      </div>
                    )}

                    {/* After Tax Charges */}
                    {billingSummary.afterTaxCharges.map((charge, idx) => {
                      const name = charge.name || charge.chargename || charge.eventname;
                      const val = charge.val ?? charge.chargevalue ?? charge.value;
                      const isPct = String(charge.chargetype || charge.chargeType || charge.type || "").toLowerCase().trim() === "percentage";
                      const hasVal = val != null && val !== "";
                      return (
                        <div className="bill-row bill-charge-row" key={charge.id || `atc-${idx}`}>
                          <span className="bill-row-label">
                            {name}{isPct && hasVal ? ` (${val}%)` : ""}
                          </span>
                          <span className="bill-row-value">
                            {formatPriceFromBranch(charge.amount, selectedBranch)}
                          </span>
                        </div>
                      );
                    })}

                    {/* Round Off Line */}
                    {Boolean(billingSummary.roundoff && (billingSummary.roundoff.status === true || billingSummary.roundoff.status === "true")) && (
                      <div className="bill-row bill-roundoff-row">
                        <span className="bill-row-label">
                          {translations.roundoff || "Round Off"}
                        </span>
                        <span className="bill-row-value">
                          {(billingSummary.roundoff.roundedAmount ?? 0) > 0
                            ? `+${formatPriceFromBranch(billingSummary.roundoff.roundedAmount, selectedBranch)}`
                            : (billingSummary.roundoff.roundedAmount ?? 0) < 0
                              ? `-${formatPriceFromBranch(Math.abs(billingSummary.roundoff.roundedAmount), selectedBranch)}`
                              : formatPriceFromBranch(0, selectedBranch)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="bill-divider" />

                  <div className="bill-grand-total-row">
                    <span className="grand-total-label">{translations.grandtotal || "To Pay"}</span>
                    <span className="grand-total-value">
                      {formatPriceFromBranch(grandTotal, selectedBranch)}
                    </span>
                  </div>

                  {/* Proceed to Checkout CTA / Update Order CTA */}
                  <button
                    type="button"
                    className="cart-checkout-btn"
                    onClick={handleProceedCheckout}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <CircularProgress size={18} color="inherit" />
                        <span>{translations.updatingorder || "Updating Order..."}</span>
                      </>
                    ) : currentOrderNo ? (
                      <>
                        <span>{translations.additemstoorder || "Add Items to Order"} #{currentOrderNo}</span>
                        <AddIcon fontSize="small" />
                      </>
                    ) : (
                      <>
                        <span>{translations.proceedtocheckout || "Proceed to Checkout"}</span>
                        <ArrowForwardIcon fontSize="small" />
                      </>
                    )}
                  </button>

                  {/* Continue Shopping Secondary CTA */}
                  <button
                    type="button"
                    className="cart-continue-btn"
                    onClick={() => navigate("/menu")}
                  >
                    <ArrowBackIcon fontSize="small" />
                    <span>{translations.addmoreitems || "Add More Items"}</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* --- Add-on Customization Popup Modal --- */}
      {editingCartItem && (
        <div
          className="dish-modal-overlay addon-modal-overlay"
          onClick={() => setEditingCartItem(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="addon-modal-card cart-addon-edit-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="addon-modal-header">
              <div className="addon-header-main">
                <div className="addon-header-title-row">
                  {(() => {
                    const modalDiet = getDietInfo(editingCartItem);
                    return (
                      modalDiet.hasDiet && (
                        <DietIndicator
                          isVeg={modalDiet.isVeg}
                          className="addon-header-diet"
                        />
                      )
                    );
                  })()}
                  <h3 className="addon-modal-item-title">
                    {editingCartItem.name}
                  </h3>
                </div>
                <div className="addon-modal-price-meta">
                  <span className="addon-base-price">
                    {formatPriceFromBranch(editingCartItem.price, selectedBranch)}
                  </span>
                  <span className="addon-edit-tag">
                    {translations.customizeaddons || "Customize Add-ons"}
                  </span>
                </div>
              </div>

              {editingCartItem.image && (
                <div className="addon-modal-thumb-box">
                  <img
                    src={editingCartItem.image}
                    alt={editingCartItem.name}
                    className="addon-modal-thumb"
                  />
                </div>
              )}

              <button
                type="button"
                className="addon-modal-close-btn"
                onClick={() => setEditingCartItem(null)}
                aria-label="Close"
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            {/* Modal Body: Addons Checklist */}
            <div className="addon-selection-section">
              <div className="addon-section-title-wrap">
                <h4 className="addon-section-title">
                  {translations.chooseaddons || "Select Your Add-ons"}
                </h4>
              </div>

              <div className="addon-options-list">
                {modalAvailableAddons.map((addon) => {
                  const addonKey = String(addon.addonid || addon._id || addon.id);
                  const isChecked = selectedModalAddonIds.includes(addonKey);

                  return (
                    <label
                      key={addonKey}
                      className={`addon-option-item ${isChecked ? "is-selected" : ""}`}
                    >
                      <div className="addon-option-left">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleModalAddon(addonKey)}
                          className="addon-option-checkbox"
                        />
                        <span className="addon-option-name">
                          {addon.addonname || addon.name}
                        </span>
                      </div>
                      <span className="addon-option-price">
                        +{formatPriceFromBranch(addon.price || 0, selectedBranch)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Sticky Footer */}
            <div className="addon-modal-footer">
              <div className="addon-modal-total-preview">
                <span className="total-preview-label">{translations.itemtotal || "Item Total"}:</span>
                <span className="total-preview-val">
                  {formatPriceFromBranch(modalComputedTotal, selectedBranch)}
                </span>
              </div>

              <button
                type="button"
                className="addon-add-cart-btn cart-save-addons-btn"
                onClick={handleSaveAddons}
              >
                <span>{translations.updateaddons || "Update Add-ons"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
