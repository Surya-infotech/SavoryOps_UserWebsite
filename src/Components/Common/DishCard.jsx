import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { formatPriceFromBranch } from "../../utils/formatCurrency.js";
import "../../Scss/Components/General/dishcard.scss";

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge using pure CSS (No SVG)
 */
export const DietIndicator = ({ isVeg, className = "" }) => {
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
 * Centralized Dish, Combo & Unlimited Meal Card Component
 * Single source of truth for cards across Home, Menu, and Offers pages.
 */
const DishCard = ({
  dish,
  priceFormatted,
  selectedBranch,
  count = 0,
  onCardClick,
  onAddToCart,
  onOpenAddonModal,
  className = "",
}) => {
  const { translations = {} } = useLanguage();

  if (!dish) return null;

  const bundleTypeLower = (dish.bundletype || "").toLowerCase();
  const isDeal = Boolean(
    dish.isDeal ||
    dish.bundletype ||
    dish.dealsbundlesid ||
    dish.isCombo ||
    dish.isUnlimited
  );
  const isCombo = isDeal && (bundleTypeLower === "combo" || dish.isCombo);
  const isUnlimited = isDeal && (bundleTypeLower === "unlimited" || dish.isUnlimited);
  const isComboOrUnlimited = isCombo || isUnlimited || isDeal;

  const formattedPrice =
    priceFormatted ||
    (selectedBranch ? formatPriceFromBranch(dish.price, selectedBranch) : `$${Number(dish.price || 0).toFixed(2)}`);

  // Preparation time parsing
  const rawPrep = dish.preparationtime || dish.prepTime;
  let formattedPrepTime = null;
  if (rawPrep) {
    const prepStr = String(rawPrep).trim();
    if (prepStr) {
      if (/\d+\s*(min|mins|m)/i.test(prepStr)) {
        formattedPrepTime = prepStr;
      } else if (Number(prepStr) > 0) {
        formattedPrepTime = `${prepStr} ${translations.min || "min"}`;
      }
    }
  }

  // Items included count for deals
  const includedCount =
    dish.includedCount ??
    (Array.isArray(dish.items) ? dish.items.length : 0);

  const cardClasses = [
    "dish-card",
    className,
    isDeal ? "deal-card" : "",
    isCombo ? "combo-card" : "",
    isUnlimited ? "unlimited-card" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleCardClick = () => {
    if (typeof onCardClick === "function") {
      onCardClick(dish);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  const handleAddonClick = (e) => {
    e.stopPropagation();
    if (typeof onOpenAddonModal === "function") {
      onOpenAddonModal(e, dish);
    }
  };

  const handleCartClick = (e) => {
    e.stopPropagation();
    if (typeof onAddToCart === "function") {
      onAddToCart(e, dish);
    }
  };

  // Determine Veg / Non-Veg directly from database itemtype field ("Veg" / "Non Veg")
  const rawType = String(dish.itemtype || dish.itemType || "").trim().toLowerCase();
  const isNonVeg = rawType.includes("non") || dish.isNonVeg === true || (dish.isVeg === false && dish.isVeg !== undefined);
  const isVeg = !isNonVeg && (rawType.includes("veg") || dish.isVeg === true);
  const showDiet = Boolean(isVeg || isNonVeg || dish.hasDiet);

  return (
    <div
      className={cardClasses}
      onClick={handleCardClick}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${dish.title}`}
      onKeyDown={handleKeyDown}
    >
      {/* 1. Image Box */}
      <div className="dish-img-box">
        <img
          src={dish.image}
          alt={dish.title}
          className="dish-img"
          loading="lazy"
        />

        {/* Ribbon Badge or Tag Badge */}
        {isDeal ? (
          isUnlimited ? (
            <span className="deal-ribbon-badge unlimited">
              {translations.unlimited || "UNLIMITED"}
            </span>
          ) : isCombo ? (
            <span className="deal-ribbon-badge combo">
              {translations.combo || "COMBO"}
            </span>
          ) : dish.bundletype ? (
            <span className={`deal-ribbon-badge ${dish.bundletype}`}>
              {dish.bundletype.toUpperCase()}
            </span>
          ) : null
        ) : (
          (dish.categoryname || dish.tag) && (
            <span className="dish-tag-badge">{dish.categoryname || dish.tag}</span>
          )
        )}

        {/* Preparation Time */}
        {formattedPrepTime && (
          <span className="dish-prep-time">
            <AccessTimeIcon fontSize="inherit" />
            {formattedPrepTime}
          </span>
        )}

        {/* Diet Indicator */}
        {showDiet && <DietIndicator isVeg={isVeg} />}
      </div>

      {/* 2. Dish Content Body */}
      <div className="dish-content">
        <h3 className="dish-title" title={dish.title}>
          {dish.title}
        </h3>

        {dish.desc && (
          <p className="dish-desc" title={dish.desc}>
            {dish.desc}
          </p>
        )}

        {/* Included Items Pill for Deals */}
        {isDeal && includedCount > 0 && (
          <div className="deal-items-preview-row">
            <span className="deal-items-pill">
              🍽️ {includedCount}{" "}
              {includedCount === 1
                ? translations.itemincluded || "item included"
                : translations.itemsincluded || "items included"}
            </span>
          </div>
        )}

        {/* 3. Card Footer */}
        <div className="dish-footer-row">
          <div className="dish-price-group">
            <span className="dish-price">{formattedPrice}</span>
          </div>

          <div className="dish-card-actions">
            {/* Customizable Add-on Button (hidden on combo, unlimited, or deals) */}
            {!isComboOrUnlimited && dish.addons && dish.addons.length > 0 && typeof onOpenAddonModal === "function" && (
              <button
                type="button"
                className="dish-addon-btn"
                onClick={handleAddonClick}
                title={`${translations.addons || "Add-ons"} - ${dish.title}`}
                aria-label={`${dish.title} ${translations.addons || "Add-ons"}`}
              >
                <AddIcon className="addon-btn-icon" />
              </button>
            )}

            {/* Direct Add to Cart Button (hidden on combo, unlimited, or deals) */}
            {!isComboOrUnlimited && typeof onAddToCart === "function" && (
              <button
                type="button"
                className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                onClick={handleCartClick}
                aria-label={translations.addtocart || "Add to cart"}
                title={count > 0 ? `${translations.added || "Added"} (${count})` : (translations.addtocart || "Add to cart")}
              >
                <ShoppingCartOutlinedIcon fontSize="small" />
                {count > 0 && <span className="dish-btn-count-badge">{count}</span>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DishCard;
export { default as DishDetailModal } from "./DishDetailModal.jsx";
export { default as DishAddonModal } from "./DishAddonModal.jsx";