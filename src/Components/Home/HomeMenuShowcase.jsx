import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";

/**
 * Pure CSS Veg & Non-Veg FSSAI standard diet badge
 */
const DietIndicator = ({ isVeg, className = "" }) => {
  return (
    <span
      className={`dish-diet-badge ${isVeg ? "veg" : "non-veg"} ${className}`}
      title={isVeg ? "Vegetarian" : "Non-Vegetarian"}
      aria-label={isVeg ? "Vegetarian" : "Non-Vegetarian"}
    >
      <span className="diet-box">
        <span className="diet-dot" />
      </span>
    </span>
  );
};

/**
 * Rich Default Menu Sections Data (Option 2: Curated Section Carousels)
 * Note: Pure local data, no external API call is made.
 */
export const DEFAULT_MENU_SECTIONS = [
  {
    id: "chefs-specials",
    title: "Chef's Signature Recommendations",
    subtitle: "Artisanal culinary masterpieces crafted fresh daily with prime organic cuts & heirloom produce",
    tag: "Executive Selection",
    tagColor: "gold",
    icon: "🌟",
    viewAllLink: "/menu",
    items: [
      {
        id: "cs-1",
        title: "Truffle Mushroom Risotto",
        desc: "Creamy arborio rice infused with winter black truffle, sautéed wild porcini mushrooms & 24-month aged parmesan crisps.",
        price: 22.5,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "20 min",
        tag: "Bestseller",
        addons: [
          { id: "a1", name: "Extra Shaved Winter Truffle", price: 4.5 },
          { id: "a2", name: "Organic Garlic Herb Baguette", price: 3.0 },
          { id: "a3", name: "Aged Parmigiano Reggiano", price: 2.5 },
        ],
      },
      {
        id: "cs-2",
        title: "Wood-Fired Prime Ribeye Steak",
        desc: "28-day dry-aged grass-fed ribeye cut seared over oak wood embers, served with garlic herb butter & blistered vine tomatoes.",
        price: 36.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "25 min",
        tag: "Chef's Choice",
        addons: [
          { id: "a4", name: "Truffle Peppercorn Glaze", price: 3.5 },
          { id: "a5", name: "Crispy Smashed Baby Potatoes", price: 4.0 },
          { id: "a6", name: "Grilled Jumbo Prawns Skewer", price: 7.5 },
        ],
      },
      {
        id: "cs-3",
        title: "Pan-Seared Atlantic Salmon",
        desc: "Wild-caught salmon fillet with crispy golden skin, resting on roasted cauliflower silk purée and citrus dill butter emulsion.",
        price: 28.5,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "20 min",
        tag: "Popular",
        addons: [
          { id: "a7", name: "Charred Asparagus Spears", price: 4.0 },
          { id: "a8", name: "Lemon Caper Reduction", price: 2.0 },
        ],
      },
      {
        id: "cs-4",
        title: "Artisanal Burrata Caprese",
        desc: "Creamy whole Pugliese burrata cheese paired with ripe heirloom tomatoes, microbasil, cold-pressed olive oil & balsamic pearls.",
        price: 18.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1592417817098-8f3d69106001?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "10 min",
        tag: "Must Try",
        addons: [
          { id: "a9", name: "Toasted Focaccia Slices", price: 3.0 },
          { id: "a10", name: "Prosciutto Di Parma (Aged 18mo)", price: 5.5 },
        ],
      },
      {
        id: "cs-5",
        title: "Slow-Braised Lamb Shank",
        desc: "Fall-off-the-bone 12-hour braised lamb shank in rich rosemary red wine reduction over velvet potato purée.",
        price: 34.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "30 min",
        tag: "House Special",
        addons: [
          { id: "a11", name: "Roasted Root Vegetables", price: 3.5 },
          { id: "a12", name: "Extra Braising Demi-Glace", price: 2.5 },
        ],
      },
    ],
  },
  {
    id: "wood-fired-pizzas",
    title: "Wood-Fired Neapolitan Pizzas & Artisanal Mains",
    subtitle: "72-hour cold-fermented sourdough baked at 450°C in our volcanic stone oven",
    tag: "Stone-Oven Specialties",
    tagColor: "emerald",
    icon: "🍕",
    viewAllLink: "/menu",
    items: [
      {
        id: "pz-1",
        title: "Margherita Di Bufala D.O.P.",
        desc: "San Marzano D.O.P. tomato sauce, creamy buffalo mozzarella from Campania, sweet basil leaves, and golden extra virgin olive oil.",
        price: 19.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "15 min",
        tag: "Authentic Classic",
        addons: [
          { id: "a13", name: "Extra Buffalo Mozzarella", price: 3.5 },
          { id: "a14", name: "Spicy Hot Honey Dip", price: 2.0 },
          { id: "a15", name: "Gluten-Friendly Sourdough Crust", price: 3.0 },
        ],
      },
      {
        id: "pz-2",
        title: "Diavola Spicy Salami & Hot Honey",
        desc: "Spicy artisan Calabrian soppressata salami, crushed tomato sugo, fior di latte, hot chili flakes, finished with raw wildflower hot honey.",
        price: 23.5,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "15 min",
        tag: "Spicy Favorite",
        addons: [
          { id: "a16", name: "Pickled Jalapeño Rings", price: 1.5 },
          { id: "a17", name: "Garlic Confit Dip", price: 2.0 },
        ],
      },
      {
        id: "pz-3",
        title: "Wild Forest Truffle Bianco",
        desc: "White garlic herb ricotta base, wild sautéed porcini & chanterelles, melted fontina cheese, fresh thyme, and white truffle oil drizzle.",
        price: 25.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "18 min",
        tag: "Gourmet White",
        addons: [
          { id: "a18", name: "Wild Rocket Arugula", price: 2.0 },
          { id: "a19", name: "Truffle Aioli Dip", price: 2.5 },
        ],
      },
      {
        id: "pz-4",
        title: "Smoked Wagyu Gourmet Burger",
        desc: "Hand-pressed 200g prime Wagyu beef patty, double melted sharp cheddar, caramelized shallot jam, and house smoked aioli on toasted brioche.",
        price: 21.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "15 min",
        tag: "House Special",
        addons: [
          { id: "a20", name: "Crispy Applewood Bacon Strips", price: 3.0 },
          { id: "a21", name: "Truffle Parmesan Fries", price: 4.5 },
          { id: "a22", name: "Extra Wagyu Patty", price: 6.0 },
        ],
      },
      {
        id: "pz-5",
        title: "Handmade Maine Lobster Ravioli",
        desc: "Fresh handcrafted egg pasta stuffed with sweet Maine lobster & mascarpone, served in a velvety roasted shellfish saffron reduction.",
        price: 31.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "22 min",
        tag: "Chef's Handcrafted",
        addons: [
          { id: "a23", name: "Pan-Seared Sea Scallops (2pcs)", price: 7.0 },
          { id: "a24", name: "Garlic Sourdough Toast", price: 2.5 },
        ],
      },
    ],
  },
  {
    id: "deals-bundles",
    title: "Signature Combos & Value Feasts",
    subtitle: "Complete multi-course dining experiences designed for sharing, gatherings & celebrations",
    tag: "Curated Feasts",
    tagColor: "gold",
    icon: "🎁",
    viewAllLink: "/menu",
    items: [
      {
        id: "cb-1",
        title: "Royal Surf & Turf Duo Feast",
        desc: "1x Wood-Fired Prime Ribeye Steak (300g) + 1x Pan-Seared Atlantic Salmon + 2x Signature Sides + 2x Botanical Mocktails.",
        price: 58.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "35 min",
        tag: "Chef's Combo",
        isDeal: true,
        bundletype: "combo",
        includedCount: 4,
        includedItems: [
          "1x Wood-Fired Prime Ribeye Steak",
          "1x Pan-Seared Atlantic Salmon Fillet",
          "2x Truffle Fries or Caesar Salad",
          "2x Handcrafted Drinks of Choice",
        ],
        addons: [
          { id: "a25", name: "Upgrade to Molten Chocolate Dessert", price: 6.0 },
          { id: "a26", name: "Extra Herb Garlic Baguette", price: 3.0 },
        ],
      },
      {
        id: "cb-2",
        title: "Artisan Pizza & Refreshers Pack",
        desc: "Choice of any 2 Signature Wood-Fired Pizzas + 1x Crispy Truffle Parmesan Fries + 2x Artisanal House Refreshers.",
        price: 44.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "20 min",
        tag: "Couple Pack",
        isDeal: true,
        bundletype: "combo",
        includedCount: 3,
        includedItems: [
          "2x Any Wood-Fired Neapolitan Pizzas",
          "1x Truffle Parmesan Fries with Garlic Aioli",
          "2x Refreshing House Spritzes",
        ],
        addons: [
          { id: "a27", name: "Tiramisu Dessert Jar", price: 5.5 },
          { id: "a28", name: "Spicy Honey & Truffle Dip Pack", price: 3.5 },
        ],
      },
      {
        id: "cb-3",
        title: "The Executive Quick Lunch Box",
        desc: "Choice of Gourmet Burger or Handcrafted Pasta + 1x Organic Garden Side Salad + 1x Chilled Beverage.",
        price: 21.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "15 min",
        tag: "Speedy Lunch",
        isDeal: true,
        bundletype: "combo",
        includedCount: 3,
        includedItems: [
          "1x Signature Main (Burger or Pasta)",
          "1x Fresh Crisp Garden Salad",
          "1x Chilled Iced Tea or Botanical Soda",
        ],
        addons: [
          { id: "a29", name: "Add Belgian Chocolate Brownie", price: 3.0 },
        ],
      },
      {
        id: "cb-4",
        title: "Grand Family Fiesta (Feeds 4)",
        desc: "2x Large Specialty Pizzas + 1x Crispy Calamari Basket + 1x Large Classic Caesar Salad + 4x Chilled Drinks.",
        price: 69.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=700&q=80",
        isVeg: false,
        prepTime: "25 min",
        tag: "Family Saver",
        isDeal: true,
        bundletype: "combo",
        includedCount: 5,
        includedItems: [
          "2x Large Specialty Stone-Oven Pizzas",
          "1x Crispy Fried Calamari with Tartar",
          "1x Large Classic Caesar Salad with Shaved Parmesan",
          "4x Soft Beverages",
        ],
        addons: [
          { id: "a30", name: "Add 12x Buffalo Wings", price: 9.0 },
          { id: "a31", name: "Add 4x Belgian Mini Brownies", price: 8.0 },
        ],
      },
    ],
  },
  {
    id: "desserts-drinks",
    title: "Artisanal Desserts & Botanical Mixology",
    subtitle: "Sweet finales crafted with pure Belgian chocolate and natural botanicals",
    tag: "Sweet & Refreshing",
    tagColor: "rose",
    icon: "🍰",
    viewAllLink: "/menu",
    items: [
      {
        id: "ds-1",
        title: "Molten Belgian Chocolate Lava",
        desc: "Warm dark Belgian chocolate cake with a rich molten center, paired with pure Madagascar vanilla bean gelato.",
        price: 12.5,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "12 min",
        tag: "Warm Delight",
        addons: [
          { id: "a32", name: "Extra Scoop Vanilla Bean Gelato", price: 3.0 },
          { id: "a33", name: "Salted Caramel Drizzle", price: 1.5 },
        ],
      },
      {
        id: "ds-2",
        title: "Classic Venetian Tiramisu",
        desc: "Authentic Italian recipe with espresso-soaked savoiardi ladyfingers, velvety mascarpone sabayon, and raw Valrhona cocoa.",
        price: 11.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "8 min",
        tag: "Chef's Classic",
        addons: [
          { id: "a34", name: "Espresso Shot on Side", price: 2.0 },
          { id: "a35", name: "Amaretto Hazelnut Biscotti", price: 2.5 },
        ],
      },
      {
        id: "ds-3",
        title: "Wild Berry Botanical Spritz",
        desc: "Crushed wild blackberries, elderflower blossom infusion, fresh garden mint, fresh lime, topped with sparkling soda.",
        price: 8.5,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "5 min",
        tag: "Zero-Proof",
        addons: [
          { id: "a36", name: "Add Chia Seeds", price: 1.0 },
          { id: "a37", name: "Sparkling Coconut Water Base", price: 1.5 },
        ],
      },
      {
        id: "ds-4",
        title: "Japanese Yuzu Baked Cheesecake",
        desc: "Silky baked citrus cheesecake with a crumbly buttery graham crust, infused with aromatic yuzu and glazed with blackberry reduction.",
        price: 13.0,
        currencySymbol: "$",
        image: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=700&q=80",
        isVeg: true,
        prepTime: "10 min",
        tag: "Citrus Refresh",
        addons: [
          { id: "a38", name: "Whipped Chantilly Cream", price: 1.5 },
          { id: "a39", name: "Candied Yuzu Peel", price: 1.5 },
        ],
      },
    ],
  },
];

/**
 * Individual Horizontal Carousel Row Component
 */
const CarouselRow = ({ section, cartCounts, onCardClick, onOpenAddonModal, onAddToCart }) => {
  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const updateScrollButtons = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    updateScrollButtons();
    track.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    return () => {
      track.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
    };
  }, [updateScrollButtons]);

  const handleScroll = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const scrollStep = Math.max(320, el.clientWidth * 0.75);
    el.scrollBy({
      left: direction === "left" ? -scrollStep : scrollStep,
      behavior: "smooth",
    });
    setTimeout(updateScrollButtons, 350);
  };

  // Mouse drag handlers for track
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !trackRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - trackRef.current.offsetLeft;
    scrollLeftRef.current = trackRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.25;
    trackRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  return (
    <div className="showcase-carousel-row" id={`section-${section.id}`}>
      {/* Row Header */}
      <div className="carousel-row-header">
        <div className="header-info-wrap">
          {section.tag && (
            <span className={`row-tag-badge ${section.tagColor || ""}`}>
              {section.icon} {section.tag}
            </span>
          )}
          <h3 className="row-title">{section.title}</h3>
          {section.subtitle && <p className="row-subtitle">{section.subtitle}</p>}
        </div>

        <div className="header-actions-wrap">
          <Link to={section.viewAllLink || "/menu"} className="row-view-all-link">
            <span>View All</span>
            <ArrowForwardIcon fontSize="inherit" />
          </Link>
        </div>
      </div>

      {/* Horizontal Carousel Track with Floating Side Navigation Buttons */}
      <div className="carousel-track-wrapper">
        {/* Floating Left Arrow Button */}
        <button
          type="button"
          className="carousel-side-arrow-btn left"
          onClick={() => handleScroll("left")}
          disabled={!canScrollLeft}
          aria-label={`Scroll ${section.title} left`}
          title="Scroll left"
        >
          <ChevronLeftIcon />
        </button>

        {/* Floating Right Arrow Button */}
        <button
          type="button"
          className="carousel-side-arrow-btn right"
          onClick={() => handleScroll("right")}
          disabled={!canScrollRight}
          aria-label={`Scroll ${section.title} right`}
          title="Scroll right"
        >
          <ChevronRightIcon />
        </button>

        <div
          className="carousel-scroll-track"
          ref={trackRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave}
          onMouseLeave={handleMouseUpOrLeave}
        >
          {section.items.map((dish) => {
            const count = cartCounts[dish.id] || 0;
            const priceFormatted = `${dish.currencySymbol}${dish.price.toFixed(2)}`;
            const isCombo = dish.isDeal && (dish.bundletype === "combo" || !dish.bundletype);
            const isUnlimited = dish.isDeal && dish.bundletype === "unlimited";
            const isComboOrUnlimited = isCombo || isUnlimited || dish.isDeal;

            return (
              <div
                key={dish.id}
                className={`dish-card showcase-dish-card ${dish.isDeal ? "deal-card combo-card" : ""}`}
                onClick={() => onCardClick(dish)}
                tabIndex={0}
                role="button"
                aria-label={`View details for ${dish.title}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onCardClick(dish);
                  }
                }}
              >
                {/* 1. Image Box (200px height - Exact Menu Page Spec) */}
                <div className="dish-img-box">
                  <div className="dish-img-placeholder">
                    <RestaurantMenuIcon className="dish-no-img-icon" />
                  </div>

                  {dish.image && (
                    <img
                      src={dish.image}
                      alt={dish.title}
                      className="dish-img"
                      loading="lazy"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  )}

                  {isCombo ? (
                    <span className="deal-ribbon-badge combo">
                      Combo
                    </span>
                  ) : (
                    dish.tag && <span className="dish-tag-badge">{dish.tag}</span>
                  )}

                  {dish.prepTime && (
                    <span className="dish-prep-time">
                      <AccessTimeIcon fontSize="inherit" />
                      {dish.prepTime}
                    </span>
                  )}

                  <DietIndicator isVeg={dish.isVeg} />
                </div>

                {/* 2. Dish Content Body */}
                <div className="dish-content">
                  <h3 className="dish-title" title={dish.title}>
                    {dish.title}
                  </h3>

                  {dish.desc && (
                    <p className="dish-desc" title={dish.desc}>
                      {dish.desc}
                    </p>
                  )}

                  {dish.isDeal && dish.includedCount && (
                    <div className="deal-items-preview-row">
                      <span className="deal-items-pill">
                        🍽️ {dish.includedCount} dishes included
                      </span>
                    </div>
                  )}

                  <div className="dish-footer-row">
                    <div className="dish-price-group">
                      <span className="dish-price">{priceFormatted}</span>
                    </div>

                    <div className="dish-card-actions">
                      {/* Dedicated Add-on Button when customizable addons exist (hidden on combo and unlimited items) */}
                      {!isComboOrUnlimited && dish.addons && dish.addons.length > 0 && (
                        <button
                          type="button"
                          className="dish-addon-btn"
                          onClick={(e) => onOpenAddonModal(e, dish)}
                          title={`Add-ons - ${dish.title}`}
                          aria-label={`${dish.title} Add-ons`}
                        >
                          <AddIcon className="addon-btn-icon" />
                        </button>
                      )}

                      {/* Direct Add to Cart Button (hidden on combo and unlimited items) */}
                      {!isComboOrUnlimited && (
                        <button
                          type="button"
                          className={`dish-add-btn ${count > 0 ? "added" : ""}`}
                          onClick={(e) => onAddToCart(e, dish)}
                          aria-label="Add to cart"
                          title={count > 0 ? `Added (${count})` : "Add to cart"}
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
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Home Menu Showcase Section Component
 */
const HomeMenuShowcase = () => {
  const { showSnackbar } = useSnackbar();

  // Local cart count state
  const [cartCounts, setCartCounts] = useState({});

  // 1. Full Item Details Modal State (opened on dish card click)
  const [selectedDishModal, setSelectedDishModal] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  // 2. Dedicated Add-on Selection Modal State (opened on '+' dish-addon-btn click)
  const [addonModalDish, setAddonModalDish] = useState(null);
  const [addonQuantity, setAddonQuantity] = useState(1);
  const [addonSelectedIds, setAddonSelectedIds] = useState([]);

  // Addon price calculations for Item Details Modal
  const selectedDishAddonsTotal = useMemo(() => {
    if (!selectedDishModal || !selectedDishModal.addons) return 0;
    return selectedDishModal.addons
      .filter((a) => selectedAddonIds.includes(a.addonid || a._id || a.id))
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
  }, [selectedDishModal, selectedAddonIds]);

  const selectedDishGrandTotal = useMemo(() => {
    if (!selectedDishModal) return 0;
    const base = Number(selectedDishModal.price || 0);
    return (base + selectedDishAddonsTotal) * modalQuantity;
  }, [selectedDishModal, selectedDishAddonsTotal, modalQuantity]);

  // Addon price calculations for Dedicated Add-on Modal
  const addonModalAddonsTotal = useMemo(() => {
    if (!addonModalDish || !addonModalDish.addons) return 0;
    return addonModalDish.addons
      .filter((a) => addonSelectedIds.includes(a.addonid || a._id || a.id))
      .reduce((sum, a) => sum + Number(a.price || 0), 0);
  }, [addonModalDish, addonSelectedIds]);

  const addonModalGrandTotal = useMemo(() => {
    if (!addonModalDish) return 0;
    const base = Number(addonModalDish.price || 0);
    return (base + addonModalAddonsTotal) * addonQuantity;
  }, [addonModalDish, addonModalAddonsTotal, addonQuantity]);

  // Quick direct add-to-cart (from shopping cart button)
  const handleAddToCart = (e, dish) => {
    e.stopPropagation();
    setCartCounts((prev) => ({
      ...prev,
      [dish.id]: (prev[dish.id] || 0) + 1,
    }));

    if (typeof showSnackbar === "function") {
      showSnackbar(`${dish.title} added to your order!`, "success", 3000);
    }
  };

  // Card click -> Open Item Details Modal
  const handleCardClick = (dish) => {
    setSelectedDishModal(dish);
    setModalQuantity(cartCounts[dish.id] || 1);
    setSelectedAddonIds([]);
  };

  // '+' Button click -> Open Dedicated Add-on Modal
  const handleOpenAddonModal = (e, dish) => {
    e.stopPropagation();
    setAddonModalDish(dish);
    setAddonSelectedIds([]);
    setAddonQuantity(1);
  };

  // Toggle handlers
  const toggleModalAddon = (addonKey) => {
    setSelectedAddonIds((prev) =>
      prev.includes(addonKey) ? prev.filter((id) => id !== addonKey) : [...prev, addonKey]
    );
  };

  const toggleAddonModalItem = (addonKey) => {
    setAddonSelectedIds((prev) =>
      prev.includes(addonKey) ? prev.filter((id) => id !== addonKey) : [...prev, addonKey]
    );
  };

  // Confirm handlers
  const handleConfirmDishModal = () => {
    if (!selectedDishModal) return;
    setCartCounts((prev) => ({
      ...prev,
      [selectedDishModal.id]: (prev[selectedDishModal.id] || 0) + modalQuantity,
    }));

    if (typeof showSnackbar === "function") {
      showSnackbar(`${selectedDishModal.title} (${modalQuantity}x) added to order!`, "success", 3000);
    }

    setSelectedDishModal(null);
  };

  const handleConfirmAddonModal = () => {
    if (!addonModalDish) return;
    setCartCounts((prev) => ({
      ...prev,
      [addonModalDish.id]: (prev[addonModalDish.id] || 0) + addonQuantity,
    }));

    if (typeof showSnackbar === "function") {
      showSnackbar(`${addonModalDish.title} (${addonQuantity}x) added to order!`, "success", 3000);
    }

    setAddonModalDish(null);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedDishModal(null);
        setAddonModalDish(null);
      }
    };
    if (selectedDishModal || addonModalDish) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDishModal, addonModalDish]);

  return (
    <section className="home-menu-showcase-section" aria-label="Curated Menu Showcase">
      {/* --- Master Section Header --- */}
      <div className="showcase-master-header">
        <span className="showcase-pill-badge">
          <AutoAwesomeIcon className="pill-icon" />
          <span>Curated Dining Experience</span>
        </span>
        <h2 className="showcase-main-title">
          Explore Our <span className="highlight-text">Culinary Creations</span>
        </h2>
        <p className="showcase-main-subtitle">
          Discover section-by-section handcrafted recipes, stone-oven pizzas, chef-curated combos,
          and botanical desserts prepared fresh by our culinary artisans.
        </p>
      </div>

      {/* --- Section-Wise Horizontal Carousels --- */}
      <div className="showcase-sections-list">
        {DEFAULT_MENU_SECTIONS.map((section) => (
          <CarouselRow
            key={section.id}
            section={section}
            cartCounts={cartCounts}
            onCardClick={handleCardClick}
            onOpenAddonModal={handleOpenAddonModal}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      {/* --- Section Bottom CTA Callout --- */}
      <div className="showcase-master-footer">
        <Link to="/menu" className="explore-full-menu-btn">
          <span>Explore Complete Menu & Order Online</span>
          <ArrowForwardIcon className="btn-arrow-icon" fontSize="small" />
        </Link>
        <span className="footer-sub-note">
          100+ gourmet dishes, custom dietary filters, and direct delivery to your table.
        </span>
      </div>

      {/* --- 1. Item Details Popup Modal (Exact Parity with Menu Page) --- */}
      {selectedDishModal && (
        <div
          className="dish-modal-overlay"
          onClick={() => setSelectedDishModal(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dish-modal-title"
        >
          <div className="dish-modal-container" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="dish-modal-close-btn"
              onClick={() => setSelectedDishModal(null)}
              aria-label="Close"
            >
              <CloseIcon fontSize="small" />
            </button>

            {/* Hero Image */}
            {selectedDishModal.image ? (
              <div className="dish-modal-hero">
                <img
                  src={selectedDishModal.image}
                  alt={selectedDishModal.title}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
                <DietIndicator isVeg={selectedDishModal.isVeg} className="dish-modal-diet-badge" />
              </div>
            ) : (
              <div className="dish-modal-no-img-diet">
                <DietIndicator isVeg={selectedDishModal.isVeg} className="dish-modal-diet-badge" />
              </div>
            )}

            {/* Modal Body */}
            <div className="dish-modal-body">
              <div className="dish-modal-header">
                <div>
                  <h3 id="dish-modal-title" className="dish-modal-title">
                    {selectedDishModal.title}
                  </h3>
                  <div className="dish-modal-tags">
                    {selectedDishModal.tag && (
                      <span className="tag-badge">{selectedDishModal.tag}</span>
                    )}
                    {selectedDishModal.prepTime && (
                      <span className="tag-badge">⏱ {selectedDishModal.prepTime}</span>
                    )}
                    <span className="tag-badge">
                      {selectedDishModal.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                    </span>
                  </div>
                </div>

                <span className="dish-modal-price">
                  {selectedDishModal.currencySymbol || "$"}
                  {Number(selectedDishModal.price || 0).toFixed(2)}
                </span>
              </div>

              {selectedDishModal.desc && (
                <p className="dish-modal-desc">{selectedDishModal.desc}</p>
              )}

              {/* Combo Included Items */}
              {selectedDishModal.isDeal && selectedDishModal.includedItems && (
                <div className="dish-modal-addons-box">
                  <div className="dish-modal-addons-title-wrap">
                    <h5>Dishes Included in this Feast</h5>
                  </div>
                  <div className="addons-list">
                    {selectedDishModal.includedItems.map((item, idx) => (
                      <div key={idx} className="addon-item-row">
                        <div className="addon-check-label">
                          <CheckCircleOutlinedIcon style={{ color: "#028802", fontSize: "1.1rem" }} />
                          <span>{item}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customizable Addons List */}
              {selectedDishModal.addons && selectedDishModal.addons.length > 0 && (
                <div className="dish-modal-addons-box">
                  <div className="dish-modal-addons-title-wrap">
                    <h5>Customizable Add-ons</h5>
                    <span className="addons-subtitle">Optional enhancements</span>
                  </div>
                  <div className="addons-list">
                    {selectedDishModal.addons.map((addon) => {
                      const addonKey = addon.addonid || addon._id || addon.id;
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
                              onChange={() => toggleModalAddon(addonKey)}
                              className="addon-checkbox-input"
                            />
                            <span>{addon.addonname || addon.name}</span>
                          </div>
                          <span className="addon-price">
                            +{selectedDishModal.currencySymbol || "$"}
                            {Number(addon.price || 0).toFixed(2)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Modal Footer with Quantity Counter (hidden on combo and unlimited items - exact MenuPage parity) */}
              {!(
                selectedDishModal.bundletype === "combo" ||
                selectedDishModal.bundletype === "unlimited" ||
                selectedDishModal.isDeal
              ) && (
                <div className="dish-modal-footer">
                  <div className="quantity-counter">
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span>{modalQuantity}</span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity((q) => q + 1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    className="confirm-add-btn"
                    onClick={handleConfirmDishModal}
                  >
                    Add to Order • {selectedDishModal.currencySymbol || "$"}
                    {selectedDishGrandTotal.toFixed(2)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- 2. Dedicated Add-on Selection Popup Modal (Exact Parity with Menu Page) --- */}
      {addonModalDish && (
        <div
          className="dish-modal-overlay addon-modal-overlay"
          onClick={() => setAddonModalDish(null)}
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
                  <DietIndicator isVeg={addonModalDish.isVeg} className="addon-header-diet" />
                  <h3 id="addon-modal-item-title" className="addon-modal-item-title">
                    {addonModalDish.title}
                  </h3>
                </div>
                <div className="addon-modal-price-meta">
                  <span className="addon-base-price">
                    {addonModalDish.currencySymbol || "$"}
                    {Number(addonModalDish.price || 0).toFixed(2)}
                  </span>
                  {addonModalDish.prepTime && (
                    <span className="addon-prep-time">
                      <AccessTimeIcon fontSize="inherit" /> {addonModalDish.prepTime}
                    </span>
                  )}
                </div>
              </div>

              {addonModalDish.image && (
                <div className="addon-modal-thumb-box">
                  <img
                    src={addonModalDish.image}
                    alt={addonModalDish.title}
                    className="addon-modal-thumb"
                  />
                </div>
              )}

              <button
                type="button"
                className="addon-modal-close-btn"
                onClick={() => setAddonModalDish(null)}
                aria-label="Close"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Description if present */}
            {addonModalDish.desc && (
              <p className="addon-modal-desc">{addonModalDish.desc}</p>
            )}

            {/* Add-ons Selection Section */}
            <div className="addon-selection-section">
              <div className="addon-section-title-wrap">
                <h4 className="addon-section-title">
                  Customizable Add-ons
                </h4>
                <span className="addon-section-subtitle">
                  Select any add-ons
                </span>
              </div>

              <div className="addon-options-list">
                {(addonModalDish.addons || []).map((addon) => {
                  const addonKey = addon.addonid || addon._id || addon.id;
                  const isChecked = addonSelectedIds.includes(addonKey);
                  return (
                    <label
                      key={addonKey}
                      className={`addon-option-item ${isChecked ? "is-selected" : ""}`}
                    >
                      <div className="addon-option-left">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleAddonModalItem(addonKey)}
                          className="addon-option-checkbox"
                        />
                        <span className="addon-option-name">{addon.addonname || addon.name}</span>
                      </div>
                      <span className="addon-option-price">
                        +{addonModalDish.currencySymbol || "$"}
                        {Number(addon.price || 0).toFixed(2)}
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
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <span className="addon-qty-val">{addonQuantity}</span>
                <button
                  type="button"
                  onClick={() => setAddonQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className="addon-add-cart-btn"
                onClick={handleConfirmAddonModal}
              >
                <span>Add to cart</span>
                <span className="addon-btn-separator">•</span>
                <span className="addon-total-price">
                  {addonModalDish.currencySymbol || "$"}
                  {addonModalGrandTotal.toFixed(2)}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeMenuShowcase;
