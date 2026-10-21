import React, { useState } from "react";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "../../Scss/Components/Home/homedishes.scss";

/**
 * Standard Veg/Non-Veg FSSAI-compliant diet badge
 */
export const DietIndicator = ({ isVeg, className = "" }) => {
  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? "Pure Vegetarian" : "Non-Vegetarian"}
      aria-label={isVeg ? "Pure Vegetarian" : "Non-Vegetarian"}
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

const SAMPLE_DISHES = [
  {
    id: 1,
    category: "pizza",
    menuname: "Artisanal Pizza",
    title: "Wood-Fired Margherita Royale",
    desc: "San Marzano marinara, torn buffalo mozzarella, organic sweet basil, extra virgin olive oil.",
    price: "$18.50",
    image: "/banners/banner-pizza.jpg",
    isVeg: true,
  },
  {
    id: 2,
    category: "pizza",
    menuname: "Artisanal Pizza",
    title: "Truffle Prosciutto Gorgonzola",
    desc: "Aged prosciutto di Parma, wild mushrooms, creamy gorgonzola, black truffle drizzle.",
    price: "$23.00",
    image: "/banners/banner-pizza.jpg",
    isVeg: false,
  },
  {
    id: 3,
    category: "burgers",
    menuname: "Smash Burgers",
    title: "Double Cheddar Smash Stack",
    desc: "Double smashed Angus beef patties, aged Wisconsin cheddar, crispy bacon, house savory sauce.",
    price: "$16.75",
    image: "/banners/banner-burger.jpg",
    isVeg: false,
  },
  {
    id: 4,
    category: "burgers",
    menuname: "Smash Burgers",
    title: "Smoky BBQ Bacon Burger",
    desc: "Brioche bun, charred caramelized onions, chipotle BBQ sauce, Monterey jack cheese.",
    price: "$17.50",
    image: "/banners/banner-burger.jpg",
    isVeg: false,
  },
  {
    id: 5,
    category: "asian",
    menuname: "Asian & Ramen",
    title: "Signature Chashu Tonkotsu",
    desc: "Rich 18-hour simmered broth, melt-in-mouth chashu pork belly, bamboo shoots, nitamago egg.",
    price: "$19.25",
    image: "/banners/banner-feast.jpg",
    isVeg: false,
  },
  {
    id: 6,
    category: "asian",
    menuname: "Asian & Ramen",
    title: "Deluxe Sashimi & Nigiri Platter",
    desc: "Atlantic salmon, yellowfin tuna, sweet eel nigiri, and California crunch rolls.",
    price: "$26.00",
    image: "/banners/banner-feast.jpg",
    isVeg: false,
  },
  {
    id: 7,
    category: "dessert",
    menuname: "Desserts & Drinks",
    title: "Molten Belgian Chocolate Cake",
    desc: "Warm decadent liquid chocolate core served with French vanilla bean gelato and fresh berries.",
    price: "$11.50",
    image: "/banners/banner-dessert.jpg",
    isVeg: true,
  },
  {
    id: 8,
    category: "dessert",
    menuname: "Desserts & Drinks",
    title: "Artisanal Passion Berry Mocktail",
    desc: "Crushed raspberries, sparkling botanical citrus water, passionfruit purée, fresh garden mint.",
    price: "$8.50",
    image: "/banners/banner-dessert.jpg",
    isVeg: true,
  },
];

const CATEGORIES = [
  { id: "all", label: "🍽️ All Specialties" },
  { id: "pizza", label: "🍕 Artisanal Pizza" },
  { id: "burgers", label: "🍔 Smash Burgers" },
  { id: "asian", label: "🍜 Asian & Ramen" },
  { id: "dessert", label: "🍰 Desserts & Drinks" },
];

const HomeDishes = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [addedItems, setAddedItems] = useState({});

  const handleAddToCart = (id) => {
    setAddedItems((prev) => ({
      ...prev,
      [id]: (prev[id] || 0) + 1,
    }));
  };

  const filteredDishes =
    selectedCategory === "all"
      ? SAMPLE_DISHES
      : SAMPLE_DISHES.filter((d) => d.category === selectedCategory);

  return (
    <section className="dishes-showcase-section">
      <div className="section-header-block">
        <span className="section-pill-tag">
          <RestaurantMenuIcon fontSize="inherit" />
          Curated Menu
        </span>
        <h2 className="section-main-title">Most Loved Specialties</h2>
        <p className="section-subtitle">
          Crafted with culinary expertise and the finest ingredients. Explore our most popular dishes cooked to absolute perfection.
        </p>
      </div>

      {/* Category Filters */}
      <div className="category-tabs-row">
        {CATEGORIES.map((cat) => (
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
                <span className="dish-tag-badge">
                  {dish.menuname}
                </span>
                <DietIndicator isVeg={dish.isVeg} />
              </div>

              <div className="dish-content">
                <h3 className="dish-title" title={dish.title}>{dish.title}</h3>
                <p className="dish-desc" title={dish.desc}>{dish.desc}</p>

                <div className="dish-footer-row">
                  <div className="dish-price-group">
                    <span className="dish-price">{dish.price}</span>
                  </div>

                  <button
                    type="button"
                    className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                    onClick={() => handleAddToCart(dish.id)}
                    aria-label="Add to cart"
                    title={count > 0 ? `Added (${count})` : "Add to cart"}
                  >
                    {count > 0 ? (
                      <CheckCircleIcon fontSize="small" />
                    ) : (
                      <AddIcon fontSize="small" />
                    )}
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
