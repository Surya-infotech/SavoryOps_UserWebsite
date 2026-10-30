import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import EditLocationAltOutlinedIcon from "@mui/icons-material/EditLocationAltOutlined";
import AddLocationAltOutlinedIcon from "@mui/icons-material/AddLocationAltOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import { getCart, clearCart } from "../../utils/cartService.js";
import { computeCartBilling } from "../../utils/billingCalculator.js";
import "../../Scss/Pages/Cart/checkoutpage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const formatAddressLine = (addr) => {
  if (!addr) return "";
  const parts = [addr.address, addr.city, addr.state, addr.country].filter(Boolean);
  const line = parts.join(", ");
  return addr.postalcode ? `${line} - ${addr.postalcode}` : line;
};

const getAddressTypeIcon = (type) => {
  const norm = String(type || "").toLowerCase().trim();
  if (norm === "work") return <WorkOutlineOutlinedIcon fontSize="small" />;
  if (norm === "other") return <PlaceOutlinedIcon fontSize="small" />;
  return <HomeOutlinedIcon fontSize="small" />;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const { showSnackbar } = useSnackbar();
  const businessDisplayName = business?.businessname || "";

  const [cartItems, setCartItems] = useState(getCart);
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType") || "Delivery";
  });
  const [posPayload, setPosPayload] = useState(() => {
    return typeof window !== "undefined" ? window.__branchSetting : null;
  });

  // Checkout Specific States
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("Online");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Add Address Modal States
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newAddressType, setNewAddressType] = useState("home");
  const [newStreetAddress, setNewStreetAddress] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newCountry, setNewCountry] = useState("");
  const [newPostalCode, setNewPostalCode] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Normalize order type
  const orderTypeStr = typeof selectedOrderType === "object"
    ? String(selectedOrderType?.ordertypename || selectedOrderType?.name || "").trim()
    : String(selectedOrderType || "").trim();
  const normalizedOrderType = orderTypeStr.toLowerCase().replace(/[\s_-]+/g, "");
  const isDelivery = normalizedOrderType === "delivery";
  const isPickup = normalizedOrderType === "pickup";
  const resolvedOrderTypeName = isDelivery ? "Delivery" : isPickup ? "Pickup" : (orderTypeStr || "Pickup");

  // Sync Branch, Order Type, Branch Setting, and Cart
  useEffect(() => {
    const handleCartUpdated = (e) => {
      const items = e?.detail || getCart();
      setCartItems(items);
      if (!items || items.length === 0) {
        navigate("/cart", { replace: true });
      }
    };

    const handleBranchChange = (e) => {
      if (e?.detail) setSelectedBranch(e.detail);
      else setSelectedBranch(getActiveBranch());
    };

    const handleOrderTypeChange = (e) => {
      const ot = e?.detail?.orderType;
      if (ot) setSelectedOrderType(ot);
    };

    const handleBranchSettingChange = (e) => {
      if (e?.detail) setPosPayload(e.detail);
    };

    const handleStorage = (e) => {
      if (e.key === "selectedOrderType" && e.newValue) {
        setSelectedOrderType(e.newValue);
      }
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("branchChange", handleBranchChange);
    window.addEventListener("orderTypeChange", handleOrderTypeChange);
    window.addEventListener("branchSettingChange", handleBranchSettingChange);
    window.addEventListener("storage", handleStorage);

    window.dispatchEvent(new CustomEvent("requestBranch"));
    window.dispatchEvent(new CustomEvent("requestBranchSetting"));

    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("branchChange", handleBranchChange);
      window.removeEventListener("orderTypeChange", handleOrderTypeChange);
      window.removeEventListener("branchSettingChange", handleBranchSettingChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [navigate]);

  // If cart is empty, redirect back to cart
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) {
      navigate("/cart", { replace: true });
    }
  }, [cartItems, navigate]);

  // Adjust default payment method per order type (UserApp rule)
  useEffect(() => {
    if (isDelivery) {
      setSelectedPaymentMethod("Online");
    }
  }, [isDelivery]);

  // Fetch Delivery Addresses when order type is delivery
  const fetchAddresses = useCallback(async () => {
    if (!isDelivery) return;
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId || !token) return;

    setLoadingAddresses(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/GetManageAddress/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : [];
        setAddresses(list);
        if (list.length > 0) {
          setSelectedAddress((prev) => {
            if (prev) {
              const matched = list.find((a) => (a._id || a.addressid) === (prev._id || prev.addressid));
              return matched || list[0];
            }
            return list[0];
          });
        }
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  }, [isDelivery]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Dynamic document title
  useEffect(() => {
    document.title = `${translations.checkout || "Checkout"} | ${businessDisplayName || "SavoryOps"}`;
  }, [translations, businessDisplayName]);

  // Billing Calculations
  const billingSummary = useMemo(() => {
    return computeCartBilling(cartItems, posPayload, selectedOrderType);
  }, [cartItems, posPayload, selectedOrderType]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [cartItems]);

  // Handle Quick Add Address
  const handleSaveQuickAddress = async (e) => {
    e.preventDefault();
    if (!newStreetAddress.trim() || !newCity.trim()) {
      showSnackbar("Please enter street address and city", "warning");
      return;
    }

    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);
    if (!customerId || !token) {
      showSnackbar(translations.pleasesignintoorder || "Please sign in", "error");
      return;
    }

    setIsSavingAddress(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/AddManageAddress/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            addresstype: newAddressType,
            address: newStreetAddress.trim(),
            city: newCity.trim(),
            state: newState.trim(),
            country: newCountry.trim(),
            postalcode: newPostalCode.trim(),
          }),
        }
      );

      if (response.ok) {
        showSnackbar("Address added successfully", "success");
        setIsAddAddressModalOpen(false);
        setNewStreetAddress("");
        setNewCity("");
        setNewState("");
        setNewCountry("");
        setNewPostalCode("");
        await fetchAddresses();
      } else {
        const data = await response.json().catch(() => ({}));
        showSnackbar(data.message || "Failed to save address", "error");
      }
    } catch (err) {
      console.error("Error saving address:", err);
      showSnackbar("Failed to save address", "error");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Handle Add Order
  const handlePlaceOrder = async () => {
    if (isSubmitting) return;

    if (!selectedPaymentMethod) {
      showSnackbar(translations.selectpaymentmethod || "Please select a payment method", "error");
      return;
    }

    if (isDelivery && !selectedAddress) {
      showSnackbar(translations.selectdeliveryaddress || "Please select a delivery address", "error");
      return;
    }

    if (!cartItems.length) {
      showSnackbar(translations.emptycartmessage || "Your cart is empty", "error");
      navigate("/cart");
      return;
    }

    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId || !token) {
      showSnackbar(translations.pleasesignintoorder || "Please sign in to place order", "error");
      navigate("/signin", { state: { from: "/checkout" } });
      return;
    }

    const branchId = selectedBranch?.branchid || selectedBranch?.id || selectedBranch?._id;
    if (!branchId) {
      showSnackbar("Branch information not found. Please try again.", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Build order items matching SavoryOps_UserApp structure
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
        ordertype: resolvedOrderTypeName,
        paymentmethod: selectedPaymentMethod,
        taxApplicationMode: posPayload?.taxApplicationMode || "apply_all",
        inclusiveTaxIncreasesPrice: Boolean(posPayload?.inclusiveTaxIncreasesPrice),
        itemTaxOverridesBranch: Boolean(posPayload?.itemTaxOverridesBranch),
        itemTaxOverridesOrderType: Boolean(posPayload?.itemTaxOverridesOrderType),
        orderTypeTaxOverridesBranch: Boolean(posPayload?.orderTypeTaxOverridesBranch),
      };

      if (isDelivery && selectedAddress) {
        const locationId = selectedAddress.addressid || selectedAddress._id || selectedAddress.locationid;
        orderData.locationid = locationId;
        const fullAddr = formatAddressLine(selectedAddress);
        orderData.deliveryAddress = fullAddr;
        orderData.address = fullAddr;
      }

      const response = await fetch(
        `${adminPanelBackendPath}/Customer/Order/AddOrder/${customerId}/${branchId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        clearCart();
        showSnackbar(
          translations.orderplacedsuccessfully || "Order placed successfully!",
          "success",
          4000
        );
        navigate("/orders");
      } else {
        const errorMsg = data?.message || "Failed to process order. Please try again.";
        showSnackbar(errorMsg, "error", 4000);
      }
    } catch (err) {
      console.error("Order submission error:", err);
      showSnackbar("An unexpected error occurred while placing order.", "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="checkout-page-wrapper">
      <div className="checkout-container">
        {/* Breadcrumbs */}
        <Breadcrumbs currentPage={translations.checkout || "Checkout"} />

        {/* Page Header */}
        <div className="checkout-header-row">
          <div className="checkout-title-group">
            <h1 className="checkout-page-title">{translations.checkout || "Checkout"}</h1>
            <div className={`checkout-ordertype-pill ${isDelivery ? "delivery" : "pickup"}`}>
              {isDelivery ? <DeliveryDiningIcon fontSize="small" /> : <StorefrontIcon fontSize="small" />}
              <span>{resolvedOrderTypeName}</span>
            </div>
          </div>
          <button type="button" className="back-to-cart-btn" onClick={() => navigate("/cart")}>
            <ArrowBackIcon fontSize="small" />
            <span>{translations.backtocart || "Back to Cart"}</span>
          </button>
        </div>

        {/* Checkout Main Grid */}
        <div className="checkout-layout-grid">
          {/* Left Column: Delivery Address & Payment Method */}
          <div className="checkout-main-content">
            {/* 1. Delivery Address Card (Shown ONLY when order type is Delivery) */}
            {isDelivery && (
              <div className="checkout-card delivery-address-card">
                <div className="checkout-card-header">
                  <div className="card-header-left">
                    <LocationOnOutlinedIcon className="section-header-icon" />
                    <h3 className="section-title">
                      {translations.deliveryaddress || "Delivery Address"}
                    </h3>
                  </div>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      className="card-header-action-btn"
                      onClick={() => setIsAddressModalOpen(true)}
                    >
                      <EditLocationAltOutlinedIcon fontSize="small" />
                      <span>{translations.changeaddress || "Change"}</span>
                    </button>
                  )}
                </div>

                <div className="delivery-address-body">
                  {loadingAddresses ? (
                    <div className="address-loading-wrap">
                      <CircularProgress size={24} color="inherit" />
                      <span>Loading addresses...</span>
                    </div>
                  ) : selectedAddress ? (
                    <div
                      className="selected-address-card"
                      onClick={() => setIsAddressModalOpen(true)}
                    >
                      <div className="address-type-badge">
                        {getAddressTypeIcon(selectedAddress.addresstype)}
                        <span>{selectedAddress.addresstype || "Home"}</span>
                      </div>
                      <p className="selected-address-text">
                        {formatAddressLine(selectedAddress)}
                      </p>
                    </div>
                  ) : (
                    <div className="no-address-state">
                      <p className="no-address-hint">
                        {translations.noaddressesfororder || "No saved delivery addresses found."}
                      </p>
                      <button
                        type="button"
                        className="select-add-address-btn"
                        onClick={() => setIsAddAddressModalOpen(true)}
                      >
                        <AddLocationAltOutlinedIcon fontSize="small" />
                        <span>{translations.addnewaddress || "Add New Address"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Payment Method Card */}
            <div className="checkout-card payment-method-card">
              <div className="checkout-card-header">
                <div className="card-header-left">
                  <AccountBalanceWalletOutlinedIcon className="section-header-icon" />
                  <h3 className="section-title">
                    {translations.paymentmethod || "Payment Method"}
                  </h3>
                </div>
              </div>

              <div className="payment-options-grid">
                {/* Cash Option (Hidden when order type is Delivery, shown for Pickup) */}
                {!isDelivery && (
                  <button
                    type="button"
                    className={`payment-option-pill ${selectedPaymentMethod === "Cash" ? "active" : ""}`}
                    onClick={() => setSelectedPaymentMethod("Cash")}
                  >
                    <div className="option-icon-wrap">
                      <PaymentsOutlinedIcon />
                    </div>
                    <div className="option-info">
                      <span className="option-title">{translations.cash || "Cash"}</span>
                      <span className="option-subtitle">Pay at counter</span>
                    </div>
                    {selectedPaymentMethod === "Cash" && (
                      <CheckCircleIcon className="option-check-icon" />
                    )}
                  </button>
                )}

                {/* Online Option */}
                <button
                  type="button"
                  className={`payment-option-pill ${selectedPaymentMethod === "Online" ? "active" : ""}`}
                  onClick={() => setSelectedPaymentMethod("Online")}
                >
                  <div className="option-icon-wrap">
                    <CreditCardOutlinedIcon />
                  </div>
                  <div className="option-info">
                    <span className="option-title">{translations.online || "Online"}</span>
                    <span className="option-subtitle">Credit / Debit Card / Netbanking</span>
                  </div>
                  {selectedPaymentMethod === "Online" && (
                    <CheckCircleIcon className="option-check-icon" />
                  )}
                </button>
              </div>
            </div>

            {/* 3. Items Preview Card */}
            <div className="checkout-card order-items-card">
              <div className="checkout-card-header">
                <div className="card-header-left">
                  <RestaurantMenuIcon className="section-header-icon" />
                  <h3 className="section-title">
                    {translations.orderitems || "Order Items"} ({totalQuantity})
                  </h3>
                </div>
                <Link to="/cart" className="card-header-action-btn">
                  <span>Edit Cart</span>
                </Link>
              </div>

              <div className="checkout-items-list">
                {cartItems.map((item, idx) => {
                  const itemTotal = (Number(item.price || 0) + (item.addons || []).filter(a => a && a.selected !== false).reduce((s, a) => s + Number(a.price || 0), 0)) * (Number(item.quantity) || 1);
                  return (
                    <div key={item.cartItemId || idx} className="checkout-item-row">
                      <div className="checkout-item-main">
                        <span className="checkout-item-qty">{item.quantity}x</span>
                        <div className="checkout-item-names">
                          <span className="checkout-item-title">{item.name}</span>
                          {(item.addons || []).filter(a => a && a.selected !== false).length > 0 && (
                            <span className="checkout-item-addons">
                              + {(item.addons || []).filter(a => a && a.selected !== false).map(a => a.addonname || a.name).join(", ")}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="checkout-item-price">
                        {formatPriceFromBranch(itemTotal, selectedBranch)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Bill Details & Add Order Button */}
          <div className="checkout-sidebar">
            <div className="cart-bill-summary-card checkout-bill-card">
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
                  {formatPriceFromBranch(billingSummary.grandTotal, selectedBranch)}
                </span>
              </div>

              {/* Add Order Button */}
              <button
                type="button"
                className="cart-checkout-btn add-order-btn"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || (isDelivery && !selectedAddress) || !selectedPaymentMethod}
              >
                {isSubmitting ? (
                  <CircularProgress size={22} color="inherit" />
                ) : (
                  <>
                    <span>{translations.addorder || "Add Order"}</span>
                    <ArrowForwardIcon fontSize="small" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Select Delivery Address Modal (Sheet) --- */}
      {isAddressModalOpen && (
        <div
          className="dish-modal-overlay"
          onClick={() => setIsAddressModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="addon-modal-card address-sheet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="addon-modal-header">
              <div className="addon-header-main">
                <h3 className="addon-modal-item-title">
                  {translations.selectaddress || "Select Delivery Address"}
                </h3>
              </div>
              <button
                type="button"
                className="addon-modal-close-btn"
                onClick={() => setIsAddressModalOpen(false)}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <div className="address-modal-list">
              {addresses.length === 0 ? (
                <div className="empty-address-modal-state">
                  <p>{translations.noaddressesfororder || "No saved addresses found."}</p>
                  <button
                    type="button"
                    className="modal-add-addr-btn"
                    onClick={() => {
                      setIsAddressModalOpen(false);
                      setIsAddAddressModalOpen(true);
                    }}
                  >
                    <AddIcon fontSize="small" />
                    <span>{translations.addnewaddress || "Add New Address"}</span>
                  </button>
                </div>
              ) : (
                addresses.map((item) => {
                  const locationId = item._id || item.addressid;
                  const isSelected =
                    selectedAddress &&
                    (selectedAddress._id || selectedAddress.addressid) === locationId;

                  return (
                    <div
                      key={String(locationId)}
                      className={`address-modal-card ${isSelected ? "is-selected" : ""}`}
                      onClick={() => {
                        setSelectedAddress(item);
                        setIsAddressModalOpen(false);
                      }}
                    >
                      <div className="address-modal-left">
                        <div className="address-modal-type">
                          {getAddressTypeIcon(item.addresstype)}
                          <span>{item.addresstype || "Home"}</span>
                        </div>
                        <p className="address-modal-full-text">
                          {formatAddressLine(item)}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircleIcon className="address-modal-check-icon" />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="address-modal-footer">
              <button
                type="button"
                className="modal-add-addr-btn secondary"
                onClick={() => {
                  setIsAddressModalOpen(false);
                  setIsAddAddressModalOpen(true);
                }}
              >
                <AddIcon fontSize="small" />
                <span>{translations.addnewaddress || "Add New Address"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Quick Add Address Modal --- */}
      {isAddAddressModalOpen && (
        <div
          className="dish-modal-overlay"
          onClick={() => setIsAddAddressModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="addon-modal-card quick-add-address-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="addon-modal-header">
              <div className="addon-header-main">
                <h3 className="addon-modal-item-title">
                  {translations.addnewaddress || "Add New Address"}
                </h3>
              </div>
              <button
                type="button"
                className="addon-modal-close-btn"
                onClick={() => setIsAddAddressModalOpen(false)}
              >
                <CloseIcon fontSize="small" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickAddress} className="quick-address-form">
              <div className="address-type-selector">
                {["home", "work", "other"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`type-chip ${newAddressType === type ? "active" : ""}`}
                    onClick={() => setNewAddressType(type)}
                  >
                    {getAddressTypeIcon(type)}
                    <span>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </button>
                ))}
              </div>

              <div className="form-group">
                <label>Street Address *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123 Gourmet Blvd, Apt 4B"
                  value={newStreetAddress}
                  onChange={(e) => setNewStreetAddress(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. New York"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input
                    type="text"
                    placeholder="e.g. NY"
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Country</label>
                  <input
                    type="text"
                    placeholder="e.g. United States"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Postal / ZIP Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 10001"
                    value={newPostalCode}
                    onChange={(e) => setNewPostalCode(e.target.value)}
                  />
                </div>
              </div>

              <div className="quick-address-footer">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setIsAddAddressModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="save-btn"
                  disabled={isSavingAddress}
                >
                  {isSavingAddress ? "Saving..." : "Save Address"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckoutPage;

