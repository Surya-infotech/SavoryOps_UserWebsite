import { useState, useMemo } from "react";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Components/Home/homedishes.scss";

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge
 */
export const DietIndicator = ({ isVeg, className = "" }) => {
  const { translations = {} } = useLanguage();

  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? translations.purevegetarian : translations.nonvegetarian}
      aria-label={isVeg ? translations.purevegetarian : translations.nonvegetarian}
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addedItems, setAddedItems] = useState({});

  const categories = useMemo(
    () => [
      { id: "all", label: translations.allspecialties },
      { id: "pizza", label: `🍕 ${translations.artisanpizzas}` },
      { id: "burgers", label: `🍔 ${translations.smashburgers}` },
      { id: "asian", label: `🍜 ${translations.ramenbowls}` },
      { id: "dessert", label: `🍰 ${translations.dessertsgelato}` },
    ],
    [translations]
  );

  const sampleDishes = useMemo(
    () => [
      {
        id: 1,
        category: "pizza",
        menuname: translations.artisanpizzas,
        title: translations.dishmargherita,
        desc: translations.dishmargheritadesc,
        price: "$18.50",
        image: "/banners/banner-pizza.jpg",
        isVeg: true,
      },
      {
        id: 2,
        category: "pizza",
        menuname: translations.artisanpizzas,
        title: translations.dishtruffle,
        desc: translations.dishtruffledesc,
        price: "$23.00",
        image: "/banners/banner-pizza.jpg",
        isVeg: false,
      },
      {
        id: 3,
        category: "burgers",
        menuname: translations.smashburgers,
        title: translations.dishdoublecheddar,
        desc: translations.dishdoublecheddardesc,
        price: "$16.75",
        image: "/banners/banner-burger.jpg",
        isVeg: false,
      },
      {
        id: 4,
        category: "burgers",
        menuname: translations.smashburgers,
        title: translations.dishsmokybbq,
        desc: translations.dishsmokybbqdesc,
        price: "$17.50",
        image: "/banners/banner-burger.jpg",
        isVeg: false,
      },
      {
        id: 5,
        category: "asian",
        menuname: translations.ramenbowls,
        title: translations.dishtonkotsu,
        desc: translations.dishtonkotsudesc,
        price: "$19.25",
        image: "/banners/banner-feast.jpg",
        isVeg: false,
      },
      {
        id: 6,
        category: "asian",
        menuname: translations.ramenbowls,
        title: translations.dishsashimi,
        desc: translations.dishsashimidesc,
        price: "$26.00",
        image: "/banners/banner-feast.jpg",
        isVeg: false,
      },
      {
        id: 7,
        category: "dessert",
        menuname: translations.dessertsgelato,
        title: translations.dishchoccake,
        desc: translations.dishchoccakedesc,
        price: "$11.50",
        image: "/banners/banner-dessert.jpg",
        isVeg: true,
      },
      {
        id: 8,
        category: "dessert",
        menuname: translations.handcraftedmocktails,
        title: translations.dishmocktail,
        desc: translations.dishmocktaildesc,
        price: "$8.50",
        image: "/banners/banner-dessert.jpg",
        isVeg: true,
      },
    ],
    [translations]
  );

  const handleAddToCart = (id) => {
    setAddedItems((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const filteredDishes =
    selectedCategory === "all"
      ? sampleDishes
      : sampleDishes.filter((d) => d.category === selectedCategory);

  return (
    <section className="dishes-showcase-section">
      <div className="section-header-block">
        <span className="section-pill-tag">
          <RestaurantMenuIcon fontSize="inherit" />
          {translations.curatedmenu}
        </span>
        <h2 className="section-main-title">{translations.mostlovedspecialties}</h2>
        <p className="section-subtitle">
          {translations.mostlovedsubtitle}
        </p>
      </div>

      {/* Category Filters */}
      <div className="category-tabs-row">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-tab-btn ${selectedCategory === cat.id ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Dishes Grid */}
      <div className="dishes-grid">
        {filteredDishes.map((dish) => {
          const count = addedItems[dish.id] || 0;
          return (
            <div key={dish.id} className="dish-card">
              <div className="dish-img-box">
                <img src={dish.image} alt={dish.title} className="dish-img" loading="lazy" />
                <span className="dish-tag-badge">{dish.menuname}</span>
                <DietIndicator isVeg={dish.isVeg} />
              </div>

              <div className="dish-content">
                <h3 className="dish-title" title={dish.title}>
                  {dish.title}
                </h3>
                <p className="dish-desc" title={dish.desc}>
                  {dish.desc}
                </p>

                <div className="dish-footer-row">
                  <div className="dish-price-group">
                    <span className="dish-price">{dish.price}</span>
                  </div>

                  <button
                    type="button"
                    className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                    onClick={() => handleAddToCart(dish.id)}
                    aria-label={translations.addtocart}
                    title={count > 0 ? `${translations.added} (${count})` : translations.addtocart}
                  >
                    {count > 0 ? <CheckCircleIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HomeDishes;
