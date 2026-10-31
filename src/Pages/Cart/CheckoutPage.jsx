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
import MarkunreadMailboxOutlinedIcon from "@mui/icons-material/MarkunreadMailboxOutlined";
import { Country, State, City } from "country-state-city";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import { getCart, clearCart, saveCart } from "../../utils/cartService.js";
import { computeCartBilling } from "../../utils/billingCalculator.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import "../../Scss/Pages/Cart/checkoutpage.scss";
import "../../Scss/Pages/Profile/manageaddress.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ADDRESS_TYPES = [
  { id: "home", label: "Home", icon: HomeOutlinedIcon },
  { id: "work", label: "Work", icon: WorkOutlineOutlinedIcon },
  { id: "other", label: "Other", icon: PlaceOutlinedIcon },
];

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

  // Add Address Modal States (Parity with ManageAddressPage)
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [addressType, setAddressType] = useState("home");
  const [streetAddress, setStreetAddress] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [pincode, setPincode] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Form Validation Errors
  const [addressError, setAddressError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [stateError, setStateError] = useState("");
  const [cityError, setCityError] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  // Country, State, City lists
  const countries = useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      name: c.name,
      isoCode: c.isoCode,
    }));
  }, []);

  const states = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((s) => ({
      name: s.name,
      isoCode: s.isoCode,
    }));
  }, [countryCode]);

  const cities = useMemo(() => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map((c) => ({
      name: c.name,
    }));
  }, [countryCode, stateCode]);

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

  // Dynamically recalculate cart item prices when order type or branch tax settings change
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


  // Adjust default payment method per order type (UserApp rule)
  useEffect(() => {
    if (isDelivery) {
      setSelectedPaymentMethod("Online");
    }
  }, [isDelivery]);

  // Fetch Delivery Addresses when order type is delivery
  const fetchAddresses = useCallback(async (selectAddressId = null) => {
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
          if (selectAddressId) {
            const matched = list.find((a) => (a._id || a.addressid) === selectAddressId);
            if (matched) {
              setSelectedAddress(matched);
              return;
            }
          }
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

  // Open modal for Adding new address (reset all fields & errors)
  const handleOpenAddAddressModal = () => {
    setAddressType("home");
    setStreetAddress("");
    setCountryCode("");
    setCountryName("");
    setStateCode("");
    setStateName("");
    setCityName("");
    setPincode("");

    setAddressError("");
    setCountryError("");
    setStateError("");
    setCityError("");
    setPincodeError("");

    setIsAddAddressModalOpen(true);
  };

  const handleCloseAddAddressModal = () => {
    if (isSavingAddress) return;
    setIsAddAddressModalOpen(false);
  };

  // Country Change Handler in Form
  const handleCountryChange = (isoCode) => {
    setCountryCode(isoCode);
    const found = countries.find((c) => c.isoCode === isoCode);
    setCountryName(found ? found.name : "");
    setStateCode("");
    setStateName("");
    setCityName("");
    if (countryError) setCountryError("");
  };

  // State Change Handler in Form
  const handleStateChange = (isoCode) => {
    setStateCode(isoCode);
    const found = states.find((s) => s.isoCode === isoCode);
    setStateName(found ? found.name : "");
    setCityName("");
    if (stateError) setStateError("");
  };

  // City Change Handler in Form
  const handleCityChange = (val) => {
    setCityName(val);
    if (cityError) setCityError("");
  };

  // Save / Update Address Submission
  const handleSaveNewAddress = async (e) => {
    e.preventDefault();

    let isValid = true;

    if (!streetAddress.trim()) {
      setAddressError(translations.addressrequired || "Street address is required");
      isValid = false;
    } else {
      setAddressError("");
    }

    if (!countryName) {
      setCountryError(translations.countryrequired || "Country is required");
      isValid = false;
    } else {
      setCountryError("");
    }

    if (!stateName) {
      setStateError(translations.staterequired || "State is required");
      isValid = false;
    } else {
      setStateError("");
    }

    if (!cityName) {
      setCityError(translations.cityrequired || "City is required");
      isValid = false;
    } else {
      setCityError("");
    }

    if (!pincode.trim()) {
      setPincodeError(translations.pincoderequired || "Postal code is required");
      isValid = false;
    } else if (pincode.trim().length < 3) {
      setPincodeError(translations.pincodeinvalid || "Postal code is too short");
      isValid = false;
    } else {
      setPincodeError("");
    }

    if (!isValid) return;

    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);
    if (!customerId || !token) {
      showSnackbar(translations.pleasesignintoorder || "Please sign in to order", "error");
      return;
    }

    setIsSavingAddress(true);
    const payload = {
      address: streetAddress.trim(),
      addresstype: addressType,
      country: countryName,
      state: stateName,
      city: cityName,
      postalcode: pincode.trim(),
    };

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
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const resData = await response.json().catch(() => ({}));
        showSnackbar(translations.addressaddedsuccess || "Address added successfully", "success");
        setIsAddAddressModalOpen(false);
        const newId = resData?.data?._id || resData?._id || resData?.addressid;
        await fetchAddresses(newId);
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

    const branchId = selectedBranch?.branchid;
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
        `${adminPanelBackendPath}/Website/Order/AddOrder/${customerId}/${branchId}`,
        {
          method: "POST",
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
                        onClick={handleOpenAddAddressModal}
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
                      handleOpenAddAddressModal();
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
                  handleOpenAddAddressModal();
                }}
              >
                <AddIcon fontSize="small" />
                <span>{translations.addnewaddress || "Add New Address"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD NEW ADDRESS MODAL (Exact design and details matching Manage Address / Image 2) --- */}
      {isAddAddressModalOpen && (
        <div className="address-modal-overlay" onClick={handleCloseAddAddressModal}>
          <div
            className="address-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="checkout-address-modal-title"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h2 id="checkout-address-modal-title" className="modal-title">
                {translations.addaddress || translations.addnewaddress || "Add New Address"}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseAddAddressModal}
                disabled={isSavingAddress}
                aria-label="Close dialog"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveNewAddress} className="address-modal-form" noValidate autoComplete="off">
              {/* Address Type Chips */}
              <div className="form-group span-full">
                <label className="form-label">
                  {translations.addresstype || "Address Type"}
                </label>
                <div className="address-type-selector">
                  {ADDRESS_TYPES.map((typeObj) => {
                    const isSelected = addressType === typeObj.id;
                    const IconComp = typeObj.icon;
                    return (
                      <button
                        key={typeObj.id}
                        type="button"
                        className={`type-select-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => setAddressType(typeObj.id)}
                      >
                        <IconComp fontSize="small" />
                        <span>{translations[typeObj.id] || typeObj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Street Address */}
              <div className="form-group span-full">
                <label className="form-label" htmlFor="checkout-address-street">
                  {translations.address || "Street Address"} <span className="req">*</span>
                </label>
                <div className={`textarea-field-wrap ${addressError ? "has-error" : ""}`}>
                  <HomeOutlinedIcon className="field-icon textarea-icon" />
                  <textarea
                    id="checkout-address-street"
                    name="modal_addr_street"
                    rows={2}
                    className="textarea-input"
                    placeholder={translations.streetaddressplaceholder || "House/Apartment number, street name, landmark"}
                    autoComplete="off"
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      if (addressError) setAddressError("");
                    }}
                  />
                </div>
                {addressError && <span className="field-error-msg">{addressError}</span>}
              </div>

              {/* Country Dropdown */}
              <div className="form-group">
                <Dropdown
                  id="checkout-address-country-dropdown"
                  label={translations.country || "Country"}
                  required={true}
                  options={countries}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={countryCode}
                  onValueChange={handleCountryChange}
                  placeholder={translations.countryselect || "Select Country"}
                  showSearch={true}
                />
                {countryError && <span className="field-error-msg">{countryError}</span>}
              </div>

              {/* State Dropdown */}
              <div className="form-group">
                <Dropdown
                  id="checkout-address-state-dropdown"
                  label={translations.state || "State"}
                  required={true}
                  options={states}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={stateCode}
                  onValueChange={handleStateChange}
                  placeholder={
                    countryCode ? (translations.stateselect || "Select State") : (translations.selectcountryfirst || "Select Country First")
                  }
                  disabled={!countryCode || states.length === 0}
                  showSearch={true}
                />
                {stateError && <span className="field-error-msg">{stateError}</span>}
              </div>

              {/* City Dropdown */}
              <div className="form-group">
                <Dropdown
                  id="checkout-address-city-dropdown"
                  label={translations.city || "City"}
                  required={true}
                  options={cities}
                  labelKey="name"
                  valueKey="name"
                  selectedValue={cityName}
                  onValueChange={handleCityChange}
                  placeholder={
                    stateCode ? (translations.cityselect || "Select City") : (translations.selectstatefirst || "Select State First")
                  }
                  disabled={!stateCode || cities.length === 0}
                  showSearch={true}
                />
                {cityError && <span className="field-error-msg">{cityError}</span>}
              </div>

              {/* Postal Code / Pincode */}
              <div className="form-group">
                <label className="form-label" htmlFor="checkout-address-postalcode">
                  {translations.postalcode || "Postal Code"} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${pincodeError ? "has-error" : ""}`}>
                  <MarkunreadMailboxOutlinedIcon className="field-icon" />
                  <input
                    id="checkout-address-postalcode"
                    name="address_postal_code_field"
                    type="text"
                    className="text-input"
                    placeholder={translations.enterpostalcode || "Enter postal code"}
                    autoComplete="off"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      if (pincodeError) setPincodeError("");
                    }}
                  />
                </div>
                {pincodeError && <span className="field-error-msg">{pincodeError}</span>}
              </div>

              {/* Modal Footer Buttons */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseAddAddressModal}
                  disabled={isSavingAddress}
                >
                  {translations.cancel || "Cancel"}
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={isSavingAddress}
                >
                  {isSavingAddress ? (
                    <>
                      <CircularProgress size={18} color="inherit" />
                      <span>{translations.saving || "Saving..."}</span>
                    </>
                  ) : (
                    <span>{translations.saveaddress || "Save Address"}</span>
                  )}
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