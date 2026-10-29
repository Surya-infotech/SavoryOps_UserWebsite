import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { getWebsiteSubdomain } from "../../Pages/Partials/UnderMaintenance.jsx";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

/**
 * Pure CSS Veg & Non-Veg FSSAI standard diet badge
 */
const DietIndicator = ({ isVeg, className = "" }) => {
  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
      aria-label={isVeg ? "Vegetarian" : "Non-Vegetarian"}
    >
      <span className="diet-box">
        <span className="diet-dot" />
      </span>
    </span>
  );
};

/**
 * Rich Default Menu Sections Data (Option 2: Curated Section Carousels)
 * Note: Pure local data, no external API call is made.
 */
export const DEFAULT_MENU_SECTIONS = [];

/**
 * Individual Horizontal Carousel Row Component
 */
const CarouselRow = ({ section, cartCounts, onCardClick, onOpenAddonModal, onAddToCart }) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollButtons();
    track.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      track.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const scrollStep = Math.max(320, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -scrollStep : scrollStep,
      behavior: "smooth",
    });
    setTimeout(updateScrollButtons, 350);
  };

  // Mouse drag handlers for track
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !trackRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftRef.current = trackRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.25;
    trackRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="showcase-carousel-row" id={`section-${section.id}`}>
      {/* Row Header */}
      <div className="carousel-row-header">
        <div className="header-info-wrap">
          {section.tag && (
            <div className={`row-tag-badge ${section.tagColor || ""}`}>
              <SparklesIcon className="pill-icon" />
              <span>{section.tag}</span>
            </div>
          )}
          <h2 className="row-title">{section.title}</h2>
          {section.subtitle && <p className="row-subtitle">{section.subtitle}</p>}
        </div>

        <div className="header-actions-wrap">
          <Link to={section.viewAllLink || "/menu"} className="row-view-all-link">
            <span>View All</span>
            <ArrowForwardIcon fontSize="inherit" />
          </Link>
        </div>
      </div>

      {/* Horizontal Carousel Track with Floating Side Navigation Buttons */}
      <div className="carousel-track-wrapper">
        {/* Floating Left Arrow Button */}
        <button
          type="button"
          className="carousel-side-arrow-btn left"
          onClick={() => handleScroll("left")}
          disabled={!canScrollLeft}
          aria-label={`Scroll ${section.title} left`}
          title="Scroll left"
        >
          <ChevronLeftIcon />
        </button>

        {/* Floating Right Arrow Button */}
        <button
          type="button"
          className="carousel-side-arrow-btn right"
          onClick={() => handleScroll("right")}
          disabled={!canScrollRight}
          aria-label={`Scroll ${section.title} right`}
          title="Scroll right"
        >
          <ChevronRightIcon />
        </button>

        <div
          className="carousel-scroll-track"
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {(section.itemDetails || section.menuDetails || section.categoryDetails || section.comboDetails || section.unlimitedDetails || section.items || []).map((rawDish) => {
            const dish = {
              ...rawDish,
              id: rawDish.itemid ?? rawDish.dealsbundlesid ?? rawDish.menuid ?? rawDish.itemcategoryid ?? rawDish.id,
              title: rawDish.itemname || rawDish.dealsbundlesname || rawDish.menuname || rawDish.itemcategoryname || rawDish.title || "",
              desc: rawDish.description || rawDish.desc || "",
              image: rawDish.imageUrl || rawDish.image || "",
              isVeg: rawDish.itemtype ? rawDish.itemtype === "Veg" : Boolean(rawDish.isVeg),
              prepTime: rawDish.preparationtime ? `${rawDish.preparationtime} min` : (rawDish.prepTime || ""),
              tag: rawDish.itemcategoryname || rawDish.tag || "",
              isDeal: Boolean(rawDish.bundletype || rawDish.dealsbundlesid || rawDish.isDeal),
              includedItems: Array.isArray(rawDish.items) ? rawDish.items.map((i) => i.itemname || i) : (rawDish.includedItems || []),
              includedCount: Array.isArray(rawDish.items) ? rawDish.items.length : (rawDish.includedCount || 0),
            };
            const count = cartCounts[dish.id] || 0;
            const priceFormatted = `${dish.currencySymbol || ""}${dish.price !== undefined && dish.price !== null ? Number(dish.price).toFixed(2) : "0.00"}`;
            const isCombo = dish.isDeal && (dish.bundletype === "combo" || !dish.bundletype);
            const isUnlimited = dish.isDeal && dish.bundletype === "unlimited";
            const isComboOrUnlimited = isCombo || isUnlimited || dish.isDeal;

            return (
              <div
                key={dish.id}
                className={`dish-card showcase-dish-card ${dish.isDeal ? "deal-card combo-card" : ""}`}
                onClick={() => onCardClick(dish)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${dish.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCardClick(dish);
                  }
                }}
              >
                {/* 1. Image Box (200px height - Exact Menu Page Spec) */}
                <div className="dish-img-box">
                  <div className="dish-img-placeholder">
                    <RestaurantMenuIcon className="dish-no-img-icon" />
                  </div>

                  {dish.image && (
                    <img
                      src={dish.image}
                      alt={dish.title}
                      className="dish-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}

                  {isCombo ? (
                    <span className="deal-ribbon-badge combo">
                      Combo
                    </span>
                  ) : (
                    dish.tag && <span className="dish-tag-badge">{dish.tag}</span>
                  )}

                  {dish.prepTime && (
                    <span className="dish-prep-time">
                      <AccessTimeIcon fontSize="inherit" />
                      {dish.prepTime}
                    </span>
                  )}

                  <DietIndicator isVeg={dish.isVeg} />
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

                  {dish.isDeal && dish.includedCount && (
                    <div className="deal-items-preview-row">
                      <span className="deal-items-pill">
                        🍽️ {dish.includedCount} dishes included
                      </span>
                    </div>
                  )}

                  <div className="dish-footer-row">
                    <div className="dish-price-group">
                      <span className="dish-price">{priceFormatted}</span>
                    </div>

                    <div className="dish-card-actions">
                      {/* Dedicated Add-on Button when customizable addons exist (hidden on combo and unlimited items) */}
                      {!isComboOrUnlimited && dish.addons && dish.addons.length > 0 && (
                        <button
                          type="button"
                          className="dish-addon-btn"
                          onClick={(e) => onOpenAddonModal(e, dish)}
                          title={`Add-ons - ${dish.title}`}
                          aria-label={`${dish.title} Add-ons`}
                        >
                          <AddIcon className="addon-btn-icon" />
                        </button>
                      )}

                      {/* Direct Add to Cart Button (hidden on combo and unlimited items) */}
                      {!isComboOrUnlimited && (
                        <button
                          type="button"
                          className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                          onClick={(e) => onAddToCart(e, dish)}
                          aria-label="Add to cart"
                          title={count > 0 ? `Added (${count})` : "Add to cart"}
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
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Home Menu Showcase Section Component
 */
const HomeMenuShowcase = () => {
  const { showSnackbar } = useSnackbar();

  // Local cart count state
  const [cartCounts, setCartCounts] = useState({});

  // Dynamic showcases fetched from backend
  const [dynamicShowcases, setDynamicShowcases] = useState([]);
  const [loadingShowcases, setLoadingShowcases] = useState(true);

  // Fetch dynamic showcases from backend based on subdomain and branch
  useEffect(() => {
    let isMounted = true;

    const fetchShowcases = async () => {
      const currentSubdomain = getWebsiteSubdomain();
      if (!currentSubdomain) {
        if (isMounted) setLoadingShowcases(false);
        return;
      }

      // Strictly get stored branchId from localStorage
      const branchId = localStorage.getItem("selectedBranchId");

      // Without Branch ID in localStorage, data must NOT be fetched or displayed
      if (!branchId) {
        if (isMounted) {
          setDynamicShowcases([]);
          setLoadingShowcases(false);
        }
        return;
      }

      try {
        if (isMounted) setLoadingShowcases(true);
        const endpoint = `${adminPanelBackendPath}/Website/Home/GetShowcases/${branchId}`;

        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
            "x-subdomain": currentSubdomain,
          },
        });

        const data = await response.json();
        if (isMounted) {
          if (response.ok && data.success && Array.isArray(data.showcases) && data.showcases.length > 0) {
            setDynamicShowcases(data.showcases);
          } else {
            setDynamicShowcases([]);
          }
        }
      } catch (err) {
        console.error("Error fetching dynamic menu showcases:", err);
        if (isMounted) setDynamicShowcases([]);
      } finally {
        if (isMounted) setLoadingShowcases(false);
      }
    };

    fetchShowcases();

    const handleBranchChange = () => {
      fetchShowcases();
    };

    window.addEventListener("branchChange", handleBranchChange);

    return () => {
      isMounted = false;
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, []);

  const displaySections = dynamicShowcases;

  // 1. Full Item Details Modal State (opened on dish card click)
  const [selectedDishModal, setSelectedDishModal] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  // 2. Dedicated Add-on Selection Modal State (opened on '+' dish-addon-btn click)
  const [addonModalDish, setAddonModalDish] = useState(null);
  const [addonQuantity, setAddonQuantity] = useState(1);
  const [addonSelectedIds, setAddonSelectedIds] = useState([]);

  // Addon price calculations for Item Details Modal
  const selectedDishAddonsTotal = useMemo(() => {
    if (!selectedDishModal || !selectedDishModal.addons) return 0;
    return selectedDishModal.addons
      .filter((a) => selectedAddonIds.includes(a.addonid || a._id || a.id))
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
  }, [selectedDishModal, selectedAddonIds]);

  const selectedDishGrandTotal = useMemo(() => {
    if (!selectedDishModal) return 0;
    const base = Number(selectedDishModal.price || 0);
    return (base + selectedDishAddonsTotal) * modalQuantity;
  }, [selectedDishModal, selectedDishAddonsTotal, modalQuantity]);

  // Addon price calculations for Dedicated Add-on Modal
  const addonModalAddonsTotal = useMemo(() => {
    if (!addonModalDish || !addonModalDish.addons) return 0;
    return addonModalDish.addons
      .filter((a) => addonSelectedIds.includes(a.addonid || a._id || a.id))
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
  }, [addonModalDish, addonSelectedIds]);

  const addonModalGrandTotal = useMemo(() => {
    if (!addonModalDish) return 0;
    const base = Number(addonModalDish.price || 0);
    return (base + addonModalAddonsTotal) * addonQuantity;
  }, [addonModalDish, addonModalAddonsTotal, addonQuantity]);

  // Quick direct add-to-cart (from shopping cart button)
  const handleAddToCart = (e, dish) => {
    e.stopPropagation();
    setCartCounts((prev) => ({
      ...prev,
      [dish.id]: (prev[dish.id] || 0) + 1,
    }));

    if (typeof showSnackbar === "function") {
      showSnackbar(`${dish.title} added to your order!`, "success", 3000);
    }
  };

  // Card click -> Open Item Details Modal
  const handleCardClick = (dish) => {
    setSelectedDishModal(dish);
    setModalQuantity(cartCounts[dish.id] || 1);
    setSelectedAddonIds([]);
  };

  // '+' Button click -> Open Dedicated Add-on Modal
  const handleOpenAddonModal = (e, dish) => {
    e.stopPropagation();
    setAddonModalDish(dish);
    setAddonSelectedIds([]);
    setAddonQuantity(1);
  };

  // Toggle handlers
  const toggleModalAddon = (addonKey) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonKey) ? prev.filter((id) => id !== addonKey) : [...prev, addonKey]
    );
  };

  const toggleAddonModalItem = (addonKey) => {
    setAddonSelectedIds((prev) =>
      prev.includes(addonKey) ? prev.filter((id) => id !== addonKey) : [...prev, addonKey]
    );
  };

  // Confirm handlers
  const handleConfirmDishModal = () => {
    if (!selectedDishModal) return;
    setCartCounts((prev) => ({
      ...prev,
      [selectedDishModal.id]: (prev[selectedDishModal.id] || 0) + modalQuantity,
    }));

    if (typeof showSnackbar === "function") {
      showSnackbar(`${selectedDishModal.title} (${modalQuantity}x) added to order!`, "success", 3000);
    }

    setSelectedDishModal(null);
  };

  const handleConfirmAddonModal = () => {
    if (!addonModalDish) return;
    setCartCounts((prev) => ({
      ...prev,
      [addonModalDish.id]: (prev[addonModalDish.id] || 0) + addonQuantity,
    }));

    if (typeof showSnackbar === "function") {
      showSnackbar(`${addonModalDish.title} (${addonQuantity}x) added to order!`, "success", 3000);
    }

    setAddonModalDish(null);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedDishModal(null);
        setAddonModalDish(null);
      }
    };
    if (selectedDishModal || addonModalDish) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDishModal, addonModalDish]);

  if (loadingShowcases || displaySections.length === 0) {
    return null;
  }

  return (
    <section className="home-menu-showcase-section" aria-label="Curated Menu Showcase">
      {/* --- Section-Wise Horizontal Carousels --- */}
      <div className="showcase-sections-list">
        {displaySections.map((section) => (
          <CarouselRow
            key={section.id}
            section={section}
            cartCounts={cartCounts}
            onCardClick={handleCardClick}
            onOpenAddonModal={handleOpenAddonModal}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* --- 1. Item Details Popup Modal (Exact Parity with Menu Page) --- */}
      {selectedDishModal && (
        <div
          className="dish-modal-overlay"
          onClick={() => setSelectedDishModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-modal-title"
        >
          <div className="dish-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dish-modal-close-btn"
              onClick={() => setSelectedDishModal(null)}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </button>

            {/* Hero Image */}
            {selectedDishModal.image ? (
              <div className="dish-modal-hero">
                <img
                  src={selectedDishModal.image}
                  alt={selectedDishModal.title}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <DietIndicator isVeg={selectedDishModal.isVeg} className="dish-modal-diet-badge" />
              </div>
            ) : (
              <div className="dish-modal-no-img-diet">
                <DietIndicator isVeg={selectedDishModal.isVeg} className="dish-modal-diet-badge" />
              </div>
            )}

            {/* Modal Body */}
            <div className="dish-modal-body">
              <div className="dish-modal-header">
                <div>
                  <h3 id="dish-modal-title" className="dish-modal-title">
                    {selectedDishModal.title}
                  </h3>
                  <div className="dish-modal-tags">
                    {selectedDishModal.tag && (
                      <span className="tag-badge">{selectedDishModal.tag}</span>
                    )}
                    {selectedDishModal.prepTime && (
                      <span className="tag-badge">⏱ {selectedDishModal.prepTime}</span>
                    )}
                    <span className="tag-badge">
                      {selectedDishModal.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                    </span>
                  </div>
                </div>

                <span className="dish-modal-price">
                  {selectedDishModal.currencySymbol || "$"}
                  {Number(selectedDishModal.price || 0).toFixed(2)}
                </span>
              </div>

              {selectedDishModal.desc && (
                <p className="dish-modal-desc">{selectedDishModal.desc}</p>
              )}

              {/* Combo Included Items */}
              {selectedDishModal.isDeal && selectedDishModal.includedItems && (
                <div className="dish-modal-addons-box">
                  <div className="dish-modal-addons-title-wrap">
                    <h5>Dishes Included in this Feast</h5>
                  </div>
                  <div className="addons-list">
                    {selectedDishModal.includedItems.map((item, idx) => (
                      <div key={idx} className="addon-item-row">
                        <div className="addon-check-label">
                          <CheckCircleOutlinedIcon style={{ color: "#028802", fontSize: "1.1rem" }} />
                          <span>{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customizable Addons List */}
              {selectedDishModal.addons && selectedDishModal.addons.length > 0 && (
                <div className="dish-modal-addons-box">
                  <div className="dish-modal-addons-title-wrap">
                    <h5>Customizable Add-ons</h5>
                    <span className="addons-subtitle">Optional enhancements</span>
                  </div>
                  <div className="addons-list">
                    {selectedDishModal.addons.map((addon) => {
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
                              onChange={() => toggleModalAddon(addonKey)}
                              className="addon-checkbox-input"
                            />
                            <span>{addon.addonname || addon.name}</span>
                          </div>
                          <span className="addon-price">
                            +{selectedDishModal.currencySymbol || "$"}
                            {Number(addon.price || 0).toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer with Quantity Counter (hidden on combo and unlimited items - exact MenuPage parity) */}
              {!(
                selectedDishModal.bundletype === "combo" ||
                selectedDishModal.bundletype === "unlimited" ||
                selectedDishModal.isDeal
              ) && (
                <div className="dish-modal-footer">
                  <div className="quantity-counter">
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span>{modalQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="confirm-add-btn"
                    onClick={handleConfirmDishModal}
                  >
                    Add to Order • {selectedDishModal.currencySymbol || "$"}
                    {selectedDishGrandTotal.toFixed(2)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 2. Dedicated Add-on Selection Popup Modal (Exact Parity with Menu Page) --- */}
      {addonModalDish && (
        <div
          className="dish-modal-overlay addon-modal-overlay"
          onClick={() => setAddonModalDish(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="addon-modal-item-title"
        >
          <div
            className="addon-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="addon-modal-header">
              <div className="addon-header-main">
                <div className="addon-header-title-row">
                  <DietIndicator isVeg={addonModalDish.isVeg} className="addon-header-diet" />
                  <h3 id="addon-modal-item-title" className="addon-modal-item-title">
                    {addonModalDish.title}
                  </h3>
                </div>
                <div className="addon-modal-price-meta">
                  <span className="addon-base-price">
                    {addonModalDish.currencySymbol || "$"}
                    {Number(addonModalDish.price || 0).toFixed(2)}
                  </span>
                  {addonModalDish.prepTime && (
                    <span className="addon-prep-time">
                      <AccessTimeIcon fontSize="inherit" /> {addonModalDish.prepTime}
                    </span>
                  )}
                </div>
              </div>

              {addonModalDish.image && (
                <div className="addon-modal-thumb-box">
                  <img
                    src={addonModalDish.image}
                    alt={addonModalDish.title}
                    className="addon-modal-thumb"
                  />
                </div>
              )}

              <button
                type="button"
                className="addon-modal-close-btn"
                onClick={() => setAddonModalDish(null)}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Description if present */}
            {addonModalDish.desc && (
              <p className="addon-modal-desc">{addonModalDish.desc}</p>
            )}

            {/* Add-ons Selection Section */}
            <div className="addon-selection-section">
              <div className="addon-section-title-wrap">
                <h4 className="addon-section-title">
                  Customizable Add-ons
                </h4>
                <span className="addon-section-subtitle">
                  Select any add-ons
                </span>
              </div>

              <div className="addon-options-list">
                {(addonModalDish.addons || []).map((addon) => {
                  const addonKey = addon.addonid || addon._id || addon.id;
                  const isChecked = addonSelectedIds.includes(addonKey);
                  return (
                    <label
                      key={addonKey}
                      className={`addon-option-item ${isChecked ? "is-selected" : ""}`}
                    >
                      <div className="addon-option-left">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddonModalItem(addonKey)}
                          className="addon-option-checkbox"
                        />
                        <span className="addon-option-name">{addon.addonname || addon.name}</span>
                      </div>
                      <span className="addon-option-price">
                        +{addonModalDish.currencySymbol || "$"}
                        {Number(addon.price || 0).toFixed(2)}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Sticky Footer */}
            <div className="addon-modal-footer">
              <div className="addon-quantity-control">
                <button
                  type="button"
                  onClick={() => setAddonQuantity((q) => Math.max(1, q - 1))}
                  disabled={addonQuantity <= 1}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="addon-qty-val">{addonQuantity}</span>
                <button
                  type="button"
                  onClick={() => setAddonQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="addon-add-cart-btn"
                onClick={handleConfirmAddonModal}
              >
                <span>Add to cart</span>
                <span className="addon-btn-separator">•</span>
                <span className="addon-total-price">
                  {addonModalDish.currencySymbol || "$"}
                  {addonModalGrandTotal.toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeMenuShowcase;
