import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
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

/**
 * Smooth horizontal scroll container with left and right navigation buttons
 */
const HorizontalScrollRow = ({ children, className = "" }) => {
  const rowRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(() =>
    Array.isArray(children) ? children.length > 3 : true
  );

  const checkScroll = useCallback(() => {
    const el = rowRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    const el = rowRef.current;
    if (!el) return;
    checkScroll();

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const timer = setTimeout(checkScroll, 250);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      clearTimeout(timer);
    };
  }, [checkScroll, children]);

  const handleScroll = (direction) => {
    const el = rowRef.current;
    if (!el) return;
    const firstCard = el.querySelector(".dish-card");
    let cardStep = 310;
    if (firstCard) {
      const nextCard = firstCard.nextElementSibling;
      const computedGap = nextCard
        ? nextCard.offsetLeft - (firstCard.offsetLeft + firstCard.offsetWidth)
        : 24;
      cardStep = firstCard.offsetWidth + Math.max(0, computedGap);
    }
    el.scrollBy({
      left: direction === "left" ? -cardStep : cardStep,
      behavior: "smooth",
    });
  };

  return (
    <div className={`horizontal-scroll-container ${className}`}>
      {hasOverflow && (
        <button
          type="button"
          className={`scroll-arrow-btn left ${!canScrollLeft ? "disabled" : ""}`}
          onClick={() => handleScroll("left")}
          aria-label="Scroll left"
          disabled={!canScrollLeft}
        >
          <ChevronLeftIcon />
        </button>
      )}

      <div className="horizontal-scroll-track" ref={rowRef}>
        {children}
      </div>

      {hasOverflow && (
        <button
          type="button"
          className={`scroll-arrow-btn right ${!canScrollRight ? "disabled" : ""}`}
          onClick={() => handleScroll("right")}
          aria-label="Scroll right"
          disabled={!canScrollRight}
        >
          <ChevronRightIcon />
        </button>
      )}
    </div>
  );
};

const HomeDishes = () => {
  const { translations = {} } = useLanguage();
  const [loading, setLoading] = useState(true);
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

  const comboMeals = useMemo(() => {
    return formattedDeals.filter((d) => d.bundletype === "combo");
  }, [formattedDeals]);

  const unlimitedMeals = useMemo(() => {
    return formattedDeals.filter((d) => d.bundletype === "unlimited");
  }, [formattedDeals]);

  // Group dishes by their Category
  const categorizedSections = useMemo(() => {
    return rawCategories
      .map((cat) => {
        const catId = String(cat.itemcategoryid);
        const dishes = allDishes.filter((d) => String(d.categoryid) === catId);

        return {
          id: catId,
          name: cat.itemcategoryname || "",
          image: cat.imageUrl || null,
          dishes,
        };
      })
      .filter((section) => section.dishes.length > 0);
  }, [rawCategories, allDishes]);

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

  // Reusable card renderer for dishes, combos, and unlimited meals
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

  // If loading is finished and there are zero dishes and zero deals in the owner database, do not render section
  if (!loading && allDishes.length === 0 && formattedDeals.length === 0) {
    return null;
  }

  return (
    <div className="dishes-showcase-container">
      {/* 1. Dedicated Combo Meals Section */}
      {comboMeals.length > 0 && (
        <section className="dishes-showcase-section combo-meals-section" id="combo-meals">
          <div className="section-header-block">
            <span className="section-pill-tag combo-tag">
              🍱 {translations.combopill || "Curated Combos"}
            </span>
            <h2 className="section-main-title">{translations.combomeals || "Combo Meals"}</h2>
            <p className="section-subtitle">
              {translations.combosubtitle || "Specially crafted value bundles and paired delights for the ultimate culinary feast."}
            </p>
          </div>

          <HorizontalScrollRow className="combo-scroll-row">
            {comboMeals.map((dish) => renderDishCard(dish))}
          </HorizontalScrollRow>
        </section>
      )}

      {/* 2. Dedicated Unlimited Meals Section */}
      {unlimitedMeals.length > 0 && (
        <section className="dishes-showcase-section unlimited-meals-section" id="unlimited-meals">
          <div className="section-header-block">
            <span className="section-pill-tag unlimited-tag">
              ♾️ {translations.unlimitedpill || "All You Can Eat"}
            </span>
            <h2 className="section-main-title">{translations.unlimitedmeals || "Unlimited Meals"}</h2>
            <p className="section-subtitle">
              {translations.unlimitedsubtitle || "Endless gourmet servings prepared fresh to order for complete dining indulgence."}
            </p>
          </div>

          <HorizontalScrollRow className="unlimited-scroll-row">
            {unlimitedMeals.map((dish) => renderDishCard(dish))}
          </HorizontalScrollRow>
        </section>
      )}

      {/* 3. Dedicated A La Carte Menu Section with Option 3 Grouped Categories & Sticky Quick Jump */}
      {(loading || allDishes.length > 0) && (
        <section className="dishes-showcase-section a-la-carte-section" id="menu">
          <div className="section-header-block">
            <span className="section-pill-tag">
              🍽️ {translations.culinarymenu || "A La Carte"}
            </span>
            <h2 className="section-main-title">{translations.menu || "Menu"}</h2>
            <p className="section-subtitle">
              {translations.menusubtitle || "Browse through our wide selection of artisan dishes made with farm-fresh ingredients."}
            </p>
          </div>

          {/* Dishes Grouped by Category */}
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
          ) : categorizedSections.length > 0 ? (
            <div className="menu-categories-container">
              {categorizedSections.map((section) => (
                <div
                  key={section.id}
                  id={`category-section-${section.id}`}
                  className="menu-category-group"
                >
                  {/* Category Header */}
                  <div className="category-group-header">
                    <div className="category-group-info">
                      {section.image && (
                        <img
                          src={section.image}
                          alt={section.name}
                          className="category-group-icon"
                        />
                      )}
                      <h3 className="category-group-title">{section.name}</h3>
                    </div>
                  </div>

                  {/* Dishes Horizontal Scroll Row */}
                  <HorizontalScrollRow className="category-dishes-scroll-row">
                    {section.dishes.map((dish) => renderDishCard(dish))}
                  </HorizontalScrollRow>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-dishes-state">
              <RestaurantMenuIcon className="no-dishes-icon" />
              <p>{translations.nodishesfound || "No dishes available in this selection."}</p>
            </div>
          )}
        </section>
      )}

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

export default HomeDishes;