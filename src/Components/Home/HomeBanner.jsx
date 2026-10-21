import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import BoltIcon from "@mui/icons-material/Bolt";
import StarIcon from "@mui/icons-material/Star";
import SpaIcon from "@mui/icons-material/Spa";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import "../../Scss/Components/Home/homebanner.scss";

const BANNER_SLIDES = [
  {
    id: 1,
    image: "/banners/banner-pizza.jpg",
    tag: "Wood-Fired Signature",
    tagType: "hot",
    titlePrefix: "Authentic Stone-Baked ",
    titleHighlight: "Artisanal Pizza",
    description:
      "Hand-tossed slow-fermented crust topped with rich San Marzano tomato sauce, fresh creamy fior di latte mozzarella, and aromatic basil leaves straight from our brick oven.",
    primaryBtn: { text: "Order Pizza Now", link: "/menu" },
    secondaryBtn: { text: "Explore Flavors", link: "/menu" },
    highlightBadge: "Save 25% Today",
  },
  {
    id: 2,
    image: "/banners/banner-burger.jpg",
    tag: "Prime Gourmet Burger",
    tagType: "chef",
    titlePrefix: "Sizzling Double Bacon ",
    titleHighlight: "Smash Burger",
    description:
      "100% grass-fed Angus beef patties seared to juicy perfection, smothered with melted aged cheddar, smoked applewood bacon, and house secret savory sauce on toasted brioche.",
    primaryBtn: { text: "Taste The Crunch", link: "/menu" },
    secondaryBtn: { text: "Chef's Specials", link: "/offers" },
    highlightBadge: "Bestseller ★★★★★",
  },
  {
    id: 3,
    image: "/banners/banner-feast.jpg",
    tag: "Authentic Culinary Feast",
    tagType: "trending",
    titlePrefix: "Signature Tonkotsu Ramen & ",
    titleHighlight: "Sushi Banquet",
    description:
      "Indulge in 18-hour slow-simmered rich pork broth, tender chashu slices, seasoned eggs, paired with fresh salmon sashimi and artisanal handcrafted nigiri platters.",
    primaryBtn: { text: "Book A Table", link: "/reservation" },
    secondaryBtn: { text: "Order Takeout", link: "/menu" },
    highlightBadge: "Fine Dining Experience",
  },
  {
    id: 4,
    image: "/banners/banner-dessert.jpg",
    tag: "Sweet Indulgence & Bar",
    tagType: "sweet",
    titlePrefix: "Molten Belgian Lava Cake & ",
    titleHighlight: "Craft Cocktails",
    description:
      "Warm flowing dark chocolate ganache served alongside pure Madagascar vanilla bean gelato, paired with refreshing handcrafted botanical fruit mocktails & coolers.",
    primaryBtn: { text: "Dessert & Drinks", link: "/menu" },
    secondaryBtn: { text: "Reserve Evening", link: "/reservation" },
    highlightBadge: "Evening Special",
  },
];

const SLIDE_DURATION = 5000; // 5 seconds per slide

const HomeBanner = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % BANNER_SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + BANNER_SLIDES.length) % BANNER_SLIDES.length);
  }, []);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto advance timer
  useEffect(() => {
    if (!isPaused) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, SLIDE_DURATION);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, currentSlide]);

  return (
    <section
      className="hero-banner-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="Featured Restaurant Banners Carousel"
    >
      {/* Navigation Arrows */}
      <button
        type="button"
        className="hero-nav-arrow hero-nav-prev"
        onClick={prevSlide}
        aria-label="Previous Slide"
      >
        <ArrowBackIosNewIcon fontSize="small" />
      </button>

      <button
        type="button"
        className="hero-nav-arrow hero-nav-next"
        onClick={nextSlide}
        aria-label="Next Slide"
      >
        <ArrowForwardIosIcon fontSize="small" />
      </button>

      {/* Slides Track */}
      <div className="hero-slider-track">
        {BANNER_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`hero-slide ${isActive ? "active" : ""}`}
              aria-hidden={!isActive}
            >
              {/* Background Food Banner Image */}
              <img
                src={slide.image}
                alt={`${slide.titlePrefix} ${slide.titleHighlight}`}
                className="hero-slide-bg"
                loading={index === 0 ? "eager" : "lazy"}
              />

              {/* Gradient Overlays */}
              <div className="hero-overlay-dark" />
              <div className="hero-overlay-bottom" />

              {/* Slide Content */}
              <div className="hero-content-wrapper">
                <div className="hero-text-content">
                  {/* Category / Highlight Badge */}
                  <div className="hero-badge-pill">
                    <LocalFireDepartmentIcon fontSize="small" />
                    <span>{slide.tag}</span>
                    <span className="hero-badge-tag">{slide.highlightBadge}</span>
                  </div>

                  {/* Main Headline */}
                  <h1 className="hero-title">
                    {slide.titlePrefix}
                    <span className="highlight-text">{slide.titleHighlight}</span>
                  </h1>

                  {/* Description */}
                  <p className="hero-description">{slide.description}</p>

                  {/* Call to Actions */}
                  <div className="hero-actions-group">
                    <Link to={slide.primaryBtn.link} className="hero-btn-primary">
                      <span>{slide.primaryBtn.text}</span>
                      <ArrowForwardIcon fontSize="inherit" />
                    </Link>

                    <Link to={slide.secondaryBtn.link} className="hero-btn-secondary">
                      <RestaurantMenuIcon fontSize="small" />
                      <span>{slide.secondaryBtn.text}</span>
                    </Link>
                  </div>

                  {/* Floating Highlights Badges */}
                  <div className="hero-floating-badges">
                    <div className="floating-pill">
                      <StarIcon fontSize="inherit" className="floating-pill-icon" />
                      <span>4.9/5 (2,800+ Verified Diners)</span>
                    </div>
                    <div className="floating-pill">
                      <BoltIcon fontSize="inherit" className="floating-pill-icon" />
                      <span>Avg. 28 Mins Doorstep Delivery</span>
                    </div>
                    <div className="floating-pill">
                      <SpaIcon fontSize="inherit" className="floating-pill-icon" />
                      <span>100% Fresh Farm Ingredients</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Dots & Indicators */}
      <div className="hero-indicators-container">
        {BANNER_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <button
              key={slide.id}
              type="button"
              className={`hero-dot-btn ${isActive ? "active" : ""}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            >
              {isActive && <div className="hero-dot-progress" key={`progress-${currentSlide}`} />}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default HomeBanner;
