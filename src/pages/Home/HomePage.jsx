import React, { useState } from "react";
import { Link } from "react-router-dom";
import HomeBanner from "../../components/Home/HomeBanner.jsx";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import SpaIcon from "@mui/icons-material/Spa";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import AddIcon from "@mui/icons-material/Add";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import "./HomePage.css";

const SAMPLE_DISHES = [
  {
    id: 1,
    category: "pizza",
    menuname: "Artisanal Pizza",
    title: "Wood-Fired Margherita Royale",
    desc: "San Marzano marinara, torn buffalo mozzarella, organic sweet basil, extra virgin olive oil.",
    price: "$18.50",
    image: "/banners/banner-pizza.jpg",
  },
  {
    id: 2,
    category: "pizza",
    menuname: "Artisanal Pizza",
    title: "Truffle Prosciutto Gorgonzola",
    desc: "Aged prosciutto di Parma, wild mushrooms, creamy gorgonzola, black truffle drizzle.",
    price: "$23.00",
    image: "/banners/banner-pizza.jpg",
  },
  {
    id: 3,
    category: "burgers",
    menuname: "Smash Burgers",
    title: "Double Cheddar Smash Stack",
    desc: "Double smashed Angus beef patties, aged Wisconsin cheddar, crispy bacon, house savory sauce.",
    price: "$16.75",
    image: "/banners/banner-burger.jpg",
  },
  {
    id: 4,
    category: "burgers",
    menuname: "Smash Burgers",
    title: "Smoky BBQ Bacon Burger",
    desc: "Brioche bun, charred caramelized onions, chipotle BBQ sauce, Monterey jack cheese.",
    price: "$17.50",
    image: "/banners/banner-burger.jpg",
  },
  {
    id: 5,
    category: "asian",
    menuname: "Asian & Ramen",
    title: "Signature Chashu Tonkotsu",
    desc: "Rich 18-hour simmered broth, melt-in-mouth chashu pork belly, bamboo shoots, nitamago egg.",
    price: "$19.25",
    image: "/banners/banner-feast.jpg",
  },
  {
    id: 6,
    category: "asian",
    menuname: "Asian & Ramen",
    title: "Deluxe Sashimi & Nigiri Platter",
    desc: "Atlantic salmon, yellowfin tuna, sweet eel nigiri, and California crunch rolls.",
    price: "$26.00",
    image: "/banners/banner-feast.jpg",
  },
  {
    id: 7,
    category: "dessert",
    menuname: "Desserts & Drinks",
    title: "Molten Belgian Chocolate Cake",
    desc: "Warm decadent liquid chocolate core served with French vanilla bean gelato and fresh berries.",
    price: "$11.50",
    image: "/banners/banner-dessert.jpg",
  },
  {
    id: 8,
    category: "dessert",
    menuname: "Desserts & Drinks",
    title: "Artisanal Passion Berry Mocktail",
    desc: "Crushed raspberries, sparkling botanical citrus water, passionfruit purée, fresh garden mint.",
    price: "$8.50",
    image: "/banners/banner-dessert.jpg",
  },
];

const HomePage = ({ userdomain }) => {
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

  const brandDisplayName = userdomain
    ? userdomain.charAt(0).toUpperCase() + userdomain.slice(1)
    : "SavoryOps Dining";

  return (
    <div className="home-page-container">
      {/* 1. HERO BANNER CAROUSEL */}
      <HomeBanner userdomain={userdomain} />

      {/* 2. VALUE PROPOSITION / FEATURE STRIP */}
      <section className="features-strip">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper feature-icon-green">
              <DeliveryDiningIcon fontSize="inherit" />
            </div>
            <div className="feature-text">
              <span className="feature-title">Fast 30-Min Delivery</span>
              <span className="feature-desc">Hot, fresh & sealed packaging right to your door</span>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper feature-icon-amber">
              <SpaIcon fontSize="inherit" />
            </div>
            <div className="feature-text">
              <span className="feature-title">100% Organic & Fresh</span>
              <span className="feature-desc">Handpicked farm-to-table seasonal produce daily</span>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper feature-icon-purple">
              <RestaurantMenuIcon fontSize="inherit" />
            </div>
            <div className="feature-text">
              <span className="feature-title">Master Chef Recipes</span>
              <span className="feature-desc">Authentic recipes made with passion & precision</span>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper feature-icon-rose">
              <TableRestaurantIcon fontSize="inherit" />
            </div>
            <div className="feature-text">
              <span className="feature-title">Instant Table Booking</span>
              <span className="feature-desc">Zero waiting line with contactless digital reservation</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. POPULAR MENU SHOWCASE */}
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
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "all" ? "active" : ""}`}
            onClick={() => setSelectedCategory("all")}
          >
            🍽️ All Specialties
          </button>
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "pizza" ? "active" : ""}`}
            onClick={() => setSelectedCategory("pizza")}
          >
            🍕 Artisanal Pizza
          </button>
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "burgers" ? "active" : ""}`}
            onClick={() => setSelectedCategory("burgers")}
          >
            🍔 Smash Burgers
          </button>
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "asian" ? "active" : ""}`}
            onClick={() => setSelectedCategory("asian")}
          >
            🍜 Asian & Ramen
          </button>
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "dessert" ? "active" : ""}`}
            onClick={() => setSelectedCategory("dessert")}
          >
            🍰 Desserts & Drinks
          </button>
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
                </div>

                <div className="dish-content">
                  <h3 className="dish-title">{dish.title}</h3>
                  <p className="dish-desc">{dish.desc}</p>

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

      {/* 4. PROMOTIONAL CALLOUT STRIP */}
      <section className="promo-strip-section">
        <div className="promo-banner-card">
          <div className="promo-card-content">
            <span className="promo-pill">
              <LocalOfferIcon fontSize="inherit" />
              Special Tenant Promotion
            </span>
            <h3 className="promo-title">
              Experience Exquisite Dining at {brandDisplayName}
            </h3>
            <p className="promo-desc">
              Whether you are craving a cozy dinner night at home or a candle-lit table reservation, enjoy our chef-special feasts with flat 20% savings.
            </p>
            <div className="promo-cta-row">
              <div className="promo-code-box">
                Use Code: <strong>FEAST20</strong>
              </div>
              <Link to="/menu" className="hero-btn-primary">
                <span>Order Now</span>
                <ArrowForwardIcon fontSize="inherit" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;