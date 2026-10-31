import { useState, useEffect, useMemo, useCallback } from "react";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import "../../Scss/Pages/Offers/offerspage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge using pure CSS (matching MenuPage)
 */
const DietIndicator = ({ isVeg, className = "" }) => {
  const { translations = {} } = useLanguage();

  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? translations.veg : translations.nonveg}
      aria-label={isVeg ? translations.veg : translations.nonveg}
    >
      <span className="diet-box">
        <span className="diet-dot" />
      </span>
    </span>
  );
};

const OffersPage = () => {
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  const [loading, setLoading] = useState(true);
  const [rawDealsBundles, setRawDealsBundles] = useState([]);
  const [branchCurrencySymbol, setBranchCurrencySymbol] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType");
  });
  const [posPayload, setPosPayload] = useState(() => {
    return typeof window !== "undefined" ? window.__branchSetting : null;
  });

  // Filter States: Deal Type (all | combo | unlimited) and Diet (all | veg | nonveg)
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDiet, setSelectedDiet] = useState("all");

  // Interactive Detail Modal
  const [selectedItemModal, setSelectedItemModal] = useState(null);

  useEffect(() => {
    const pageTitle = translations.specialoffers || "Special Offers & Deals";
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

  // Fetch Deals / Bundles from owner database
  const fetchOffersData = useCallback(async (branchIdParam) => {
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
      setLoading(false);
    }
  }, []);

  // Listen for branch selection changes
  useEffect(() => {
    fetchOffersData();

    const handleBranchChange = (e) => {
      if (e?.detail) {
        setSelectedBranch(e.detail);
        if (e.detail._id) fetchOffersData(e.detail._id);
        else fetchOffersData();
      } else {
        setSelectedBranch(getActiveBranch());
        fetchOffersData();
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
            ? translations.combos || "Combos"
            : bundleTypeLower === "unlimited"
              ? translations.unlimitedmeals || "Unlimited Meals"
              : translations.specialoffers || "Special Offers",
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

  const handleClearFilters = () => {
    setSelectedType("all");
    setSelectedDiet("all");
  };

  const isFilterActive = selectedType !== "all" || selectedDiet !== "all";

  // Reusable deal card renderer (exact same design as MenuPage)
  const renderDealCard = (dish) => {
    const priceFormatted = formatPriceFromBranch(dish.price, selectedBranch);
    const isCombo = dish.bundletype === "combo";
    const isUnlimited = dish.bundletype === "unlimited";

    return (
      <div
        key={dish.id}
        className={`dish-card deal-card ${isCombo ? "combo-card" : ""} ${isUnlimited ? "unlimited-card" : ""}`}
        onClick={() => handleCardClick(dish)}
      >
        <div className="dish-img-box">
          <img
            src={dish.image}
            alt={dish.title}
            className="dish-img"
            loading="lazy"
          />

          {dish.bundletype && (
            <span className={`deal-ribbon-badge ${dish.bundletype}`}>
              {dish.bundletype === "combo"
                ? translations.combo || "COMBO"
                : translations.unlimited || "UNLIMITED"}
            </span>
          )}

          {dish.preparationtime && Number(dish.preparationtime) > 0 && (
            <span className="dish-prep-time">
              <AccessTimeIcon fontSize="inherit" />
              {dish.preparationtime} {translations.min || "min"}
            </span>
          )}

          {dish.hasDiet && (dish.isVeg || dish.isNonVeg) && (
            <DietIndicator isVeg={dish.isVeg} />
          )}
        </div>

        <div className="dish-content">
          <h3 className="dish-title" title={dish.title}>
            {dish.title}
          </h3>

          {dish.desc && (
            <p className="dish-desc" title={dish.desc}>
              {dish.desc}
            </p>
          )}

          {dish.items && dish.items.length > 0 && (
            <div className="deal-items-preview-row">
              <span className="deal-items-pill">
                🍽️ {dish.items.length}{" "}
                {dish.items.length === 1
                  ? translations.itemincluded || "item included"
                  : translations.itemsincluded || "items included"}
              </span>
            </div>
          )}

          <div className="dish-footer-row">
            <div className="dish-price-group">
              <span className="dish-price">{priceFormatted}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`offers-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs currentPage={translations.specialoffers || "Special Offers & Deals"} />

      <div className="offers-main-content-container">
        {/* Filter Bar (matching MenuPage) */}
        {!loading && formattedDeals.length > 0 && (
          <div className="menu-filters-wrapper">
            <div className="menu-filter-bar">
              {/* Diet Filter (Veg / Non-Veg) */}
              <div className="filter-item-wrap diet-toggle-wrap">
                <div className="diet-segmented-group" role="group" aria-label="Dietary preference">
                  <button
                    type="button"
                    className={`diet-segment-btn ${selectedDiet === "all" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("all")}
                  >
                    <span>{translations.all || "All"}</span>
                  </button>
                  <button
                    type="button"
                    className={`diet-segment-btn diet-veg ${selectedDiet === "veg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("veg")}
                  >
                    <span className="diet-box">
                      <span className="diet-dot" />
                    </span>
                    <span>{translations.veg || "Veg"}</span>
                  </button>
                  <button
                    type="button"
                    className={`diet-segment-btn diet-nonveg ${selectedDiet === "nonveg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("nonveg")}
                  >
                    <span className="diet-box">
                      <span className="diet-dot" />
                    </span>
                    <span>{translations.nonveg || "Non-Veg"}</span>
                  </button>
                </div>
              </div>

              {/* Filter Count & Reset Action */}
              <div className="filter-actions-wrap">
                <span className="filter-results-badge">
                  {filteredDeals.length}{" "}
                  {filteredDeals.length === 1
                    ? translations.deal || "deal"
                    : translations.deals || "deals"}
                </span>
                {isFilterActive && (
                  <button
                    type="button"
                    className="filter-clear-btn"
                    onClick={handleClearFilters}
                    title="Clear all filters"
                  >
                    <CloseIcon fontSize="small" />
                    <span>{translations.clear || "Clear"}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Category Pills Bar (Wraps across lines, matching MenuPage) */}
            <div
              className="menu-category-pills-bar"
              role="tablist"
              aria-label="Deals Categories"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedType === "all"}
                className={`category-pill-btn ${selectedType === "all" ? "active" : ""}`}
                onClick={() => setSelectedType("all")}
              >
                <span>{translations.alloffers || "All Deals"}</span>
                <span className="pill-badge">{formattedDeals.length}</span>
              </button>

              {comboMeals.length > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedType === "combo"}
                  className={`category-pill-btn ${selectedType === "combo" ? "active" : ""}`}
                  onClick={() => setSelectedType("combo")}
                >
                  <span>{translations.combos || "Combos"}</span>
                  <span className="pill-badge">{comboMeals.length}</span>
                </button>
              )}

              {unlimitedMeals.length > 0 && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedType === "unlimited"}
                  className={`category-pill-btn ${selectedType === "unlimited" ? "active" : ""}`}
                  onClick={() => setSelectedType("unlimited")}
                >
                  <span>{translations.unlimitedmeals || "Unlimited Meals"}</span>
                  <span className="pill-badge">{unlimitedMeals.length}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content Section: Loading Shimmer, Grid, or Empty State */}
        {loading ? (
          <div className="dishes-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="dish-skeleton-card">
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
          <div className="dishes-grid offers-grid">
            {filteredDeals.map(renderDealCard)}
          </div>
        ) : formattedDeals.length > 0 ? (
          <div className="menu-filter-empty-state">
            <div className="filter-empty-icon-wrap">
              <LocalOfferOutlinedIcon />
            </div>
            <h3>{translations.nomatchingitems || "No matching deals found"}</h3>
            <p>{translations.tryadjustingfilters || "Try adjusting your filters to find what you are looking for."}</p>
            {isFilterActive && (
              <button
                type="button"
                className="reset-filter-btn"
                onClick={handleClearFilters}
              >
                {translations.resetfilters || "Reset Filters"}
              </button>
            )}
          </div>
        ) : (
          <div className="no-dishes-state">
            <LocalOfferOutlinedIcon className="no-dishes-icon" />
            <h4>{translations.nodealsfound || "No special offers available at this branch right now."}</h4>
          </div>
        )}
      </div>

      {/* Interactive Detail Modal (matching MenuPage) */}
      {selectedItemModal && (
        <div className="dish-modal-overlay" onClick={() => setSelectedItemModal(null)}>
          <div className="dish-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dish-modal-close-btn"
              onClick={() => setSelectedItemModal(null)}
              aria-label={translations.close || "Close"}
            >
              <CloseIcon fontSize="small" />
            </button>

            {/* Hero Image */}
            <div className="dish-modal-hero">
              <img
                src={selectedItemModal.image}
                alt={selectedItemModal.title}
              />
              {selectedItemModal.hasDiet && (selectedItemModal.isVeg || selectedItemModal.isNonVeg) && (
                <DietIndicator isVeg={selectedItemModal.isVeg} className="dish-modal-diet-badge" />
              )}
            </div>

            <div className="dish-modal-body">
              <div className="dish-modal-header">
                <div>
                  <h3 className="dish-modal-title">{selectedItemModal.title}</h3>
                  <div className="dish-modal-tags">
                    {selectedItemModal.bundletype && (
                      <span className={`tag-badge deal-ribbon-badge ${selectedItemModal.bundletype}`} style={{ position: "static" }}>
                        {selectedItemModal.bundletype === "combo"
                          ? translations.combo || "COMBO"
                          : translations.unlimited || "UNLIMITED"}
                      </span>
                    )}
                    {selectedItemModal.preparationtime && Number(selectedItemModal.preparationtime) > 0 && (
                      <span className="tag-badge">⏱ {selectedItemModal.preparationtime} {translations.min || "min"}</span>
                    )}
                  </div>
                </div>

                <span className="dish-modal-price">
                  {formatPriceFromBranch(selectedItemModal.price, selectedBranch)}
                </span>
              </div>

              {selectedItemModal.desc && (
                <p className="dish-modal-desc">{selectedItemModal.desc}</p>
              )}

              {/* Items included in Deals/Bundles */}
              {selectedItemModal.items && selectedItemModal.items.length > 0 && (
                <div className="dish-modal-addons-box">
                  <h5>{translations.includeditems || "Included Items"}</h5>
                  <div className="addons-list">
                    {selectedItemModal.items.map((it, idx) => (
                      <div key={it.itemid || idx} className="addon-item-row">
                        <span>• {it.itemname || it.name}</span>
                        {it.quantity && <span className="addon-price">x{it.quantity}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Addons included in Deals/Bundles */}
              {selectedItemModal.addons && selectedItemModal.addons.length > 0 && (
                <div className="dish-modal-addons-box">
                  <h5>{translations.addons || "Add-ons"}</h5>
                  <div className="addons-list">
                    {selectedItemModal.addons.map((addon) => {
                      const addonKey = addon.addonid || addon._id;
                      return (
                        <div key={addonKey} className="addon-item-row not-selectable">
                          <div className="addon-check-label">
                            <span>• {addon.addonname}</span>
                          </div>
                          {addon.price && Number(addon.price) > 0 && (
                            <span className="addon-price">
                              +{formatPriceFromBranch(addon.price, selectedBranch)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OffersPage;