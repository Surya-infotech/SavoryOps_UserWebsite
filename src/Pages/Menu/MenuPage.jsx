import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import CloseIcon from "@mui/icons-material/Close";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import DishCard, { DishDetailModal, DishAddonModal } from "../../Components/Common/DishCard.jsx";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import { getActiveBranch } from "../../utils/formatCurrency.js";
import { addItemToCart, getItemQuantitiesMap } from "../../utils/cartService.js";
import { calculateItemPrice } from "../../utils/priceCalculator.js";
import "../../Scss/Pages/Menu/menupage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;


const MenuPage = () => {
  const { translations = {} } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  const [loading, setLoading] = useState(true);
  const [addedItems, setAddedItems] = useState(getItemQuantitiesMap);

  // Raw API data from owner database
  const [rawCategories, setRawCategories] = useState([]);
  const [branchCurrencySymbol, setBranchCurrencySymbol] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(getActiveBranch);
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType");
  });
  const [posPayload, setPosPayload] = useState(() => {
    return typeof window !== "undefined" ? window.__branchSetting : null;
  });

  useEffect(() => {
    const handleCartUpdated = () => {
      setAddedItems(getItemQuantitiesMap());
    };
    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, []);

  useEffect(() => {
    if (businessDisplayName) {
      document.title = `${translations.menu} | ${businessDisplayName}`;
    }
  }, [businessDisplayName, translations]);

  const lastBranchIdRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Fetch Menu, Category, Item, and Deal data from website endpoint
  const fetchMenuData = useCallback(async (branchIdParam, force = false) => {
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
        return;
      }

      const data = await response.json();
      const categories = Array.isArray(data.itemCategories) ? data.itemCategories : [];

      setRawCategories(categories);
      setPosPayload(data.branchSetting || data);
      if (data.branchSetting && typeof window !== "undefined") {
        window.__branchSetting = data.branchSetting;
      }

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
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Listen for branch selection changes across the website
  useEffect(() => {
    fetchMenuData();

    const handleBranchChange = (e) => {
      const newBranch = e?.detail;
      const newBranchId = newBranch?._id || newBranch?.branchid;

      if (newBranch) {
        setSelectedBranch(newBranch);
      }

      // Only refetch if the branch is genuinely different from what was already fetched
      if (newBranchId && String(newBranchId) !== String(lastBranchIdRef.current)) {
        fetchMenuData(newBranchId, true);
      }
    };

    const handleOrderTypeChange = (e) => {
      const ot = e?.detail?.orderType;
      if (ot) {
        setSelectedOrderType(ot);
      }
    };
    const handleBranchSettingChange = (e) => {
      if (e?.detail) {
        setPosPayload(e.detail);
      }
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

    // Request current branch and branch setting from Navbar
    window.dispatchEvent(new CustomEvent("requestBranch"));
    window.dispatchEvent(new CustomEvent("requestBranchSetting"));

    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
      window.removeEventListener("orderTypeChange", handleOrderTypeChange);
      window.removeEventListener("branchSettingChange", handleBranchSettingChange);
      window.removeEventListener("storage", handleStorage);
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

          const rawPrice = Number(item.rawPrice ?? item.price ?? 0);
          const effectivePrice = calculateItemPrice(
            {
              ...item,
              price: rawPrice,
              rawPrice: rawPrice,
              taxes: item.taxes || [],
            },
            posPayload,
            selectedOrderType
          );

          list.push({
            id: String(item.itemid),
            itemid: item.itemid,
            categoryid: cat.itemcategoryid,
            categoryname: cat.itemcategoryname || "",
            menuid: menuDetails.menuid,
            menuname: menuDetails.menuname || "",
            title: item.itemname || "",
            desc: item.description || "",
            price: effectivePrice,
            rawPrice: rawPrice,
            taxes: item.taxes || [],
            currency: item.currency || "",
            currencysymbol: item.currencysymbol || branchCurrencySymbol || "",
            image: item.imageUrl || "",
            hasDiet,
            isVeg,
            isNonVeg,
            itemtype: item.itemtype || (isVeg ? "Veg" : isNonVeg ? "Non-Veg" : ""),
            preparationtime: item.preparationtime,
            addons: item.addons || [],
            isDeal: false,
            filterType: String(cat.itemcategoryid),
          });
        });
      });
    });
    return list;
  }, [rawCategories, branchCurrencySymbol, posPayload, selectedOrderType]);


  // Unified list of standard dishes (combos and unlimited moved to Offers page)
  const allCombinedItems = useMemo(() => {
    return allDishes;
  }, [allDishes]);

  // Filter States: Menu, Item Category, Veg / Non-Veg
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [selectedMenu, setSelectedMenu] = useState(() => {
    return (
      location.state?.selectedMenuId ||
      location.state?.menuId ||
      searchParams.get("menu") ||
      "all"
    );
  });
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("category") || "all");
  const [selectedDiet, setSelectedDiet] = useState("all"); // "all" | "veg" | "nonveg"

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

  // Sync availableMenus globally for Footer and other components
  useEffect(() => {
    if (availableMenus.length > 0) {
      if (typeof window !== "undefined") {
        window.__availableMenus = availableMenus;
      }
      window.dispatchEvent(
        new CustomEvent("menusLoaded", { detail: availableMenus })
      );
    }
  }, [availableMenus]);

  useEffect(() => {
    const stateMenu = location.state?.selectedMenuId || location.state?.menuId;
    const m = searchParams.get("menu") || stateMenu;
    const c = searchParams.get("category");

    if (m) {
      if (m === "all") {
        setSelectedMenu("all");
      } else {
        const found = availableMenus.find(
          (item) =>
            String(item.id) === String(m) ||
            item.name.toLowerCase() === decodeURIComponent(String(m)).toLowerCase()
        );
        if (found) {
          setSelectedMenu(String(found.id));
        } else {
          setSelectedMenu(String(m));
        }
      }
      if (!c) {
        setSelectedCategory("all");
      }

      // Hide ?menu=... from the browser URL so it cleanly displays /menu
      if (searchParams.has("menu")) {
        const currentPath = window.location.pathname;
        const newParams = new URLSearchParams(window.location.search);
        newParams.delete("menu");
        const newSearch = newParams.toString() ? `?${newParams.toString()}` : "";
        window.history.replaceState(null, "", `${currentPath}${newSearch}`);
      }
    } else if (!stateMenu && location.state === null) {
      setSelectedMenu("all");
    }

    if (c) {
      setSelectedCategory(c);
    } else if (!m && location.state === null) {
      setSelectedCategory("all");
    }
  }, [searchParams, location.state, availableMenus]);

  // Options for custom Dropdown component
  const menuOptions = useMemo(() => {
    return [
      { id: "all", name: translations.allmenus || "All Menus" },
      ...availableMenus,
    ];
  }, [availableMenus, translations]);

  // Dynamically extract unique available Categories with item counts
  const availableCategories = useMemo(() => {
    const list = [];
    rawCategories.forEach((cat) => {
      const catId = String(cat.itemcategoryid);
      const matchingDishes = allDishes.filter((d) => {
        if (String(d.categoryid) !== catId) return false;
        if (selectedMenu !== "all" && String(d.menuid) !== String(selectedMenu)) return false;
        return true;
      });
      if (matchingDishes.length > 0) {
        list.push({
          id: catId,
          name: cat.itemcategoryname || "Category",
          count: matchingDishes.length,
        });
      }
    });
    return list;
  }, [rawCategories, allDishes, selectedMenu]);

  // Options for custom Category Dropdown component
  const categoryOptions = useMemo(() => {
    return [
      {
        id: "all",
        name: translations.allcategories || "All Categories",
      },
      ...availableCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
      })),
    ];
  }, [availableCategories, translations]);

  // Filter items based on selected Menu, Item Category, and Diet (Veg/Non-Veg)
  const filteredItems = useMemo(() => {
    return allCombinedItems.filter((item) => {
      // 1. Menu Filter
      if (selectedMenu !== "all") {
        if (String(item.menuid) !== String(selectedMenu)) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== "all") {
        if (String(item.categoryid) !== String(selectedCategory)) {
          return false;
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
  const [addonModalItem, setAddonModalItem] = useState(null);

  const handleOpenAddonModal = (e, dish) => {
    e.stopPropagation();
    setAddonModalItem(dish);
  };

  const handleCardClick = (item) => {
    setSelectedItemModal(item);
  };

  const handleAddToCart = (e, item) => {
    e.stopPropagation();
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

  // Centralized card renderer
  const renderDishCard = (dish) => {
    return (
      <DishCard
        key={dish.id}
        dish={dish}
        selectedBranch={selectedBranch}
        count={addedItems[dish.id] || 0}
        onCardClick={handleCardClick}
        onAddToCart={handleAddToCart}
        onOpenAddonModal={handleOpenAddonModal}
      />
    );
  };

  return (
    <div className="menu-page-wrapper">
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs currentPage={translations.menu} />

      <div className="menu-main-content-container">
        {/* --- Modern Interactive Filters (Ultra-Compact Single Row Bar) --- */}
        {!loading && allCombinedItems.length > 0 && (
          <div className="menu-filters-wrapper">
            <div className="menu-filter-bar">
              <div className="filter-controls-group">
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
                        onValueChange={(val) => {
                          setSelectedMenu(val || "all");
                          setSelectedCategory("all");
                        }}
                        placeholder={translations.allmenus || "All Menus"}
                        showSearch={true}
                        className="menu-page-dropdown"
                      />
                    </div>
                  </div>
                )}

                {/* 2. Category Filter Dropdown (Custom Searchable Dropdown with Counts) */}
                {availableCategories.length > 0 && (
                  <div className="filter-item-wrap category-dropdown-wrap">
                    <div className="menu-custom-dropdown-container category-select-dropdown">
                      <Dropdown
                        id="category-filter-dropdown"
                        options={categoryOptions}
                        labelKey="name"
                        valueKey="id"
                        selectedValue={selectedCategory}
                        onValueChange={(val) => setSelectedCategory(val || "all")}
                        placeholder={translations.allcategories || "All Categories"}
                        showSearch={true}
                        className="menu-page-dropdown"
                      />
                    </div>
                  </div>
                )}

                {/* Secondary Controls Group (Row 2 on mobile/tablet, inline on desktop) */}
                <div className="filter-controls-secondary">
                  {/* 3. Diet Filter (Veg / Non-Veg) Segmented Group */}
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

                  {/* Filter Reset Action */}
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
            </div>
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

      {/* Centralized Full Dish / Deal Details Modal */}
      <DishDetailModal
        item={selectedItemModal}
        onClose={() => setSelectedItemModal(null)}
        selectedBranch={selectedBranch}
        posPayload={posPayload}
        selectedOrderType={selectedOrderType}
        initialQuantity={selectedItemModal ? (addedItems[selectedItemModal.id] || 1) : 1}
      />

      {/* Centralized Quick Add-on Customization Popup Modal */}
      <DishAddonModal
        item={addonModalItem}
        onClose={() => setAddonModalItem(null)}
        selectedBranch={selectedBranch}
        posPayload={posPayload}
        selectedOrderType={selectedOrderType}
        initialQuantity={1}
      />
    </div>
  );
};

export default MenuPage;