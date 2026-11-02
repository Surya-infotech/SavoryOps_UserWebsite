import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import DishCard, { DishDetailModal } from "../../Components/Common/DishCard.jsx";
import { getActiveBranch } from "../../utils/formatCurrency.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import "../../Scss/Pages/Offers/offerspage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;


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

  // Centralized deal card renderer
  const renderDealCard = (dish) => {
    return (
      <DishCard
        key={dish.id}
        dish={dish}
        selectedBranch={selectedBranch}
        onCardClick={handleCardClick}
      />
    );
  };

  return (
    <div className={`offers-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs currentPage={translations.specialoffers || "Special Offers & Deals"} />

      <div className="offers-main-content-container">
        {/* Filter Bar (matching MenuPage ultra-compact design, fully responsive on mobile/tablet) */}
        {!loading && formattedDeals.length > 0 && (
          <div className="menu-filters-wrapper offers-filters-wrapper">
            <div className="menu-filter-bar offers-filter-bar">
              {/* Category Pills Bar (Left) */}
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
                  </button>
                )}
              </div>

              {/* Diet Filter (Veg / Non-Veg) - positioned on left next to Category Pills */}
              <div className="filter-item-wrap diet-toggle-wrap">
                <div className="diet-segmented-group" role="group" aria-label="Dietary preference">
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`diet-segment-btn ${selectedDiet === "all" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("all")}
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={(e) => e.target.blur()}
                  >
                    <span>{translations.all || "All"}</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`diet-segment-btn diet-veg ${selectedDiet === "veg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("veg")}
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={(e) => e.target.blur()}
                  >
                    <span className="diet-box">
                      <span className="diet-dot" />
                    </span>
                    <span>{translations.veg || "Veg"}</span>
                  </button>
                  <button
                    type="button"
                    tabIndex={-1}
                    className={`diet-segment-btn diet-nonveg ${selectedDiet === "nonveg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("nonveg")}
                    onMouseDown={(e) => e.preventDefault()}
                    onFocus={(e) => e.target.blur()}
                  >
                    <span className="diet-box">
                      <span className="diet-dot" />
                    </span>
                    <span>{translations.nonveg || "Non-Veg"}</span>
                  </button>
                </div>
              </div>

              {/* Filter Reset Action (Right-aligned) */}
              {isFilterActive && (
                <div className="filter-actions-wrap">
                  <button
                    type="button"
                    className="filter-clear-btn"
                    onClick={handleClearFilters}
                    title="Clear all filters"
                  >
                    <CloseIcon fontSize="small" />
                    <span>{translations.clear || "Clear"}</span>
                  </button>
                </div>
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
          /* Filter Empty State - Exact parity with Manage Address */
          <div className="address-empty-card menu-filter-empty-state">
            <div className="empty-icon-wrap search">
              <SearchOffIcon className="empty-icon" />
            </div>
            <h2 className="empty-title">
              {translations.nomatchingitems || "No matching deals found"}
            </h2>
            <p className="empty-subtitle">
              {translations.tryadjustingfilters ||
                "Try adjusting your filters to find what you are looking for."}
            </p>
            {isFilterActive && (
              <button
                type="button"
                className="empty-add-btn"
                onClick={handleClearFilters}
              >
                <CloseIcon fontSize="small" />
                <span>{translations.resetfilters || "Reset Filters"}</span>
              </button>
            )}
          </div>
        ) : (
          /* Empty State (No Deals at Branch) - Exact parity with Manage Address */
          <div className="address-empty-card no-dishes-state">
            <div className="empty-icon-wrap">
              <LocalOfferOutlinedIcon className="empty-icon" />
            </div>
            <h2 className="empty-title">
              {translations.nodealsfound || "No special offers available at this branch right now."}
            </h2>
            <p className="empty-subtitle">
              {translations.nodealsdescription ||
                "There are currently no active offers or combo deals for this branch. Explore our main menu to discover delicious treats!"}
            </p>
            <Link to="/menu" className="empty-add-btn">
              <RestaurantMenuIcon fontSize="small" />
              <span>{translations.exploremenu || "Explore Menu"}</span>
            </Link>
          </div>
        )}
      </div>

      {/* Centralized Deal Detail Modal */}
      <DishDetailModal
        item={selectedItemModal}
        onClose={() => setSelectedItemModal(null)}
        selectedBranch={selectedBranch}
        posPayload={posPayload}
        selectedOrderType={selectedOrderType}
      />
    </div>
  );
};

export default OffersPage;