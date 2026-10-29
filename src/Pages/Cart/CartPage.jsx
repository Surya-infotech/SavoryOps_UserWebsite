import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RemoveIcon from "@mui/icons-material/Remove";
import AddIcon from "@mui/icons-material/Add";
import EditNoteIcon from "@mui/icons-material/EditNote";
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
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
  updateCartItemInstructions,
} from "../../utils/cartService.js";
import "../../Scss/Pages/Cart/cartpage.scss";

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

const CartPage = () => {
  const navigate = useNavigate();
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const { showSnackbar } = useSnackbar();
  const businessDisplayName = business?.businessname || "";

  const [cartItems, setCartItems] = useState(getCart);
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const [openNotesMap, setOpenNotesMap] = useState({});

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

    window.addEventListener("branchChange", handleBranchChange);
    window.dispatchEvent(new CustomEvent("requestBranch"));

    return () => window.removeEventListener("branchChange", handleBranchChange);
  }, []);

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

  // Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const basePrice = Number(item.price || 0);
      const addonsPrice = (item.addons || [])
        .filter((a) => a && a.selected !== false)
        .reduce((aSum, a) => aSum + Number(a.price || 0), 0);
      return sum + (basePrice + addonsPrice) * (Number(item.quantity) || 1);
    }, 0);
  }, [cartItems]);

  const totalQuantity = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  }, [cartItems]);

  const grandTotal = subtotal;

  const handleProceedCheckout = () => {
    showSnackbar(
      translations.ordersuccessnotice || "Ready for checkout! Order submission is active.",
      "success",
      3500
    );
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
            {/* Header with Title and Clear Cart Button */}
            <div className="cart-header-row">
              <div className="cart-title-group">
                <h1 className="cart-page-title">{translations.yourcart || "Your Cart"}</h1>
                <span className="cart-badge-count">
                  {totalQuantity} {totalQuantity === 1 ? translations.item || "item" : translations.items || "items"}
                </span>
              </div>
              <button
                type="button"
                className="clear-cart-btn"
                onClick={handleClearCart}
                title="Remove all items from your cart"
              >
                <DeleteOutlineOutlinedIcon fontSize="small" />
                <span>{translations.clearcart || "Clear Cart"}</span>
              </button>
            </div>

            {/* Main Cart Grid */}
            <div className="cart-layout-grid">
              {/* Left Column: Cart Items List */}
              <div className="cart-items-list">
                {cartItems.map((item) => {
                  const itemKey = item.cartItemId || item.itemId;
                  const itemPrice = Number(item.price || 0);
                  const selectedAddons = (item.addons || []).filter(
                    (a) => a && a.selected !== false
                  );
                  const addonsTotal = selectedAddons.reduce(
                    (sum, a) => sum + Number(a.price || 0),
                    0
                  );
                  const itemSubtotal = (itemPrice + addonsTotal) * (Number(item.quantity) || 1);
                  const isVeg = item.itemtype ? item.itemtype.toLowerCase() === "veg" : false;
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
                          {item.itemtype && <DietIndicator isVeg={isVeg} />}
                          <h4 className="cart-item-title">{item.name}</h4>
                        </div>

                        <span className="cart-item-unit-price">
                          {formatPriceFromBranch(itemPrice, selectedBranch)}
                        </span>

                        {/* Selected Add-ons */}
                        {selectedAddons.length > 0 && (
                          <div className="cart-item-addons-list">
                            {selectedAddons.map((addon, aIdx) => (
                              <div key={addon.addonid || aIdx} className="cart-addon-row">
                                <span className="addon-name">+ {addon.addonname || addon.name}</span>
                                <span className="addon-price">
                                  +{formatPriceFromBranch(addon.price || 0, selectedBranch)}
                                </span>
                              </div>
                            ))}
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
                              className={`qty-btn ${item.quantity === 1 ? "delete-variant" : ""}`}
                              onClick={() => handleDecrease(item.cartItemId)}
                              aria-label="Decrease quantity"
                            >
                              {item.quantity === 1 ? <DeleteOutlineOutlinedIcon fontSize="inherit" /> : <RemoveIcon fontSize="inherit" />}
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
                    <div className="bill-row">
                      <span className="bill-row-label">{translations.subtotal || "Item Subtotal"}</span>
                      <span className="bill-row-value">
                        {formatPriceFromBranch(subtotal, selectedBranch)}
                      </span>
                    </div>

                    <div className="bill-row">
                      <span className="bill-row-label">{translations.itemcount || "Total Items"}</span>
                      <span className="bill-row-value">{totalQuantity}</span>
                    </div>
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
    </div>
  );
};

export default CartPage;
