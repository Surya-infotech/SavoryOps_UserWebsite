import React, { useState, useEffect, useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { formatPriceFromBranch } from "../../utils/formatCurrency.js";
import { addItemToCart } from "../../utils/cartService.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import { DietIndicator } from "./DishCard.jsx";
import "../../Scss/Components/General/dishmodals.scss";

/**
 * Centralized Quick Add-on Customization Popup Modal
 * Used in MenuPage and HomeMenuShowcase
 */
export const DishAddonModal = ({
  item,
  onClose,
  selectedBranch,
  posPayload,
  branchSetting,
  selectedOrderType,
  initialQuantity = 1,
  onAddToCart,
}) => {
  const { translations = {} } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const [quantity, setQuantity] = useState(initialQuantity || 1);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  useEffect(() => {
    setQuantity(initialQuantity || 1);
    setSelectedAddonIds([]);
  }, [item, initialQuantity]);

  // Close on Escape key
  useEffect(() => {
    if (!item) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [item, onClose]);

  const effectiveSettings = posPayload || branchSetting;

  const effectivePrice = useMemo(() => {
    if (!item) return 0;
    return calculateItemPrice(item, effectiveSettings, selectedOrderType);
  }, [item, effectiveSettings, selectedOrderType]);

  const addonsTotal = useMemo(() => {
    if (!item?.addons) return 0;
    return item.addons
      .filter((a) => selectedAddonIds.includes(a.addonid || a._id || a.id))
      .reduce((sum, a) => sum + Number(a.price ?? a.addonprice ?? 0), 0);
  }, [item, selectedAddonIds]);

  const grandTotal = useMemo(() => {
    return (effectivePrice + addonsTotal) * quantity;
  }, [effectivePrice, addonsTotal, quantity]);

  if (!item) return null;

  const toggleAddon = (addonKey) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonKey)
        ? prev.filter((id) => id !== addonKey)
        : [...prev, addonKey]
    );
  };

  const handleConfirm = () => {
    const selectedAddons = (item.addons || []).map((addon) => {
      const addonKey = addon.addonid || addon._id || addon.id;
      const isSelected = selectedAddonIds.includes(addonKey);
      return {
        addonid: addon.addonid || addonKey,
        addonname: addon.addonname || addon.name,
        price: Number(addon.price ?? addon.addonprice ?? 0),
        selected: isSelected,
      };
    });

    const itemWithPrice = { ...item, price: effectivePrice };
    const cartOptions = {
      addons: selectedAddons,
      availableAddons: item.addons || [],
      quantity,
      image: item.image || item.imageUrl,
      description: item.desc || item.description,
      showToast: showSnackbar,
    };

    if (typeof onAddToCart === "function") {
      onAddToCart(itemWithPrice, cartOptions);
    } else {
      addItemToCart(itemWithPrice, cartOptions);
    }
    onClose?.();
  };

  const prepTime = item.preparationtime
    ? `${item.preparationtime} ${translations.min || "min"}`
    : item.prepTime || "";

  return (
    <div
      className="dish-modal-overlay addon-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="addon-modal-item-title"
    >
      <div className="addon-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="addon-modal-header">
          <div className="addon-header-main">
            <div className="addon-header-title-row">
              {(item.hasDiet || item.isVeg !== undefined) && (item.isVeg || item.isNonVeg) && (
                <DietIndicator isVeg={item.isVeg} className="addon-header-diet" />
              )}
              <h3 id="addon-modal-item-title" className="addon-modal-item-title">
                {item.title}
              </h3>
            </div>
            <div className="addon-modal-price-meta">
              <span className="addon-base-price">
                {formatPriceFromBranch(effectivePrice, selectedBranch)}
              </span>
              {prepTime && (
                <span className="addon-prep-time">
                  <AccessTimeIcon fontSize="inherit" /> {prepTime}
                </span>
              )}
            </div>
          </div>

          {item.image && (
            <div className="addon-modal-thumb-box">
              <img src={item.image} alt={item.title} className="addon-modal-thumb" />
            </div>
          )}

          <button
            type="button"
            className="addon-modal-close-btn"
            onClick={onClose}
            aria-label={translations.close || "Close"}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Description if present */}
        {item.desc && <p className="addon-modal-desc">{item.desc}</p>}

        {/* Add-ons Selection Section */}
        {item.addons && item.addons.length > 0 && (
          <div className="addon-selection-section">
            <div className="dish-modal-addons-box">
              <h5>{translations.customizableaddons || "Customizable Add-ons"}</h5>
              <div className="addons-list">
                {item.addons.map((addon) => {
                  const addonKey = addon.addonid || addon._id || addon.id;
                  const isChecked = selectedAddonIds.includes(addonKey);
                  return (
                    <label
                      key={addonKey}
                      className={`addon-item-row ${isChecked ? "is-selected" : ""}`}
                    >
                      <div className="addon-check-label">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addonKey)}
                          className="addon-checkbox-input"
                        />
                        <span>{addon.addonname || addon.name}</span>
                      </div>
                      <span className="addon-price">
                        +{formatPriceFromBranch(addon.price, selectedBranch)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal Bottom Sticky Footer */}
        <div className="addon-modal-footer">
          <div className="addon-quantity-control">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label={translations.decreasequantity || "Decrease quantity"}
            >
              -
            </button>
            <span className="addon-qty-val">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => q + 1)}
              aria-label={translations.increasequantity || "Increase quantity"}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="addon-add-cart-btn"
            onClick={handleConfirm}
            aria-label={translations.addtocart || "Add to cart"}
          >
            <ShoppingCartOutlinedIcon className="confirm-btn-icon" fontSize="small" />
            <span className="addon-total-price">
              {formatPriceFromBranch(grandTotal, selectedBranch)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DishAddonModal;

