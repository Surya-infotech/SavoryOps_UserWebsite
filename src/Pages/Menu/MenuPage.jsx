import { useState, useEffect, useMemo, useCallback } from "react";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import "../../Scss/Pages/Menu/menupage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge using pure CSS (No SVG)
 */
export const DietIndicator = ({ isVeg, className = "" }) => {
  const { translations = {} } = useLanguage();

  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? (translations.purevegetarian || "Veg") : (translations.nonvegetarian || "Non-Veg")}
      aria-label={isVeg ? (translations.purevegetarian || "Veg") : (translations.nonvegetarian || "Non-Veg")}
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
  const [selectedItemModal, setSelectedItemModal] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Raw API data from owner database
  const [rawCategories, setRawCategories] = useState([]);
  const [rawDealsBundles, setRawDealsBundles] = useState([]);
  const [branchCurrencySymbol, setBranchCurrencySymbol] = useState("");

  useEffect(() => {
    if (businessDisplayName) {
      document.title = `${translations.menu || "Menu"} | ${businessDisplayName}`;
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
      if (e?.detail?._id) {
        fetchMenuData(e.detail._id);
      } else {
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
            ? (translations.combomeals || "Combo")
            : bundleTypeLower === "unlimited"
              ? (translations.unlimitedmeals || "Unlimited")
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
  const [selectedMenu, setSelectedMenu] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    if (comboMeals.length > 0) {
      list.push({
        id: "combo",
        name: translations.combomeals || "Combos",
        count: comboMeals.length,
      });
    }
    if (unlimitedMeals.length > 0) {
      list.push({
        id: "unlimited",
        name: translations.unlimitedmeals || "Unlimited",
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
  };

  const handleConfirmModalAdd = () => {
    if (selectedItemModal) {
      setAddedItems((prev) => ({
        ...prev,
        [selectedItemModal.id]: modalQuantity,
      }));
      setSelectedItemModal(null);
    }
  };

  // Reusable card renderer
  const renderDishCard = (dish) => {
    const count = addedItems[dish.id] || 0;
    const priceFormatted = `${dish.currencysymbol || ""}${dish.price != null ? Number(dish.price).toFixed(2) : ""}`;
    const isCombo = dish.isDeal && dish.bundletype === "combo";
    const isUnlimited = dish.isDeal && dish.bundletype === "unlimited";

    return (
      <div
        key={dish.id}
        className={`dish-card ${dish.isDeal ? "deal-card" : ""} ${isCombo ? "combo-card" : ""} ${isUnlimited ? "unlimited-card" : ""}`}
        onClick={() => handleCardClick(dish)}
      >
        <div className="dish-img-box">
          {dish.image ? (
            <img
              src={dish.image}
              alt={dish.title}
              className="dish-img"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <RestaurantMenuIcon className="dish-no-img-icon" />
          )}

          {dish.isDeal ? (
            dish.bundletype ? (
              <span className={`deal-ribbon-badge ${dish.bundletype}`}>
                {dish.bundletype === "combo" ? (translations.combo || "COMBO") : (translations.unlimited || "UNLIMITED")}
              </span>
            ) : null
          ) : (
            dish.categoryname && <span className="dish-tag-badge">{dish.categoryname}</span>
          )}

          {dish.preparationtime && Number(dish.preparationtime) > 0 && (
            <span className="dish-prep-time">
              <AccessTimeIcon fontSize="inherit" />
              {dish.preparationtime} min
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
                🍽️ {dish.items.length} {dish.items.length === 1 ? (translations.itemincluded || "item included") : (translations.itemsincluded || "items included")}
              </span>
            </div>
          )}

          <div className="dish-footer-row">
            <div className="dish-price-group">
              <span className="dish-price">{priceFormatted}</span>
            </div>

            {!isCombo && !isUnlimited && (
              <button
                type="button"
                className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                onClick={(e) => handleAddToCart(e, dish)}
                aria-label={translations.addtocart || "Add"}
                title={count > 0 ? `${translations.added || "Added"} (${count})` : (translations.addtocart || "Add")}
              >
                {count > 0 ? <CheckCircleIcon fontSize="small" /> : <AddIcon fontSize="small" />}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="menu-page-wrapper">
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs currentPage={translations.menu || "Menu"} />

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
                      placeholder={translations.allmenus || "All Menus"}
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
                    <span>{translations.purevegetarian || "Veg"}</span>
                  </button>
                  <button
                    type="button"
                    className={`diet-segment-btn diet-nonveg ${selectedDiet === "nonveg" ? "active" : ""}`}
                    onClick={() => setSelectedDiet("nonveg")}
                  >
                    <span className="diet-box">
                      <span className="diet-dot" />
                    </span>
                    <span>{translations.nonvegetarian || "Non-Veg"}</span>
                  </button>
                </div>
              </div>

              {/* Filter Count & Reset Action */}
              <div className="filter-actions-wrap">
                <span className="filter-results-badge">
                  {filteredItems.length}{" "}
                  {filteredItems.length === 1
                    ? (translations.dish || "item")
                    : (translations.dishes || "items")}
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
                  <span>{translations.allcategories || "All Categories"}</span>
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
            <h3>{translations.nomatchingitems || "No dishes found"}</h3>
            <p>{translations.tryadjustingfilters || "Try adjusting your menu, category, or diet filters to see more dishes."}</p>
            {isFilterActive && (
              <button
                type="button"
                className="reset-filter-btn"
                onClick={handleClearFilters}
              >
                {translations.resetfilters || "Reset All Filters"}
              </button>
            )}
          </div>
        ) : (
          <div className="no-dishes-state">
            <RestaurantMenuIcon className="no-dishes-icon" />
            <h4>{translations.nodishesfound || "No dishes found"}</h4>
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
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </button>

            {selectedItemModal.image ? (
              <div className="dish-modal-hero">
                <img
                  src={selectedItemModal.image}
                  alt={selectedItemModal.title}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                {selectedItemModal.hasDiet && (selectedItemModal.isVeg || selectedItemModal.isNonVeg) && (
                  <DietIndicator isVeg={selectedItemModal.isVeg} className="dish-modal-diet-badge" />
                )}
              </div>
            ) : (
              selectedItemModal.hasDiet && (selectedItemModal.isVeg || selectedItemModal.isNonVeg) && (
                <div className="dish-modal-no-img-diet">
                  <DietIndicator isVeg={selectedItemModal.isVeg} className="dish-modal-diet-badge" />
                </div>
              )
            )}

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
                      <span className="tag-badge">⏱ {selectedItemModal.preparationtime} mins</span>
                    )}
                  </div>
                </div>

                <span className="dish-modal-price">
                  {selectedItemModal.currencysymbol || ""}
                  {selectedItemModal.price != null ? Number(selectedItemModal.price).toFixed(2) : ""}
                </span>
              </div>

              {selectedItemModal.desc && (
                <p className="dish-modal-desc">{selectedItemModal.desc}</p>
              )}

              {/* Addons List */}
              {selectedItemModal.addons && selectedItemModal.addons.length > 0 && (
                <div className="dish-modal-addons-box">
                  <h5>{translations.addons || "Addons"}</h5>
                  <div className="addons-list">
                    {selectedItemModal.addons.map((addon) => (
                      <div key={addon.addonid || addon._id} className="addon-item-row">
                        <span>{addon.addonname}</span>
                        <span className="addon-price">
                          +{addon.currencysymbol || selectedItemModal.currencysymbol || ""}
                          {Number(addon.price || 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items included in Deals/Bundles */}
              {selectedItemModal.isDeal && selectedItemModal.items && selectedItemModal.items.length > 0 && (
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
                    {translations.addtocart || "Add to Cart"} • {selectedItemModal.currencysymbol || ""}
                    {(Number(selectedItemModal.price || 0) * modalQuantity).toFixed(2)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuPage;