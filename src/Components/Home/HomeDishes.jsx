import { useState, useEffect, useMemo, useCallback } from "react";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import { useLanguage } from "../../Context/useLanguage.js";
import { getWebsiteSubdomain } from "../../Pages/Partials/UnderMaintenance.jsx";
import "../../Scss/Components/Home/homedishes.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge
 */
export const DietIndicator = ({ isVeg, className = "" }) => {
  const { translations = {} } = useLanguage();

  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? (translations.purevegetarian || "Veg") : (translations.nonvegetarian || "Non-Veg")}
      aria-label={isVeg ? (translations.purevegetarian || "Veg") : (translations.nonvegetarian || "Non-Veg")}
    >
      {isVeg ? (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="diet-svg"
        >
          <rect x="1" y="1" width="14" height="14" rx="3" stroke="#2e7d32" strokeWidth="1.8" fill="#ffffff" />
          <circle cx="8" cy="8" r="3.75" fill="#2e7d32" />
        </svg>
      ) : (
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="diet-svg"
        >
          <rect x="1" y="1" width="14" height="14" rx="3" stroke="#c62828" strokeWidth="1.8" fill="#ffffff" />
          <circle cx="8" cy="8" r="3.75" fill="#c62828" />
        </svg>
      )}
    </span>
  );
};

const HomeDishes = () => {
  const { translations = {} } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMenu, setSelectedMenu] = useState("all");
  const [addedItems, setAddedItems] = useState({});
  const [selectedItemModal, setSelectedItemModal] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Raw API data from owner database
  const [rawCategories, setRawCategories] = useState([]);
  const [rawDealsBundles, setRawDealsBundles] = useState([]);
  const [branchCurrencySymbol, setBranchCurrencySymbol] = useState("");

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
      const response = await fetch(`${adminPanelBackendPath}/Website/Home/GetItemcategory/${branchId}`, {
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

  // Extract all flat items across all categories and menu groups without any default data
  const allDishes = useMemo(() => {
    const list = [];
    rawCategories.forEach((cat) => {
      (cat.menuGroups || []).forEach((mg) => {
        const menuDetails = mg.menuDetails || {};
        (mg.itemDetails || []).forEach((item) => {
          const rawItemType = (item.itemtype || "").trim().toLowerCase();
          const hasDiet = Boolean(rawItemType);
          const isVeg = hasDiet && rawItemType === "veg";
          const isNonVeg = hasDiet && rawItemType.includes("non");

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
          });
        });
      });
    });
    return list;
  }, [rawCategories, branchCurrencySymbol]);

  // Extract unique menus for sub-filter
  const uniqueMenus = useMemo(() => {
    const map = new Map();
    allDishes.forEach((d) => {
      if (d.menuid && d.menuname) {
        map.set(d.menuid, d.menuname);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [allDishes]);

  const formattedDeals = useMemo(() => {
    return rawDealsBundles.map((b) => {
      const rawItemType = (b.itemtype || "").trim().toLowerCase();
      const hasDiet = Boolean(rawItemType);
      const isVeg = hasDiet && rawItemType === "veg";
      const isNonVeg = hasDiet && rawItemType.includes("non");
      const bundleTypeLower = (b.bundletype || "").toLowerCase();

      return {
        id: `deal-${b.dealsbundlesid}`,
        dealsbundlesid: b.dealsbundlesid,
        categoryid: "deals",
        categoryname: bundleTypeLower === "combo" ? (translations.combomeals || "Combo") : bundleTypeLower === "unlimited" ? (translations.unlimitedmeals || "Unlimited") : "",
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
      };
    });
  }, [rawDealsBundles, branchCurrencySymbol, translations]);

  // Dynamic category pills strictly from backend
  const categories = useMemo(() => {
    const tabs = [
      {
        id: "all",
        label: translations.all || "All",
        image: null,
        count: allDishes.length + formattedDeals.length,
      },
    ];

    rawCategories.forEach((cat) => {
      let count = 0;
      (cat.menuGroups || []).forEach((mg) => {
        count += (mg.itemDetails || []).length;
      });
      tabs.push({
        id: String(cat.itemcategoryid),
        label: cat.itemcategoryname || "",
        image: cat.imageUrl || null,
        count,
      });
    });

    if (formattedDeals.length > 0) {
      const comboCount = formattedDeals.filter((d) => d.bundletype === "combo").length;
      const unlimitedCount = formattedDeals.filter((d) => d.bundletype === "unlimited").length;

      if (comboCount > 0) {
        tabs.push({
          id: "combos",
          label: translations.combomeals || "Combos",
          image: null,
          count: comboCount,
        });
      }
      if (unlimitedCount > 0) {
        tabs.push({
          id: "unlimited",
          label: translations.unlimitedmeals || "Unlimited",
          image: null,
          count: unlimitedCount,
        });
      }
    }

    return tabs;
  }, [allDishes.length, formattedDeals, rawCategories, translations]);

  // Filtered dishes and deals based on active tabs
  const displayedItems = useMemo(() => {
    let items = [];

    if (selectedCategory === "all") {
      items = [...formattedDeals, ...allDishes];
    } else if (selectedCategory === "combos") {
      items = formattedDeals.filter((d) => d.bundletype === "combo");
    } else if (selectedCategory === "unlimited") {
      items = formattedDeals.filter((d) => d.bundletype === "unlimited");
    } else {
      items = allDishes.filter((d) => String(d.categoryid) === String(selectedCategory));
    }

    // Apply menu sub-filter if selected
    if (selectedMenu !== "all") {
      items = items.filter((it) => it.isDeal || String(it.menuid) === String(selectedMenu));
    }

    return items;
  }, [selectedCategory, selectedMenu, formattedDeals, allDishes]);

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

  // If loading is finished and there are zero dishes or categories in the owner database, do not render section
  if (!loading && allDishes.length === 0 && formattedDeals.length === 0) {
    return null;
  }

  return (
    <section className="dishes-showcase-section">
      {/* Section Header */}
      <div className="section-header-block">
        <h2 className="section-main-title">{translations.menu || "Menu"}</h2>
      </div>

      {/* Dynamic Category Tabs */}
      {!loading && categories.length > 1 && (
        <div className="category-tabs-row">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-tab-btn ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedMenu("all");
              }}
            >
              {cat.image && (
                <img src={cat.image} alt={cat.label} className="category-tab-icon-img" />
              )}
              <span>{cat.label}</span>
              {cat.count > 0 && <span className="category-count-badge">{cat.count}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Menu Sub-filters (if multiple menus exist in this branch) */}
      {!loading && uniqueMenus.length > 1 && selectedCategory === "all" && (
        <div className="menu-subfilters-row">
          <button
            type="button"
            className={`menu-chip ${selectedMenu === "all" ? "active" : ""}`}
            onClick={() => setSelectedMenu("all")}
          >
            {translations.allmenus || "All Menus"}
          </button>
          {uniqueMenus.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`menu-chip ${selectedMenu === m.id ? "active" : ""}`}
              onClick={() => setSelectedMenu(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>
      )}

      {/* Dishes & Deals Grid */}
      {loading ? (
        <div className="dishes-grid">
          {[1, 2, 3, 4].map((n) => (
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
      ) : displayedItems.length > 0 ? (
        <div className="dishes-grid">
          {displayedItems.map((dish) => {
            const count = addedItems[dish.id] || 0;
            const priceFormatted = `${dish.currencysymbol || ""}${dish.price != null ? Number(dish.price).toFixed(2) : ""}`;

            return (
              <div
                key={dish.id}
                className={`dish-card ${dish.isDeal ? "deal-card" : ""}`}
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
                      <span className="deal-ribbon-badge">
                        {dish.bundletype.toUpperCase()}
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

                  <div className="dish-footer-row">
                    <div className="dish-price-group">
                      <span className="dish-price">{priceFormatted}</span>
                    </div>

                    <button
                      type="button"
                      className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                      onClick={(e) => handleAddToCart(e, dish)}
                      aria-label={translations.addtocart || "Add"}
                      title={count > 0 ? `${translations.added || "Added"} (${count})` : (translations.addtocart || "Add")}
                    >
                      {count > 0 ? <CheckCircleIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

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

            {selectedItemModal.image && (
              <div className="dish-modal-hero">
                <img
                  src={selectedItemModal.image}
                  alt={selectedItemModal.title}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                {selectedItemModal.hasDiet && (selectedItemModal.isVeg || selectedItemModal.isNonVeg) && (
                  <DietIndicator isVeg={selectedItemModal.isVeg} />
                )}
              </div>
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
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeDishes;
