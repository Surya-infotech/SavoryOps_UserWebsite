import React, { useState, useEffect, useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { formatPriceFromBranch } from "../../utils/formatCurrency.js";
import { addItemToCart } from "../../utils/cartService.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import { DietIndicator } from "./DishCard.jsx";
import "../../Scss/Components/General/dishmodals.scss";

/**
 * Centralized Full Dish & Deal Details Modal
 * Used in MenuPage, HomeMenuShowcase, and OffersPage
 */
export const DishDetailModal = ({
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

  const isComboItem = Boolean(
    item?.bundletype === "combo" ||
    item?.bundletype === "unlimited" ||
    item?.isDeal
  );

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

  const rawItemType = (
    item?.itemtype ||
    item?.itemType ||
    ""
  ).trim().toLowerCase();

  const isNonVeg = Boolean(
    item?.isNonVeg ||
    rawItemType.includes("non") ||
    rawItemType.includes("egg") ||
    (item?.isVeg === false && item?.isVeg !== undefined)
  );

  const isVeg = Boolean(
    item?.isVeg ||
    (!isNonVeg && (rawItemType.includes("veg") || rawItemType === "vegan"))
  );

  const showDiet = Boolean(
    item?.hasDiet !== undefined ? item.hasDiet : (isVeg || isNonVeg)
  );

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

  const includedItems = item.includedItems || (Array.isArray(item.items) ? item.items : []);
  const prepTime = item.preparationtime ? `${item.preparationtime} ${translations.min || "min"}` : (item.prepTime || "");

  return (
    <div className="dish-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="dish-modal-container" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`dish-modal-close-btn ${!item.image ? "no-img" : ""}`}
          onClick={onClose}
          aria-label={translations.close || "Close"}
        >
          <CloseIcon fontSize="small" />
        </button>

        {/* Hero Image */}
        {item.image ? (
          <div className="dish-modal-hero">
            <img src={item.image} alt={item.title} />
            {showDiet && (
              <DietIndicator isVeg={isVeg} className="dish-modal-diet-badge" />
            )}
          </div>
        ) : (
          <div className="dish-modal-no-img-diet">
            {showDiet && (
              <DietIndicator isVeg={isVeg} className="dish-modal-diet-badge" />
            )}
          </div>
        )}

        <div className="dish-modal-body">
          <div className="dish-modal-header">
            <div>
              <h3 className="dish-modal-title">{item.title}</h3>
              <div className="dish-modal-tags">
                {item.categoryname && <span className="tag-badge">{item.categoryname}</span>}
                {item.tag && item.tag !== item.categoryname && <span className="tag-badge">{item.tag}</span>}
                {item.menuname && <span className="tag-badge">{item.menuname}</span>}
                {item.bundletype && (
                  <span className={`tag-badge deal-ribbon-badge ${item.bundletype}`} style={{ position: "static" }}>
                    {item.bundletype === "combo" ? (translations.combo || "COMBO") : (translations.unlimited || "UNLIMITED")}
                  </span>
                )}
                {prepTime && <span className="tag-badge">⏱ {prepTime}</span>}
                {showDiet && (
                  <span className="tag-badge">
                    {isVeg ? (translations.veg || "Vegetarian") : (translations.nonveg || "Non-Vegetarian")}
                  </span>
                )}
              </div>
            </div>

            <span className="dish-modal-price">
              {formatPriceFromBranch(effectivePrice, selectedBranch)}
            </span>
          </div>

          {item.desc && <p className="dish-modal-desc">{item.desc}</p>}

          {/* Included Items for Combos/Deals */}
          {isComboItem && includedItems.length > 0 && (
            <div className="dish-modal-addons-box">
              <h5>{translations.includeditems || "Included Items"}</h5>
              <div className="addons-list">
                {includedItems.map((it, idx) => {
                  const itemName = typeof it === "string" ? it : (it.itemname || it.name || it.title || "");
                  const qty = it.quantity;
                  return (
                    <div key={idx} className="addon-item-row not-selectable">
                      <div className="addon-check-label">
                        <CheckCircleOutlinedIcon style={{ color: "#028802", fontSize: "1.1rem" }} />
                        <span>{itemName}</span>
                      </div>
                      {qty && <span className="addon-price">x{qty}</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customizable Addons */}
          {item.addons && item.addons.length > 0 && (
            <div className="dish-modal-addons-box">
              <h5>
                {isComboItem
                  ? (translations.addons || "Add-ons")
                  : (translations.customizableaddons || "Customizable Add-ons")}
              </h5>
              <div className="addons-list">
                {item.addons.map((addon) => {
                  const addonKey = addon.addonid || addon._id || addon.id;

                  if (isComboItem) {
                    return (
                      <div key={addonKey} className="addon-item-row not-selectable">
                        <div className="addon-check-label">
                          <span>• {addon.addonname || addon.name}</span>
                        </div>
                        {addon.price && Number(addon.price) > 0 && (
                          <span className="addon-price">
                            +{formatPriceFromBranch(addon.price, selectedBranch)}
                          </span>
                        )}
                      </div>
                    );
                  }

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
          )}

          {/* Modal Footer with Quantity Counter (hidden on combo/unlimited/deals) */}
          {!isComboItem && (
            <div className="dish-modal-footer">
              <div className="quantity-counter">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  aria-label={translations.decreasequantity || "Decrease quantity"}
                >
                  -
                </button>
                <span>{quantity}</span>
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
                className="confirm-add-btn"
                onClick={handleConfirm}
                aria-label={translations.addtocart || "Add to cart"}
              >
                <ShoppingCartOutlinedIcon className="confirm-btn-icon" />
                <span>{formatPriceFromBranch(grandTotal, selectedBranch)}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DishDetailModal;

