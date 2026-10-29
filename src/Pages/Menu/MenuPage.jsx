import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AddIcon from "@mui/icons-material/Add";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import { formatPriceFromBranch, getActiveBranch } from "../../utils/formatCurrency.js";
import "../../Scss/Pages/Menu/menupage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge using pure CSS (No SVG)
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

const MenuPage = () => {
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState({});

  // Raw API data from owner database
  const [rawCategories, setRawCategories] = useState([]);
  const [rawDealsBundles, setRawDealsBundles] = useState([]);
  const [branchCurrencySymbol, setBranchCurrencySymbol] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);

  useEffect(() => {
    if (businessDisplayName) {
      document.title = `${translations.menu} | ${businessDisplayName}`;
    }
  }, [businessDisplayName, translations]);

  // Fetch Menu, Category, Item, and Deal data from website endpoint
  const fetchMenuData = useCallback(async (branchIdParam) => {
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
      const response = await fetch(`${adminPanelBackendPath}/Website/Menu/GetItemcategory/${branchId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user": "admin",
          "x-subdomain": currentSubdomain,
        },
      });

      if (!response.ok) {
        setRawCategories([]);
        setRawDealsBundles([]);
        return;
      }

      const data = await response.json();
      const categories = Array.isArray(data.itemCategories) ? data.itemCategories : [];
      const bundles = Array.isArray(data.dealsBundles) ? data.dealsBundles : [];

      setRawCategories(categories);
      setRawDealsBundles(bundles);

      // Extract currency symbol from first item or deal
      let symbol = "";
      for (const cat of categories) {
        for (const mg of cat.menuGroups || []) {
          for (const item of mg.itemDetails || []) {
            if (item.currencysymbol) {
              symbol = item.currencysymbol;
              break;
            }
          }
          if (symbol) break;
        }
        if (symbol) break;
      }
      setBranchCurrencySymbol(symbol);
    } catch (err) {
      console.error("Error fetching menu details for website:", err);
      setRawCategories([]);
      setRawDealsBundles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for branch selection changes across the website
  useEffect(() => {
    fetchMenuData();

    const handleBranchChange = (e) => {
      if (e?.detail) {
        setSelectedBranch(e.detail);
        if (e.detail._id) fetchMenuData(e.detail._id);
        else fetchMenuData();
      } else {
        setSelectedBranch(getActiveBranch());
        fetchMenuData();
      }
    };

    window.addEventListener("branchChange", handleBranchChange);

    // If navbar is already mounted, request the current branch
    window.dispatchEvent(new CustomEvent("requestBranch"));

    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, [fetchMenuData]);

  // Extract all flat items across all categories and menu groups
  const allDishes = useMemo(() => {
    const list = [];
    rawCategories.forEach((cat) => {
      (cat.menuGroups || []).forEach((mg) => {
        const menuDetails = mg.menuDetails || {};
        (mg.itemDetails || []).forEach((item) => {
          const rawItemType = (item.itemtype || item.itemType || "").trim().toLowerCase();
          const isNonVeg = rawItemType.includes("non") || rawItemType.includes("egg");
          const isVeg = !isNonVeg && (rawItemType.includes("veg") || rawItemType === "vegan");
          const hasDiet = isVeg || isNonVeg;

          list.push({
            id: String(item.itemid),
            itemid: item.itemid,
            categoryid: cat.itemcategoryid,
            categoryname: cat.itemcategoryname || "",
            menuid: menuDetails.menuid,
            menuname: menuDetails.menuname || "",
            title: item.itemname || "",
            desc: item.description || "",
            price: item.price != null ? item.price : 0,
            currency: item.currency || "",
            currencysymbol: item.currencysymbol || branchCurrencySymbol || "",
            image: item.imageUrl || "",
            hasDiet,
            isVeg,
            isNonVeg,
            preparationtime: item.preparationtime,
            addons: item.addons || [],
            isDeal: false,
            filterType: String(cat.itemcategoryid),
          });
        });
      });
    });
    return list;
  }, [rawCategories, branchCurrencySymbol]);

  const formattedDeals = useMemo(() => {
    return rawDealsBundles.map((b) => {
      const rawItemType = (b.itemtype || b.itemType || "").trim().toLowerCase();
      const isNonVeg = rawItemType.includes("non") || rawItemType.includes("egg");
      const isVeg = !isNonVeg && (rawItemType.includes("veg") || rawItemType === "vegan");
      const hasDiet = isVeg || isNonVeg;
      const bundleTypeLower = (b.bundletype || "").toLowerCase();

      return {
        id: `deal-${b.dealsbundlesid}`,
        dealsbundlesid: b.dealsbundlesid,
        categoryid: "deals",
        categoryname:
          bundleTypeLower === "combo"
            ? translations.combos
            : bundleTypeLower === "unlimited"
              ? translations.unlimitedmeals
              : "",
        bundletype: bundleTypeLower,
        title: b.dealsbundlesname || "",
        desc: b.description || "",
        price: b.price != null ? b.price : 0,
        currency: b.currency || "",
        currencysymbol: b.currencysymbol || branchCurrencySymbol || "",
        image: b.imageUrl || "",
        hasDiet,
        isVeg,
        isNonVeg,
        preparationtime: b.preparationtime,
        items: b.items || [],
        addons: b.addons || [],
        isDeal: true,
        filterType: bundleTypeLower === "combo" ? "combos" : "unlimited",
      };
    });
  }, [rawDealsBundles, branchCurrencySymbol, translations]);

  const comboMeals = useMemo(() => {
    return formattedDeals.filter((d) => d.bundletype === "combo");
  }, [formattedDeals]);

  const unlimitedMeals = useMemo(() => {
    return formattedDeals.filter((d) => d.bundletype === "unlimited");
  }, [formattedDeals]);

  // Unified list of all items across combos, unlimited, and standard dishes
  const allCombinedItems = useMemo(() => {
    return [...comboMeals, ...unlimitedMeals, ...allDishes];
  }, [comboMeals, unlimitedMeals, allDishes]);

  // Filter States: Menu, Item Category, Veg / Non-Veg
  const [searchParams] = useSearchParams();
  const [selectedMenu, setSelectedMenu] = useState(() => searchParams.get("menu") || "all");
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || "all");
  const [selectedDiet, setSelectedDiet] = useState("all"); // "all" | "veg" | "nonveg"

  useEffect(() => {
    const m = searchParams.get("menu");
    const c = searchParams.get("category");
    if (m) setSelectedMenu(m);
    if (c) setSelectedCategory(c);
  }, [searchParams]);

  // Dynamically extract unique available Menus
  const availableMenus = useMemo(() => {
    const map = new Map();
    allDishes.forEach((d) => {
      if (d.menuid && d.menuname) {
        map.set(String(d.menuid), d.menuname);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allDishes]);

  // Options for custom Dropdown component
  const menuOptions = useMemo(() => {
    return [
      { id: "all", name: translations.allmenus },
      ...availableMenus,
    ];
  }, [availableMenus, translations]);

  // Dynamically extract unique available Categories with item counts
  const availableCategories = useMemo(() => {
    const list = [];
    if (comboMeals.length > 0) {
      list.push({
        id: "combo",
        name: translations.combos,
        count: comboMeals.length,
      });
    }
    if (unlimitedMeals.length > 0) {
      list.push({
        id: "unlimited",
        name: translations.unlimitedmeals,
        count: unlimitedMeals.length,
      });
    }
    rawCategories.forEach((cat) => {
      const catId = String(cat.itemcategoryid);
      const count = allDishes.filter((d) => String(d.categoryid) === catId).length;
      list.push({
        id: catId,
        name: cat.itemcategoryname || "Category",
        count,
      });
    });
    return list;
  }, [rawCategories, comboMeals.length, unlimitedMeals.length, allDishes, translations]);

  // Filter items based on selected Menu, Item Category, and Diet (Veg/Non-Veg)
  const filteredItems = useMemo(() => {
    return allCombinedItems.filter((item) => {
      // 1. Menu Filter
      if (selectedMenu !== "all") {
        if (item.isDeal) {
          if (selectedCategory !== "combo" && selectedCategory !== "unlimited") {
            return false;
          }
        } else if (String(item.menuid) !== String(selectedMenu)) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        if (selectedCategory === "combo") {
          if (!item.isDeal || item.bundletype !== "combo") return false;
        } else if (selectedCategory === "unlimited") {
          if (!item.isDeal || item.bundletype !== "unlimited") return false;
        } else {
          if (item.isDeal || String(item.categoryid) !== String(selectedCategory)) {
            return false;
          }
        }
      }

      // 3. Diet Filter (Veg / Non-Veg)
      if (selectedDiet === "veg") {
        if (!item.isVeg) return false;
      } else if (selectedDiet === "nonveg") {
        if (!item.isNonVeg) return false;
      }

      return true;
    });
  }, [allCombinedItems, selectedMenu, selectedCategory, selectedDiet]);

  const isFilterActive =
    selectedMenu !== "all" || selectedCategory !== "all" || selectedDiet !== "all";

  const handleClearFilters = () => {
    setSelectedMenu("all");
    setSelectedCategory("all");
    setSelectedDiet("all");
  };


  // Modal States
  const [selectedItemModal, setSelectedItemModal] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  // Dedicated Addon Popup Modal State
  const [addonModalItem, setAddonModalItem] = useState(null);
  const [addonQuantity, setAddonQuantity] = useState(1);

  const handleOpenAddonModal = (e, dish) => {
    e.stopPropagation();
    setAddonModalItem(dish);
    setSelectedAddonIds([]);
    setAddonQuantity(1);
  };

  const toggleAddon = (addonKey) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonKey)
        ? prev.filter((id) => id !== addonKey)
        : [...prev, addonKey]
    );
  };

  const handleConfirmAddonModal = () => {
    if (addonModalItem) {
      setAddedItems((prev) => ({
        ...prev,
        [addonModalItem.id]: (prev[addonModalItem.id] || 0) + addonQuantity,
      }));
      setAddonModalItem(null);
    }
  };

  // Addon prices calculation for dedicated Addon modal
  const selectedAddonsTotal = useMemo(() => {
    if (!addonModalItem || !addonModalItem.addons) return 0;
    return addonModalItem.addons
      .filter((a) => selectedAddonIds.includes(a.addonid || a._id))
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
  }, [addonModalItem, selectedAddonIds]);

  const addonModalGrandTotal = useMemo(() => {
    if (!addonModalItem) return 0;
    const base = Number(addonModalItem.price || 0);
    return (base + selectedAddonsTotal) * addonQuantity;
  }, [addonModalItem, selectedAddonsTotal, addonQuantity]);

  // Addon prices calculation for standard item details modal
  const selectedItemAddonsTotal = useMemo(() => {
    if (!selectedItemModal || !selectedItemModal.addons) return 0;
    return selectedItemModal.addons
      .filter((a) => selectedAddonIds.includes(a.addonid || a._id))
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
  }, [selectedItemModal, selectedAddonIds]);

  const selectedItemGrandTotal = useMemo(() => {
    if (!selectedItemModal) return 0;
    const base = Number(selectedItemModal.price || 0);
    return (base + selectedItemAddonsTotal) * modalQuantity;
  }, [selectedItemModal, selectedItemAddonsTotal, modalQuantity]);

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
    setAddedItems((prev) => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1,
    }));
  };

  const handleCardClick = (item) => {
    setSelectedItemModal(item);
    setModalQuantity(addedItems[item.id] || 1);
    setSelectedAddonIds([]);
  };

  const handleConfirmModalAdd = () => {
    if (selectedItemModal) {
      setAddedItems((prev) => ({
        ...prev,
        [selectedItemModal.id]: (prev[selectedItemModal.id] || 0) + modalQuantity,
      }));
      setSelectedItemModal(null);
    }
  };

  // Reusable card renderer
  const renderDishCard = (dish) => {
    const count = addedItems[dish.id] || 0;
    const priceFormatted = formatPriceFromBranch(dish.price, selectedBranch);
    const isCombo = dish.isDeal && dish.bundletype === "combo";
    const isUnlimited = dish.isDeal && dish.bundletype === "unlimited";

    return (
      <div
        key={dish.id}
        className={`dish-card ${dish.isDeal ? "deal-card" : ""} ${isCombo ? "combo-card" : ""} ${isUnlimited ? "unlimited-card" : ""}`}
        onClick={() => handleCardClick(dish)}
      >
        <div className="dish-img-box">
          <img
            src={dish.image}
            alt={dish.title}
            className="dish-img"
            loading="lazy"
          />

          {dish.isDeal ? (
            dish.bundletype ? (
              <span className={`deal-ribbon-badge ${dish.bundletype}`}>
                {dish.bundletype === "combo" ? translations.combo : translations.unlimited}
              </span>
            ) : null
          ) : (
            dish.categoryname && <span className="dish-tag-badge">{dish.categoryname}</span>
          )}

          {dish.preparationtime && Number(dish.preparationtime) > 0 && (
            <span className="dish-prep-time">
              <AccessTimeIcon fontSize="inherit" />
              {dish.preparationtime} {translations.min}
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

          {dish.isDeal && dish.items && dish.items.length > 0 && (
            <div className="deal-items-preview-row">
              <span className="deal-items-pill">
                🍽️ {dish.items.length} {dish.items.length === 1 ? translations.itemincluded : translations.itemsincluded}
              </span>
            </div>
          )}

          <div className="dish-footer-row">
            <div className="dish-price-group">
              <span className="dish-price">{priceFormatted}</span>
            </div>

            <div className="dish-card-actions">
              {/* Addon Button when addon details are found (hidden on combo and unlimited cards) */}
              {!isCombo && !isUnlimited && !dish.isDeal && dish.addons && dish.addons.length > 0 && (
                <button
                  type="button"
                  className="dish-addon-btn"
                  onClick={(e) => handleOpenAddonModal(e, dish)}
                  title={`${translations.addons} - ${dish.title}`}
                  aria-label={`${dish.title} ${translations.addons}`}
                >
                  <AddIcon className="addon-btn-icon" />
                </button>
              )}

              {!isCombo && !isUnlimited && (
                <button
                  type="button"
                  className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                  onClick={(e) => handleAddToCart(e, dish)}
                  aria-label={translations.addtocart}
                  title={count > 0 ? `${translations.added} (${count})` : translations.addtocart}
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

  return (
    <div className="menu-page-wrapper">
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs currentPage={translations.menu} />

      <div className="menu-main-content-container">
        {/* --- Modern Interactive Filters (Menu, Item Category, Veg / Non-Veg) --- */}
        {!loading && allCombinedItems.length > 0 && (
          <div className="menu-filters-wrapper">
            <div className="menu-filter-bar">
              {/* 1. Menu Filter Dropdown (Custom Searchable Dropdown) */}
              {availableMenus.length > 0 && (
                <div className="filter-item-wrap menu-dropdown-wrap">
                  <div className="menu-custom-dropdown-container">
                    <Dropdown
                      id="menu-filter-dropdown"
                      options={menuOptions}
                      labelKey="name"
                      valueKey="id"
                      selectedValue={selectedMenu}
                      onValueChange={(val) => setSelectedMenu(val || "all")}
                      placeholder={translations.allmenus}
                      showSearch={true}
                      className="menu-page-dropdown"
                    />
                  </div>
                </div>
              )}

              {/* 2. Diet Filter (Veg / Non-Veg) Segmented Group */}
              <div className="filter-item-wrap diet-toggle-wrap">
                <div className="diet-segmented-group" role="group" aria-label="Dietary preference">
                  <button
                    type="button"
                    className={`diet-segment-btn ${selectedDiet === "all" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("all")}
                  >
                    <span>{translations.all}</span>
                  </button>
                  <button
                    type="button"
                    className={`diet-segment-btn diet-veg ${selectedDiet === "veg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("veg")}
                  >
                    <span className="diet-box">
                      <span className="diet-dot" />
                    </span>
                    <span>{translations.veg}</span>
                  </button>
                  <button
                    type="button"
                    className={`diet-segment-btn diet-nonveg ${selectedDiet === "nonveg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("nonveg")}
                  >
                    <span className="diet-box">
                      <span className="diet-dot" />
                    </span>
                    <span>{translations.nonveg}</span>
                  </button>
                </div>
              </div>

              {/* Filter Count & Reset Action */}
              <div className="filter-actions-wrap">
                <span className="filter-results-badge">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1
                    ? translations.dish
                    : translations.dishes}
                </span>
                {isFilterActive && (
                  <button
                    type="button"
                    className="filter-clear-btn"
                    onClick={handleClearFilters}
                    title="Clear all filters"
                  >
                    <CloseIcon fontSize="small" />
                    <span>{translations.clear}</span>
                  </button>
                )}
              </div>
            </div>

            {/* 3. Item Category Filter Pills (Wraps across lines, no horizontal scroll) */}
            {availableCategories.length > 0 && (
              <div
                className="menu-category-pills-bar"
                role="tablist"
                aria-label="Item Categories"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={selectedCategory === "all"}
                  className={`category-pill-btn ${selectedCategory === "all" ? "active" : ""}`}
                  onClick={() => setSelectedCategory("all")}
                >
                  <span>{translations.allcategories}</span>
                  <span className="pill-badge">{allCombinedItems.length}</span>
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === cat.id}
                    className={`category-pill-btn ${selectedCategory === cat.id ? "active" : ""}`}
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    <span>{cat.name}</span>
                    {cat.count != null && <span className="pill-badge">{cat.count}</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Unified Item List in Row-Wise Grid (No Horizontal Scroll) */}
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
        ) : filteredItems.length > 0 ? (
          <div className="dishes-grid">
            {filteredItems.map((dish) => renderDishCard(dish))}
          </div>
        ) : allCombinedItems.length > 0 ? (
          <div className="menu-filter-empty-state">
            <div className="filter-empty-icon-wrap">
              <RestaurantMenuIcon />
            </div>
            <h3>{translations.nomatchingitems}</h3>
            <p>{translations.tryadjustingfilters}</p>
            {isFilterActive && (
              <button
                type="button"
                className="reset-filter-btn"
                onClick={handleClearFilters}
              >
                {translations.resetfilters}
              </button>
            )}
          </div>
        ) : (
          <div className="no-dishes-state">
            <RestaurantMenuIcon className="no-dishes-icon" />
            <h4>{translations.nodishesfound}</h4>
          </div>
        )}
      </div>

      {/* Interactive Item & Bundle Detail Modal */}
      {selectedItemModal && (
        <div className="dish-modal-overlay" onClick={() => setSelectedItemModal(null)}>
          <div className="dish-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dish-modal-close-btn"
              onClick={() => setSelectedItemModal(null)}
              aria-label={translations.close}
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
                    {selectedItemModal.categoryname && (
                      <span className="tag-badge">{selectedItemModal.categoryname}</span>
                    )}
                    {selectedItemModal.menuname && (
                      <span className="tag-badge">{selectedItemModal.menuname}</span>
                    )}
                    {selectedItemModal.preparationtime && Number(selectedItemModal.preparationtime) > 0 && (
                      <span className="tag-badge">⏱ {selectedItemModal.preparationtime} {translations.min}</span>
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

              {/* Addons List (non-selectable for combo and bundle deals) */}
              {selectedItemModal.addons && selectedItemModal.addons.length > 0 && (() => {
                const isComboItem =
                  selectedItemModal.bundletype === "combo" ||
                  selectedItemModal.bundletype === "unlimited" ||
                  selectedItemModal.isDeal;

                return (
                  <div className="dish-modal-addons-box">
                    <h5>
                      {isComboItem
                        ? (translations.addons || "Add-ons")
                        : translations.customizableaddons}
                    </h5>
                    <div className="addons-list">
                      {selectedItemModal.addons.map((addon) => {
                        const addonKey = addon.addonid || addon._id;

                        if (isComboItem) {
                          return (
                            <div
                              key={addonKey}
                              className="addon-item-row not-selectable"
                            >
                              <div className="addon-check-label">
                                <span>• {addon.addonname}</span>
                              </div>
                              <span className="addon-price">
                                +{formatPriceFromBranch(addon.price, selectedBranch)}
                              </span>
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
                              <span>{addon.addonname}</span>
                            </div>
                            <span className="addon-price">
                              +{formatPriceFromBranch(addon.price, selectedBranch)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Items included in Deals/Bundles */}
              {selectedItemModal.isDeal && selectedItemModal.items && selectedItemModal.items.length > 0 && (
                <div className="dish-modal-addons-box">
                  <h5>{translations.includeditems}</h5>
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

              {/* Modal Footer with Quantity Counter */}
              {!(selectedItemModal.bundletype === "combo" || selectedItemModal.bundletype === "unlimited" || selectedItemModal.isDeal) && (
                <div className="dish-modal-footer">
                  <div className="quantity-counter">
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    >
                      -
                    </button>
                    <span>{modalQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => q + 1)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="confirm-add-btn"
                    onClick={handleConfirmModalAdd}
                  >
                    {translations.addtocart} • {formatPriceFromBranch(selectedItemGrandTotal, selectedBranch)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Add-on Selection Popup Modal */}
      {addonModalItem && (
        <div
          className="dish-modal-overlay addon-modal-overlay"
          onClick={() => setAddonModalItem(null)}
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
                  {addonModalItem.hasDiet && (addonModalItem.isVeg || addonModalItem.isNonVeg) && (
                    <DietIndicator isVeg={addonModalItem.isVeg} className="addon-header-diet" />
                  )}
                  <h3 id="addon-modal-item-title" className="addon-modal-item-title">
                    {addonModalItem.title}
                  </h3>
                </div>
                <div className="addon-modal-price-meta">
                  <span className="addon-base-price">
                    {formatPriceFromBranch(addonModalItem.price, selectedBranch)}
                  </span>
                  {addonModalItem.preparationtime && Number(addonModalItem.preparationtime) > 0 && (
                    <span className="addon-prep-time">
                      <AccessTimeIcon fontSize="inherit" /> {addonModalItem.preparationtime} {translations.min}
                    </span>
                  )}
                </div>
              </div>

              {addonModalItem.image && (
                <div className="addon-modal-thumb-box">
                  <img
                    src={addonModalItem.image}
                    alt={addonModalItem.title}
                    className="addon-modal-thumb"
                  />
                </div>
              )}

              <button
                type="button"
                className="addon-modal-close-btn"
                onClick={() => setAddonModalItem(null)}
                aria-label={translations.close}
              >
                <CloseIcon />
              </button>
            </div>

            {/* Description if present */}
            {addonModalItem.desc && (
              <p className="addon-modal-desc">{addonModalItem.desc}</p>
            )}

            {/* Add-ons Selection Section */}
            <div className="addon-selection-section">
              <div className="addon-section-title-wrap">
                <h4 className="addon-section-title">
                  {translations.customizableaddons}
                </h4>
                <span className="addon-section-subtitle">
                  {translations.selectanyaddons}
                </span>
              </div>

              <div className="addon-options-list">
                {addonModalItem.addons.map((addon) => {
                  const addonKey = addon.addonid || addon._id;
                  const isChecked = selectedAddonIds.includes(addonKey);
                  return (
                    <label
                      key={addonKey}
                      className={`addon-option-item ${isChecked ? "is-selected" : ""}`}
                    >
                      <div className="addon-option-left">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddon(addonKey)}
                          className="addon-option-checkbox"
                        />
                        <span className="addon-option-name">{addon.addonname}</span>
                      </div>
                      <span className="addon-option-price">
                        +{formatPriceFromBranch(addon.price, selectedBranch)}
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
                  aria-label={translations.decreasequantity}
                >
                  -
                </button>
                <span className="addon-qty-val">{addonQuantity}</span>
                <button
                  type="button"
                  onClick={() => setAddonQuantity((q) => q + 1)}
                  aria-label={translations.increasequantity}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="addon-add-cart-btn"
                onClick={handleConfirmAddonModal}
              >
                <span>{translations.addtocart}</span>
                <span className="addon-btn-separator">•</span>
                <span className="addon-total-price">
                  {formatPriceFromBranch(addonModalGrandTotal, selectedBranch)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;