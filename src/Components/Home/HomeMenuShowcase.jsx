import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { getWebsiteSubdomain } from "../../Pages/Partials/UnderMaintenance.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import DishCard, { DietIndicator, DishDetailModal, DishAddonModal } from "../../Components/Common/DishCard.jsx";
import { addItemToCart, getItemQuantitiesMap } from "../../utils/cartService.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;


/**
 * Rich Default Menu Sections Data (Option 2: Curated Section Carousels)
 * Note: Pure local data, no external API call is made.
 */
export const DEFAULT_MENU_SECTIONS = [];

/**
 * Individual Horizontal Carousel Row Component
 */
const CarouselRow = ({
  section,
  cartCounts,
  onCardClick,
  onOpenAddonModal,
  onAddToCart,
  selectedBranch,
  branchSetting,
  selectedOrderType,
}) => {
  const { translations = {}, isRtl } = useLanguage();
  const navigate = useNavigate();
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
    const maxScroll = Math.max(0, scrollWidth - clientWidth);
    if (maxScroll <= 5) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const rtlActive =
      isRtl ||
      document.documentElement.dir === "rtl" ||
      document.body.classList.contains("rtl-mode") ||
      (typeof window !== "undefined" && window.getComputedStyle(el).direction === "rtl");

    if (rtlActive) {
      // In RTL (Chrome, Edge, Firefox):
      // Initial position (far right) has scrollLeft ~ 0.
      // Scrolling left makes scrollLeft negative down to -maxScroll.
      const absScroll = Math.abs(scrollLeft);
      // Can scroll left if not at the far left edge
      setCanScrollLeft(absScroll < maxScroll - 10);
      // Can scroll right if away from the far right edge
      setCanScrollRight(absScroll > 10);
    } else {
      // In LTR:
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < maxScroll - 10);
    }
  }, [isRtl]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollButtons();
    const t1 = setTimeout(updateScrollButtons, 150);
    const t2 = setTimeout(updateScrollButtons, 500);

    track.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      track.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isRtl, updateScrollButtons]);

  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const scrollStep = Math.max(320, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -scrollStep : scrollStep,
      behavior: "smooth",
    });
    setTimeout(updateScrollButtons, 350);
    setTimeout(updateScrollButtons, 500);
  };

  // Mouse drag handlers for track
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !trackRef.current) return;
    isDraggingRef.current = true;
    trackRef.current.classList.add("is-dragging");
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftRef.current = trackRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.25;

    const rtlActive =
      isRtl ||
      document.documentElement.dir === "rtl" ||
      document.body.classList.contains("rtl-mode") ||
      (typeof window !== "undefined" && window.getComputedStyle(trackRef.current).direction === "rtl");

    trackRef.current.scrollTo({
      left: rtlActive ? scrollLeftRef.current + walk : scrollLeftRef.current - walk,
      behavior: "instant",
    });
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (trackRef.current) {
      trackRef.current.classList.remove("is-dragging");
    }
    updateScrollButtons();
  };

  return (
    <div className="showcase-carousel-row" id={`section-${section._id}`}>
      {/* Row Header */}
      <div className="carousel-row-header">
        <div className="header-info-wrap">
          {section.tag && (
            <div className={`row-tag-badge ${section.tagColor || "pill-emerald"}`}>
              <SparklesIcon className="pill-icon" />
              <span>{section.tag}</span>
            </div>
          )}
          <h2 className="row-title">{section.title}</h2>
          {section.subtitle && <p className="row-subtitle">{section.subtitle}</p>}
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
          {section.type === "menu" ? (
            (section.menuDetails || section.items || []).map((menuItem, idx) => {
              const menuId = menuItem.menuid ?? menuItem._id ?? menuItem.id ?? idx;
              const menuName = menuItem.menuname || menuItem.title || menuItem.name || "Menu";
              const imageUrl = menuItem.imageUrl || menuItem.image || menuItem.menuimage || menuItem.img || "";

              return (
                <div
                  key={`menu-${menuId}`}
                  className="showcase-nav-card menu-nav-card"
                  onClick={() => navigate(`/menu?menu=${menuId}`)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${menuName}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/menu?menu=${menuId}`);
                    }
                  }}
                >
                  <div className="nav-card-img-box">
                    <img
                      src={imageUrl}
                      alt={menuName}
                      className="nav-card-img"
                      loading="lazy"
                    />
                  </div>

                  <div className="nav-card-content">
                    <h3 className="nav-card-title" title={menuName}>
                      {menuName}
                    </h3>
                    <div className="nav-card-arrow-pill" aria-hidden="true">
                      <ArrowForwardIosIcon className="explore-arrow-icon" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : section.type === "category" ? (
            (section.categoryDetails || section.items || []).map((catItem, idx) => {
              const catId = catItem.itemcategoryid ?? catItem._id ?? catItem.id ?? idx;
              const catName = catItem.itemcategoryname || catItem.title || catItem.name || "Category";
              const imageUrl = catItem.imageUrl || catItem.image || catItem.categoryimage || catItem.itemcategoryimage || catItem.img || "";

              return (
                <div
                  key={`cat-${catId}`}
                  className="showcase-nav-card category-nav-card"
                  onClick={() => navigate(`/menu?category=${catId}`)}
                  tabIndex={0}
                  role="button"
                  aria-label={`View ${catName}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      navigate(`/menu?category=${catId}`);
                    }
                  }}
                >
                  <div className="nav-card-img-box">
                    <img
                      src={imageUrl}
                      alt={catName}
                      className="nav-card-img"
                      loading="lazy"
                    />
                  </div>

                  <div className="nav-card-content">
                    <h3 className="nav-card-title" title={catName}>
                      {catName}
                    </h3>
                    <div className="nav-card-arrow-pill" aria-hidden="true">
                      <ArrowForwardIosIcon className="explore-arrow-icon" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            (section.itemDetails || section.comboDetails || section.unlimitedDetails || section.items || []).map((rawDish) => {
              const bundleTypeLower = (rawDish.bundletype || (section.type === "combo" ? "combo" : section.type === "unlimited" ? "unlimited" : "")).toLowerCase();
              const isDeal = Boolean(rawDish.bundletype || rawDish.dealsbundlesid || rawDish.isDeal || section.type === "combo" || section.type === "unlimited");
              const isCombo = isDeal && (bundleTypeLower === "combo" || section.type === "combo" || (!bundleTypeLower && section.type !== "unlimited"));
              const isUnlimited = isDeal && (bundleTypeLower === "unlimited" || section.type === "unlimited");
              const isComboOrUnlimited = isCombo || isUnlimited || isDeal;

              const rawBasePrice = Number(rawDish.rawPrice ?? rawDish.price ?? 0);
              const effectivePrice = calculateItemPrice(
                {
                  ...rawDish,
                  price: rawBasePrice,
                  rawPrice: rawBasePrice,
                  taxes: rawDish.taxes || [],
                },
                branchSetting,
                selectedOrderType
              );

              const rawItemType = (rawDish.itemtype || rawDish.itemType || "").trim().toLowerCase();
              const isNonVeg = rawItemType.includes("non") || rawItemType.includes("egg") || (rawDish.isVeg === false && rawDish.isVeg !== undefined);
              const isVeg = !isNonVeg && (rawItemType.includes("veg") || rawItemType === "vegan" || Boolean(rawDish.isVeg));
              const hasDiet = isVeg || isNonVeg || Boolean(rawDish.hasDiet);

              const dish = {
                ...rawDish,
                id: rawDish.itemid ?? rawDish.dealsbundlesid ?? rawDish.id,
                title: rawDish.itemname || rawDish.dealsbundlesname || rawDish.title || "",
                desc: rawDish.description || rawDish.desc || "",
                image: rawDish.imageUrl || rawDish.image || "",
                hasDiet,
                isVeg,
                isNonVeg,
                itemtype: rawDish.itemtype || (isVeg ? "Veg" : isNonVeg ? "Non-Veg" : ""),
                prepTime: rawDish.preparationtime ? `${rawDish.preparationtime} min` : (rawDish.prepTime || ""),
                tag: rawDish.itemcategoryname || rawDish.tag || "",
                isDeal: isDeal,
                bundletype: isUnlimited ? "unlimited" : isCombo ? "combo" : bundleTypeLower,
                items: rawDish.items || [],
                includedItems: Array.isArray(rawDish.items) ? rawDish.items.map((i) => i.itemname || i) : (rawDish.includedItems || []),
                includedCount: Array.isArray(rawDish.items) ? rawDish.items.length : (rawDish.includedCount || 0),
                price: effectivePrice,
                rawPrice: rawBasePrice,
                taxes: rawDish.taxes || [],
                addons: rawDish.addons || [],
              };
              const count = cartCounts[dish.id] || 0;
              const priceFormatted = formatPriceFromBranch(dish.price, selectedBranch);

              return (
                <DishCard
                  key={dish.id}
                  dish={dish}
                  className="showcase-dish-card"
                  selectedBranch={selectedBranch}
                  count={count}
                  onCardClick={onCardClick}
                  onAddToCart={onAddToCart}
                  onOpenAddonModal={onOpenAddonModal}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Home Menu Showcase Section Component
 */
const HomeMenuShowcase = ({ branchSetting: propBranchSetting }) => {
  const { translations = {} } = useLanguage();
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const { showSnackbar } = useSnackbar();

  // Local cart count state
  const [cartCounts, setCartCounts] = useState(getItemQuantitiesMap);

  // Selected Order Type & Branch Setting for dynamic inclusive tax calculation
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType");
  });
  const [branchSetting, setBranchSetting] = useState(() => {
    return propBranchSetting || (typeof window !== "undefined" ? window.__branchSetting : null);
  });

  useEffect(() => {
    if (propBranchSetting) {
      setBranchSetting(propBranchSetting);
    }
  }, [propBranchSetting]);

  useEffect(() => {
    const handleCartUpdated = () => {
      setCartCounts(getItemQuantitiesMap());
    };
    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, []);

  // Listen to orderType and branchSetting changes from Navbar and Storage
  useEffect(() => {
    const handleOrderTypeChange = (e) => {
      const ot = e?.detail?.orderType;
      if (ot) {
        setSelectedOrderType(ot);
      }
    };

    const handleBranchSettingChange = (e) => {
      if (e?.detail) {
        setBranchSetting(e.detail);
      }
    };

    const handleStorage = (e) => {
      if (e.key === "selectedOrderType" && e.newValue) {
        setSelectedOrderType(e.newValue);
      }
    };

    window.addEventListener("orderTypeChange", handleOrderTypeChange);
    window.addEventListener("branchSettingChange", handleBranchSettingChange);
    window.addEventListener("storage", handleStorage);

    // Request branch setting from Navbar
    window.dispatchEvent(new CustomEvent("requestBranchSetting"));

    return () => {
      window.removeEventListener("orderTypeChange", handleOrderTypeChange);
      window.removeEventListener("branchSettingChange", handleBranchSettingChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

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
            if (data.branchSetting) {
              setBranchSetting(data.branchSetting);
              if (typeof window !== "undefined") {
                window.__branchSetting = data.branchSetting;
              }
            }
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

    const handleBranchChange = (e) => {
      if (e?.detail) {
        setSelectedBranch(e.detail);
        fetchShowcases(e.detail._id);
      } else {
        setSelectedBranch(getActiveBranch());
        fetchShowcases();
      }
    };

    window.addEventListener("branchChange", handleBranchChange);
    window.dispatchEvent(new CustomEvent("requestBranch"));

    return () => {
      isMounted = false;
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, []);

  const displaySections = dynamicShowcases;

  // Modal States
  const [selectedDishModal, setSelectedDishModal] = useState(null);
  const [addonModalDish, setAddonModalDish] = useState(null);

  // Quick direct add-to-cart (from shopping cart button)
  const handleAddToCart = (e, dish) => {
    e.stopPropagation();
    const effectivePrice = calculateItemPrice(dish, branchSetting, selectedOrderType);
    const dishWithPrice = {
      ...dish,
      price: effectivePrice,
    };
    const addons = dishWithPrice.addons ? dishWithPrice.addons.map((addon) => ({
      addonid: addon.addonid || addon._id || addon.id,
      addonname: addon.addonname || addon.name,
      price: Number(addon.price ?? addon.addonprice ?? 0),
      selected: false,
    })) : [];

    addItemToCart(dishWithPrice, {
      addons,
      availableAddons: dishWithPrice.addons || [],
      image: dishWithPrice.image || dishWithPrice.imageUrl,
      description: dishWithPrice.desc || dishWithPrice.description,
      showToast: showSnackbar,
    });
  };

  // Card click -> Open Item Details Modal
  const handleCardClick = (dish) => {
    setSelectedDishModal(dish);
  };

  // '+' Button click -> Open Dedicated Add-on Modal
  const handleOpenAddonModal = (e, dish) => {
    e.stopPropagation();
    setAddonModalDish(dish);
  };

  if (loadingShowcases || displaySections.length === 0) {
    return null;
  }

  return (
    <section className="home-menu-showcase-section" aria-label="Curated Menu Showcase">
      {/* --- Section-Wise Horizontal Carousels --- */}
      <div className="showcase-sections-list">
        {displaySections.map((section, sIdx) => (
          <CarouselRow
            key={section._id || sIdx}
            section={section}
            cartCounts={cartCounts}
            onCardClick={handleCardClick}
            onOpenAddonModal={handleOpenAddonModal}
            onAddToCart={handleAddToCart}
            selectedBranch={selectedBranch}
            branchSetting={branchSetting}
            selectedOrderType={selectedOrderType}
          />
        ))}
      </div>

      {/* Centralized Full Dish / Deal Details Modal */}
      <DishDetailModal
        item={selectedDishModal}
        onClose={() => setSelectedDishModal(null)}
        selectedBranch={selectedBranch}
        branchSetting={branchSetting}
        selectedOrderType={selectedOrderType}
        initialQuantity={selectedDishModal ? (cartCounts[selectedDishModal.id] || 1) : 1}
      />

      {/* Centralized Quick Add-on Customization Popup Modal */}
      <DishAddonModal
        item={addonModalDish}
        onClose={() => setAddonModalDish(null)}
        selectedBranch={selectedBranch}
        branchSetting={branchSetting}
        selectedOrderType={selectedOrderType}
        initialQuantity={1}
      />
    </section>
  );
};

export default HomeMenuShowcase;
