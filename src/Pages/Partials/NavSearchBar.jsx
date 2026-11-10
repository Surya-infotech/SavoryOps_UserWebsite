import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import { useLanguage } from "../../Context/useLanguage.js";
import { getWebsiteSubdomain } from "./UnderMaintenance.jsx";
import DishDetailModal from "../../Components/Common/DishDetailModal.jsx";
import { getItemQuantitiesMap } from "../../utils/cartService.js";
import { getActiveBranch } from "../../utils/formatCurrency.js";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

// Module-level cache so we never re-fetch menu items for the same branch
const dishesCache = new Map();

const NavSearchBar = ({ branch, branchId }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { translations = {} } = useLanguage();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dishes, setDishes] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedDishModal, setSelectedDishModal] = useState(null);
  const [cartCounts, setCartCounts] = useState(getItemQuantitiesMap);
  const [posPayload, setPosPayload] = useState(() => {
    return typeof window !== "undefined" ? window.__branchSetting : null;
  });

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  // Sync cart counts and branch settings dynamically
  useEffect(() => {
    const handleCartUpdated = () => setCartCounts(getItemQuantitiesMap());
    const handleBranchSettingChange = (e) => {
      if (e?.detail) setPosPayload(e.detail);
    };

    window.addEventListener("cartUpdated", handleCartUpdated);
    window.addEventListener("branchSettingChange", handleBranchSettingChange);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdated);
      window.removeEventListener("branchSettingChange", handleBranchSettingChange);
    };
  }, []);

  // Sync dishes when branchId changes or component mounts
  const loadDishes = useCallback(async (bId) => {
    if (!bId) return;

    if (dishesCache.has(String(bId))) {
      setDishes(dishesCache.get(String(bId)));
      return;
    }

    const currentSubdomain = getWebsiteSubdomain();
    if (!currentSubdomain) return;

    setLoading(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Menu/GetItemcategory/${bId}`,
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
        setDishes([]);
        return;
      }

      const data = await response.json();
      if (data.branchSetting && typeof window !== "undefined") {
        window.__branchSetting = data.branchSetting;
        setPosPayload(data.branchSetting);
      }

      const categories = Array.isArray(data.itemCategories) ? data.itemCategories : [];

      const list = [];
      categories.forEach((cat) => {
        (cat.menuGroups || []).forEach((mg) => {
          const menuDetails = mg.menuDetails || {};
          (mg.itemDetails || []).forEach((item) => {
            const rawType = (item.itemtype || item.itemType || "").trim().toLowerCase();
            const isNonVeg = rawType.includes("non") || rawType.includes("egg");
            const isVeg = !isNonVeg && (rawType.includes("veg") || rawType === "vegan");
            const rawPrice = Number(item.rawPrice ?? item.price ?? 0);

            list.push({
              ...item,
              id: String(item.itemid),
              itemid: item.itemid,
              categoryid: cat.itemcategoryid,
              categoryname: cat.itemcategoryname || "",
              categoryName: cat.itemcategoryname || "",
              menuid: menuDetails.menuid,
              menuname: menuDetails.menuname || "",
              menuName: menuDetails.menuname || "",
              title: item.itemname || item.title || "",
              name: item.itemname || item.title || "",
              desc: item.description || item.desc || "",
              description: item.description || item.desc || "",
              price: rawPrice,
              rawPrice: rawPrice,
              taxes: item.taxes || [],
              currencysymbol: item.currencysymbol || "",
              currencySymbol: item.currencysymbol || "",
              image: item.imageUrl || item.image || "",
              imageUrl: item.imageUrl || item.image || "",
              hasDiet: isVeg || isNonVeg,
              isVeg,
              isNonVeg,
              itemtype: item.itemtype || (isVeg ? "Veg" : isNonVeg ? "Non-Veg" : ""),
              preparationtime: item.preparationtime,
              addons: item.addons || [],
              isDeal: false,
            });
          });
        });
      });

      dishesCache.set(String(bId), list);
      setDishes(list);
    } catch (err) {
      console.error("Error loading dishes for search:", err);
      setDishes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (branchId) {
      loadDishes(branchId);
    }
  }, [branchId, loadDishes]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter matching dishes
  const matchingDishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return dishes.filter((d) => {
      const matchName = (d.title || d.name || "").toLowerCase().includes(q);
      const matchDesc = (d.desc || d.description || "").toLowerCase().includes(q);
      const matchCat = (d.categoryName || d.categoryname || "").toLowerCase().includes(q);
      const matchMenu = (d.menuName || d.menuname || "").toLowerCase().includes(q);
      return matchName || matchDesc || matchCat || matchMenu;
    });
  }, [dishes, query]);

  // Display top 6 matches in dropdown
  const topMatches = useMemo(() => {
    return matchingDishes.slice(0, 6);
  }, [matchingDishes]);

  // Reset selected index when query or matches change
  useEffect(() => {
    setSelectedIndex(-1);
  }, [query]);

  // When route changes, close dropdown
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname, location.search]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);
    // If dishes aren't loaded yet, try to load
    if (dishes.length === 0 && branchId) {
      loadDishes(branchId);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery("");
    setIsOpen(false);
    inputRef.current?.focus();
  };

  // Open the Item Details Popup Modal (same as other pages)
  const handleSelectDish = (dish) => {
    setSelectedDishModal(dish);
    setIsOpen(false);
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (selectedIndex >= 0 && selectedIndex < topMatches.length) {
      handleSelectDish(topMatches[selectedIndex]);
      return;
    }
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/menu?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || topMatches.length === 0) {
      if (e.key === "Enter") {
        handleSubmit(e);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < topMatches.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : topMatches.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectedOrderType =
    typeof window !== "undefined"
      ? localStorage.getItem("selectedOrderType") || "delivery"
      : "delivery";

  const effectiveBranch = branch || getActiveBranch();

  return (
    <>
      <div className="nav-search-wrapper" ref={wrapperRef}>
        <form className="nav-search-box" onSubmit={handleSubmit} autoComplete="off">
          <SearchIcon className="nav-search-icon" />
          <input
            ref={inputRef}
            type="text"
            className="nav-search-input"
            placeholder={translations.searchdishes || "Search dishes, food..."}
            value={query}
            onChange={handleInputChange}
            onFocus={() => {
              if (query.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label={translations.searchdishes || "Search dishes"}
          />
          {query && (
            <button
              type="button"
              className="nav-search-clear-btn"
              onClick={handleClear}
              title={translations.clearsearch || "Clear"}
              aria-label="Clear search input"
            >
              <CloseIcon fontSize="inherit" />
            </button>
          )}
        </form>

        {/* Floating Results Popover Dropdown */}
        {isOpen && query.trim().length > 0 && (
          <div className="nav-search-dropdown" role="listbox">
            {loading ? (
              <div className="nav-search-dropdown-loading">
                <span className="search-spin-dot" />
                <span>{translations.loading || "Searching dishes..."}</span>
              </div>
            ) : topMatches.length > 0 ? (
              <>
                <div className="nav-search-dropdown-header">
                  <span className="dropdown-results-count">
                    {matchingDishes.length} {matchingDishes.length === 1 ? "dish found" : "dishes found"}
                  </span>
                  <span className="dropdown-hint">Click item to view details</span>
                </div>

                <div className="nav-search-items-list">
                  {topMatches.map((dish, idx) => {
                    const isHighlighted = selectedIndex === idx;
                    return (
                      <div
                        key={dish.id || idx}
                        className={`nav-search-item ${isHighlighted ? "highlighted" : ""}`}
                        onClick={() => handleSelectDish(dish)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        role="option"
                        aria-selected={isHighlighted}
                        tabIndex={0}
                      >
                        <div className="nav-search-item-thumb">
                          {dish.imageUrl || dish.image ? (
                            <img
                              src={dish.imageUrl || dish.image}
                              alt={dish.name || dish.title}
                              onError={(e) => {
                                e.target.style.display = "none";
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div
                            className="nav-search-fallback-icon"
                            style={{ display: dish.imageUrl || dish.image ? "none" : "flex" }}
                          >
                            <RestaurantMenuIcon fontSize="small" />
                          </div>
                        </div>

                        <div className="nav-search-item-info">
                          <div className="nav-search-item-title-row">
                            {dish.isVeg && <span className="diet-dot-veg" title="Veg" />}
                            {dish.isNonVeg && <span className="diet-dot-nonveg" title="Non-Veg" />}
                            <span className="nav-search-item-name">{dish.title || dish.name}</span>
                          </div>
                          {(dish.categoryName || dish.categoryname) && (
                            <span className="nav-search-item-cat">
                              {dish.categoryName || dish.categoryname}
                            </span>
                          )}
                        </div>

                        <div className="nav-search-item-price">
                          {dish.currencySymbol || dish.currencysymbol}
                          {Number(dish.price).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="nav-search-dropdown-empty">
                <div className="search-empty-icon-wrap">
                  <SearchOffIcon className="search-empty-icon" />
                </div>
                <p className="search-empty-title">
                  {translations.nosearchresultsfound || "No dishes found"}
                </p>
                <p className="search-empty-sub">
                  No items matching &ldquo;{query}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Centralized Full Dish Details Popup Modal (same as other pages) */}
      {typeof document !== "undefined" &&
        selectedDishModal &&
        createPortal(
          <DishDetailModal
            item={selectedDishModal}
            onClose={() => setSelectedDishModal(null)}
            selectedBranch={effectiveBranch}
            posPayload={posPayload}
            branchSetting={posPayload}
            selectedOrderType={selectedOrderType}
            initialQuantity={cartCounts[selectedDishModal.id] || 1}
          />,
          document.body
        )}
    </>
  );
};

export default NavSearchBar;