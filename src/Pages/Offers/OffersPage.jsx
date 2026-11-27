import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import CheckIcon from "@mui/icons-material/Check";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import DishCard, { DishDetailModal, DishAddonModal } from "../../Components/Common/DishCard.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import { addItemToCart, getCart, getItemQuantitiesMap } from "../../utils/cartService.js";
import {
  fetchAvailableCoupons,
  validateCouponCode,
  getAppliedCoupon,
  saveAppliedCoupon,
} from "../../utils/couponService.js";
import "../../Scss/Pages/Offers/offerspage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;


const OffersPage = () => {
  const { translations = {}, isRtl } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const { business, couponEnabled } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  const [loading, setLoading] = useState(true);
  const [rawDealsBundles, setRawDealsBundles] = useState([]);
  const [promoCoupons, setPromoCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(getAppliedCoupon);
  const [branchCurrencySymbol, setBranchCurrencySymbol] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType");
  });
  const [posPayload, setPosPayload] = useState(() => {
    return typeof window !== "undefined" ? window.__branchSetting : null;
  });

  // Cart Quantities Tracking (reactive to cartUpdated events)
  const [addedItems, setAddedItems] = useState(getItemQuantitiesMap);

  useEffect(() => {
    const handleCartUpdated = () => {
      setAddedItems(getItemQuantitiesMap());
    };
    const handleCouponUpdated = () => {
      setAppliedCoupon(getAppliedCoupon());
    };
    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("couponUpdated", handleCouponUpdated);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("couponUpdated", handleCouponUpdated);
    };
  }, []);

  // Filter States: Deal Type (all | combo | unlimited) and Diet (all | veg | nonveg)
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDiet, setSelectedDiet] = useState("all");

  // Interactive Detail and Addon Modals
  const [selectedItemModal, setSelectedItemModal] = useState(null);
  const [addonModalItem, setAddonModalItem] = useState(null);

  useEffect(() => {
    const pageTitle = translations.specialoffers;
    if (businessDisplayName) {
      document.title = `${pageTitle} | ${businessDisplayName}`;
    } else {
      document.title = pageTitle;
    }
  }, [translations, businessDisplayName]);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedItemModal(null);
      }
    };
    if (selectedItemModal) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedItemModal]);

  const lastBranchIdRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Fetch Deals / Bundles from owner database
  const fetchOffersData = useCallback(async (branchIdParam, force = false) => {
    const currentSubdomain = getWebsiteSubdomain();
    if (!currentSubdomain) {
      setLoading(false);
      return;
    }

    const branchId =
      branchIdParam ||
      localStorage.getItem("selectedBranchId") ||
      (typeof window !== "undefined" && window.__selectedBranch?._id);

    if (!branchId) {
      setLoading(false);
      return;
    }

    // Prevent duplicate refetch for the same branch if already fetched or in-flight
    if (!force && (lastBranchIdRef.current === String(branchId) || isFetchingRef.current)) {
      return;
    }

    lastBranchIdRef.current = String(branchId);
    isFetchingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Menu/GetItemcategory/${branchId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
            "x-subdomain": currentSubdomain,
          },
        }
      );

      if (!response.ok) {
        setRawDealsBundles([]);
        return;
      }

      const data = await response.json();
      const bundles = Array.isArray(data.dealsBundles) ? data.dealsBundles : [];
      setRawDealsBundles(bundles);
      setPosPayload(data.branchSetting || data);

      if (data.branchSetting && typeof window !== "undefined") {
        window.__branchSetting = data.branchSetting;
      }

      // Extract currency symbol
      let symbol = "";
      if (bundles.length > 0 && bundles[0].currencysymbol) {
        symbol = bundles[0].currencysymbol;
      }
      setBranchCurrencySymbol(symbol);
    } catch (err) {
      console.error("Error fetching offers details for website:", err);
      setRawDealsBundles([]);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Listen for branch selection changes
  useEffect(() => {
    fetchOffersData();

    const handleBranchChange = (e) => {
      const newBranch = e?.detail;
      const newBranchId = newBranch?._id || newBranch?.branchid;

      if (newBranch) {
        setSelectedBranch(newBranch);
      }

      // Only refetch if the branch is genuinely different from what was already fetched
      if (newBranchId && String(newBranchId) !== String(lastBranchIdRef.current)) {
        fetchOffersData(newBranchId, true);
      }
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
  }, [fetchOffersData]);

  // Fetch available promotional coupons for active branch
  const promoBranchId =
    selectedBranch?.branchid ||
    selectedBranch?._id ||
    localStorage.getItem("selectedBranchid") ||
    localStorage.getItem("selectedBranchId");

  useEffect(() => {
    if (!couponEnabled || !promoBranchId) {
      return;
    }

    const customerId = localStorage.getItem(customerIdName) || null;
    const subdomain = getWebsiteSubdomain();
    const orderTypeName =
      typeof selectedOrderType === "object" && selectedOrderType !== null
        ? selectedOrderType.ordertypename || selectedOrderType.name || ""
        : selectedOrderType || "";

    let cancelled = false;
    fetchAvailableCoupons({
      branchId: promoBranchId,
      customerId,
      orderType: orderTypeName,
      subtotalprice: 0,
      subdomain,
    })
      .then((res) => {
        if (!cancelled) {
          setPromoCoupons(res.enabled ? res.coupons || [] : []);
        }
      })
      .catch(() => {
        if (!cancelled) setPromoCoupons([]);
      });

    return () => {
      cancelled = true;
    };
  }, [couponEnabled, promoBranchId, selectedOrderType]);

  const visiblePromoCoupons = couponEnabled && promoBranchId ? promoCoupons : [];

  const handleCopyCouponCode = async (code) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
      }
      setCopiedCode(code);
      showSnackbar(`${code} - ${translations.couponcopied}`, "success", 2500);
      setTimeout(() => setCopiedCode((prev) => (prev === code ? "" : prev)), 2500);
    } catch {
      showSnackbar(code, "info", 2500);
    }
  };

  const handleApplyOfferCoupon = async (coupon) => {
    const cart = getCart();
    if (!cart || cart.length === 0) {
      await handleCopyCouponCode(coupon.couponcode);
      return;
    }
    const branchId =
      selectedBranch?.branchid ||
      selectedBranch?._id ||
      localStorage.getItem("selectedBranchid") ||
      localStorage.getItem("selectedBranchId");
    const customerId = localStorage.getItem(customerIdName) || null;
    const subdomain = getWebsiteSubdomain();
    const orderTypeName =
      typeof selectedOrderType === "object" && selectedOrderType !== null
        ? selectedOrderType.ordertypename || selectedOrderType.name || ""
        : selectedOrderType || "";
    const cartSubtotal = cart.reduce((sum, item) => {
      const qty = Number(item.quantity) || 1;
      const addons = (item.addons || []).reduce(
        (s, a) => (a && a.selected !== false ? s + (Number(a.price) || 0) * qty : s),
        0
      );
      return sum + (Number(item.price) || 0) * qty + addons;
    }, 0);

    try {
      const res = await validateCouponCode({
        branchId,
        customerId,
        couponCode: coupon.couponcode,
        orderType: orderTypeName,
        subtotalprice: cartSubtotal,
        subdomain,
      });
      if (!res.valid || !res.coupon) {
        showSnackbar(res.message || translations.invalidcouponcode, "warning", 3500);
        return;
      }
      saveAppliedCoupon(res.coupon);
      setAppliedCoupon(res.coupon);
      showSnackbar(`${res.coupon.couponcode} - ${translations.couponapplied}`, "success", 3000);
    } catch {
      showSnackbar(translations.failedtoapplycoupon, "error", 3000);
    }
  };

  // Format deals to match MenuPage schema
  const formattedDeals = useMemo(() => {
    return rawDealsBundles.map((b) => {
      const rawItemType = (b.itemtype || b.itemType || "").trim().toLowerCase();
      const isNonVeg = rawItemType.includes("non") || rawItemType.includes("egg");
      const isVeg = !isNonVeg && (rawItemType.includes("veg") || rawItemType === "vegan");
      const hasDiet = isVeg || isNonVeg;
      const bundleTypeLower = (b.bundletype || "").toLowerCase();

      const rawPrice = Number(b.rawPrice ?? b.price ?? 0);
      const effectivePrice = calculateItemPrice(
        {
          ...b,
          price: rawPrice,
          rawPrice: rawPrice,
          taxes: b.taxes || [],
        },
        posPayload,
        selectedOrderType
      );

      return {
        id: `deal-${b.dealsbundlesid}`,
        dealsbundlesid: b.dealsbundlesid,
        categoryid: "deals",
        categoryname:
          bundleTypeLower === "combo"
            ? translations.combos
            : bundleTypeLower === "unlimited"
              ? translations.unlimitedmeals
              : translations.specialoffers,
        bundletype: bundleTypeLower,
        title: b.dealsbundlesname || "",
        desc: b.description || "",
        price: effectivePrice,
        rawPrice: rawPrice,
        taxes: b.taxes || [],
        currency: b.currency || "",
        currencysymbol: b.currencysymbol || branchCurrencySymbol || "",
        image: b.imageUrl || "",
        hasDiet,
        isVeg,
        isNonVeg,
        itemtype: b.itemtype || (isVeg ? "Veg" : isNonVeg ? "Non-Veg" : ""),
        preparationtime: b.preparationtime,
        items: b.items || [],
        addons: b.addons || [],
        isDeal: true,
        availability: b.availability,
        isAvailable: b.isAvailable,
        availabilityBadge: b.availabilityBadge,
        sessionBadge: b.sessionBadge,
        statusColor: b.statusColor,
        mealsessions: b.mealsessions,
      };
    });
  }, [rawDealsBundles, branchCurrencySymbol, translations, posPayload, selectedOrderType]);

  const comboMeals = useMemo(() => {
    return formattedDeals.filter((d) => d.bundletype === "combo");
  }, [formattedDeals]);

  const unlimitedMeals = useMemo(() => {
    return formattedDeals.filter((d) => d.bundletype === "unlimited");
  }, [formattedDeals]);

  // Filter by Type and Diet
  const filteredDeals = useMemo(() => {
    return formattedDeals.filter((dish) => {
      // 1. Type Filter
      if (selectedType === "combo" && dish.bundletype !== "combo") return false;
      if (selectedType === "unlimited" && dish.bundletype !== "unlimited") return false;

      // 2. Diet Filter
      if (selectedDiet === "veg" && !dish.isVeg) return false;
      if (selectedDiet === "nonveg" && !dish.isNonVeg) return false;

      return true;
    });
  }, [formattedDeals, selectedType, selectedDiet]);

  const handleCardClick = (dish) => {
    setSelectedItemModal(dish);
  };

  const handleOpenAddonModal = (e, dish) => {
    e.stopPropagation();
    if (dish?.isDeal && dish?.isAvailable === false) {
      showSnackbar(
        `${dish.title || dish.dealsbundlesname || "This deal"} is currently unavailable (${dish.availabilityBadge || "Unavailable"})`,
        "warning"
      );
      return;
    }
    setAddonModalItem(dish);
  };

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    if (item?.isDeal && item?.isAvailable === false) {
      showSnackbar(
        `${item.title || item.dealsbundlesname || "This deal"} is currently unavailable (${item.availabilityBadge || "Unavailable"})`,
        "warning"
      );
      return;
    }
    const effectivePrice = calculateItemPrice(item, posPayload, selectedOrderType);
    const itemWithPrice = {
      ...item,
      price: effectivePrice,
    };
    const addons = itemWithPrice.addons
      ? itemWithPrice.addons.map((addon) => ({
        addonid: addon.addonid || addon._id || addon.id,
        addonname: addon.addonname || addon.name,
        price: Number(addon.price ?? addon.addonprice ?? 0),
        selected: false,
      }))
      : [];

    addItemToCart(itemWithPrice, {
      addons,
      availableAddons: itemWithPrice.addons || [],
      image: itemWithPrice.image || itemWithPrice.imageUrl,
      description: itemWithPrice.desc || itemWithPrice.description,
      showToast: showSnackbar,
    });
  };

  const handleClearFilters = () => {
    setSelectedType("all");
    setSelectedDiet("all");
  };

  const isFilterActive = selectedType !== "all" || selectedDiet !== "all";

  // Centralized deal card renderer
  const renderDealCard = (dish) => {
    const count =
      addedItems[dish.id] ||
      addedItems[dish.dealsbundlesid] ||
      addedItems[String(dish.dealsbundlesid)] ||
      0;

    return (
      <DishCard
        key={dish.id}
        dish={dish}
        selectedBranch={selectedBranch}
        count={count}
        onCardClick={handleCardClick}
        onAddToCart={handleAddToCart}
        onOpenAddonModal={handleOpenAddonModal}
      />
    );
  };

  return (
    <div className={`offers-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs currentPage={translations.specialoffers} />

      <div className="offers-main-content-container">
        {/* Promo Coupons Section (when Coupon module enabled & branch has visible coupons) */}
        {!loading && couponEnabled && visiblePromoCoupons.length > 0 && (
          <div className="promo-coupons-section">
            <div className="promo-coupons-header">
              <ConfirmationNumberOutlinedIcon className="promo-header-icon" />
              <h2 className="promo-coupons-title">{translations.promocoupons}</h2>
            </div>
            <div className="promo-coupons-grid">
              {visiblePromoCoupons.map((c) => {
                const isApplied = appliedCoupon?.couponcode === c.couponcode;
                const isCopied = copiedCode === c.couponcode;
                const badgeText =
                  String(c.discounttype || "").toLowerCase() === "percentage"
                    ? `${Number(c.discountvalue || 0)}% ${translations.offdiscount}`
                    : `${formatPriceFromBranch(Number(c.discountvalue || 0), selectedBranch)} ${translations.offdiscount}`;
                return (
                  <div key={c.couponid || c.couponcode} className="promo-coupon-card">
                    <div className="promo-coupon-top">
                      <span className="promo-discount-badge">{badgeText}</span>
                      {c.endDate && (
                        <span className="promo-expiry-text">
                          {translations.validuntil}: {String(c.endDate).slice(0, 10)}
                        </span>
                      )}
                    </div>
                    <h3 className="promo-coupon-name">{c.couponname || c.couponcode}</h3>
                    {c.description && <p className="promo-coupon-desc">{c.description}</p>}
                    <div className="promo-coupon-constraints">
                      {Number(c.minorderamount) > 0 && (
                        <span className="promo-meta-pill">
                          {translations.minorder}: {formatPriceFromBranch(c.minorderamount, selectedBranch)}
                        </span>
                      )}
                      {String(c.discounttype || "").toLowerCase() === "percentage" &&
                        Number(c.maxdiscountamount) > 0 && (
                          <span className="promo-meta-pill">
                            {translations.maxdiscount}: {formatPriceFromBranch(c.maxdiscountamount, selectedBranch)}
                          </span>
                        )}
                    </div>
                    <div className="promo-coupon-footer">
                      <button
                        type="button"
                        className="promo-code-copy-btn"
                        onClick={() => handleCopyCouponCode(c.couponcode)}
                        title={translations.copycode}
                      >
                        <span className="promo-code-value">{c.couponcode}</span>
                        {isCopied ? <CheckIcon fontSize="inherit" /> : <ContentCopyIcon fontSize="inherit" />}
                      </button>
                      <button
                        type="button"
                        className={`promo-apply-btn ${isApplied ? "is-applied" : ""}`}
                        onClick={() => handleApplyOfferCoupon(c)}
                      >
                        {isApplied ? translations.applied : translations.apply}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter Bar (matching MenuPage ultra-compact design, fully responsive on mobile/tablet) */}
        {!loading && formattedDeals.length > 0 && (
          <div className="offers-filters-wrapper">
            <div className="offers-filter-bar">
              {/* Category Pills Bar (Left) */}
              <div
                className="offers-category-pills-bar"
                role="tablist"
                aria-label="Deals Categories"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedType === "all"}
                  className={`offers-category-pill-btn ${selectedType === "all" ? "active" : ""}`}
                  onClick={() => setSelectedType("all")}
                >
                  <span>{translations.alloffers}</span>
                </button>

                {comboMeals.length > 0 && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedType === "combo"}
                    className={`offers-category-pill-btn ${selectedType === "combo" ? "active" : ""}`}
                    onClick={() => setSelectedType("combo")}
                  >
                    <span>{translations.combos}</span>
                  </button>
                )}

                {unlimitedMeals.length > 0 && (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedType === "unlimited"}
                    className={`offers-category-pill-btn ${selectedType === "unlimited" ? "active" : ""}`}
                    onClick={() => setSelectedType("unlimited")}
                  >
                    <span>{translations.unlimitedmeals}</span>
                  </button>
                )}
              </div>

              {/* Diet Filter (Veg / Non-Veg) - positioned on left next to Category Pills */}
              <div className="offers-diet-toggle-wrap">
                <div className="offers-diet-segmented-group" role="group" aria-label="Dietary preference">
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`offers-diet-segment-btn ${selectedDiet === "all" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("all")}
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={(e) => e.target.blur()}
                  >
                    <span>{translations.all}</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`offers-diet-segment-btn diet-veg ${selectedDiet === "veg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("veg")}
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={(e) => e.target.blur()}
                  >
                    <span className="offers-diet-box">
                      <span className="offers-diet-dot" />
                    </span>
                    <span>{translations.veg}</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`offers-diet-segment-btn diet-nonveg ${selectedDiet === "nonveg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("nonveg")}
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={(e) => e.target.blur()}
                  >
                    <span className="offers-diet-box">
                      <span className="offers-diet-dot" />
                    </span>
                    <span>{translations.nonveg}</span>
                  </button>
                </div>
              </div>

              {/* Filter Reset Action (Right-aligned) */}
              {isFilterActive && (
                <div className="offers-filter-actions-wrap">
                  <button
                    type="button"
                    className="offers-filter-clear-btn"
                    onClick={handleClearFilters}
                    title={translations.resetfilters}
                  >
                    <CloseIcon fontSize="small" />
                    <span>{translations.clear}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content Section: Loading Shimmer, Grid, or Empty State */}
        {loading ? (
          <div className="offers-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="offers-skeleton-card">
                <div className="skeleton-img" />
                <div className="skeleton-body">
                  <div className="skeleton-line title" />
                  <div className="skeleton-line desc1" />
                  <div className="skeleton-line desc2" />
                  <div className="skeleton-line footer" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredDeals.length > 0 ? (
          <div className="offers-grid">
            {filteredDeals.map(renderDealCard)}
          </div>
        ) : formattedDeals.length > 0 ? (
          /* Filter Empty State - Exact parity with Manage Address */
          <div className="offers-empty-state offers-filter-empty-state">
            <div className="empty-icon-wrap search">
              <SearchOffIcon className="empty-icon" />
            </div>
            <h2 className="empty-title">
              {translations.nomatchingitems}
            </h2>
            <p className="empty-subtitle">
              {translations.tryadjustingfilters}
            </p>
            {isFilterActive && (
              <button
                type="button"
                className="empty-add-btn"
                onClick={handleClearFilters}
              >
                <CloseIcon fontSize="small" />
                <span>{translations.resetfilters}</span>
              </button>
            )}
          </div>
        ) : visiblePromoCoupons.length === 0 ? (
          /* Empty State (No Deals or Coupons at Branch) - Exact parity with Manage Address */
          <div className="offers-empty-state no-offers-state">
            <div className="empty-icon-wrap">
              <LocalOfferOutlinedIcon className="empty-icon" />
            </div>
            <h2 className="empty-title">
              {translations.nodealsfound}
            </h2>
            <p className="empty-subtitle">
              {translations.nodealsdescription}
            </p>
            <Link to="/menu" className="empty-add-btn">
              <RestaurantMenuIcon fontSize="small" />
              <span>{translations.exploremenu}</span>
            </Link>
          </div>
        ) : null}
      </div>

      {/* Centralized Deal Detail Modal */}
      <DishDetailModal
        item={selectedItemModal}
        onClose={() => setSelectedItemModal(null)}
        selectedBranch={selectedBranch}
        posPayload={posPayload}
        selectedOrderType={selectedOrderType}
        initialQuantity={
          selectedItemModal
            ? addedItems[selectedItemModal.id] ||
            addedItems[selectedItemModal.dealsbundlesid] ||
            addedItems[String(selectedItemModal.dealsbundlesid)] ||
            1
            : 1
        }
      />

      {/* Centralized Quick Add-on Customization Popup Modal */}
      <DishAddonModal
        item={addonModalItem}
        onClose={() => setAddonModalItem(null)}
        selectedBranch={selectedBranch}
        posPayload={posPayload}
        selectedOrderType={selectedOrderType}
      />
    </div>
  );
};

export default OffersPage;