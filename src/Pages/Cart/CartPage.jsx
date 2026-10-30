import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
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
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import {
  getCart,
  saveCart,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  updateCartItemInstructions,
  updateCartItemAddons,
} from "../../utils/cartService.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import { computeCartBilling } from "../../utils/billingCalculator.js";
import "../../Scss/Pages/Cart/cartpage.scss";

const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

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

const CartPage = () => {
  const navigate = useNavigate();
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const { showSnackbar } = useSnackbar();
  const businessDisplayName = business?.businessname || "";

  const [cartItems, setCartItems] = useState(getCart);
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const [openNotesMap, setOpenNotesMap] = useState({});
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType");
  });
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

  const handleClearCart = () => {
    if (window.confirm(translations.clearcartconfirm || "Are you sure you want to clear your cart?")) {
      clearCart();
      if (typeof showSnackbar === "function") {
        showSnackbar("Cart cleared", "info", 2500);
      }
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

  const subtotal = billingSummary.subtotal;
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

  const handleProceedCheckout = () => {
    if (!cartItems.length) {
      if (typeof showSnackbar === "function") {
        showSnackbar(translations.emptycartmessage || "Your cart is empty", "warning");
      }
      return;
    }

    const orderTypeStr = typeof selectedOrderType === "object"
      ? String(selectedOrderType?.ordertypename || selectedOrderType?.name || "").trim()
      : String(selectedOrderType || "").trim();
    const normalized = orderTypeStr.toLowerCase().replace(/[\s_-]+/g, "");

    const isDelivery = normalized === "delivery";
    const isPickup = normalized === "pickup";

    if (isDelivery || isPickup) {
      const token = localStorage.getItem(customerTokenName);
      const customerId = localStorage.getItem(customerIdName);

      if (!token || !customerId) {
        if (typeof showSnackbar === "function") {
          showSnackbar(
            translations.pleasesignintoorder || "Please sign in to proceed to checkout",
            "info"
          );
        }
        navigate("/signin", { state: { from: "/checkout" } });
        return;
      }

      navigate("/checkout");
    } else {
      if (typeof showSnackbar === "function") {
        showSnackbar(
          translations.selectdeliveryorpickup || "Please select Delivery or Pickup to proceed to checkout",
          "warning"
        );
      }
    }
  };

  return (
    <div className="cart-page-wrapper">
      <div className="cart-container">
        {/* Breadcrumbs */}
        <Breadcrumbs currentPage={translations.cart || "Cart"} />

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

                  {/* Proceed to Checkout CTA */}
                  <button
                    type="button"
                    className="cart-checkout-btn"
                    onClick={handleProceedCheckout}
                  >
                    <span>{translations.proceedtocheckout || "Proceed to Checkout"}</span>
                    <ArrowForwardIcon fontSize="small" />
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
