import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import BoltIcon from "@mui/icons-material/Bolt";
import StarIcon from "@mui/icons-material/Star";
import SpaIcon from "@mui/icons-material/Spa";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Components/Home/homebanner.scss";

const SLIDE_DURATION = 5000; // 5 seconds per slide

const HomeBanner = () => {
  const { translations = {} } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const bannerSlides = useMemo(
    () => [
      {
        id: 1,
        image: "/banners/banner-pizza.jpg",
        tag: translations.woodfiredsignature,
        tagType: "hot",
        titlePrefix: translations.authenticstonebaked,
        titleHighlight: translations.artisanalpizza,
        description: translations.pizzabannerdesc,
        primaryBtn: { text: translations.orderpizzanow, link: "/menu" },
        secondaryBtn: { text: translations.exploreflavors, link: "/menu" },
        highlightBadge: translations.save25today,
      },
      {
        id: 2,
        image: "/banners/banner-burger.jpg",
        tag: translations.primegourmetburger,
        tagType: "chef",
        titlePrefix: translations.sizzlingdoublebacon,
        titleHighlight: translations.smashburger,
        description: translations.burgerbannerdesc,
        primaryBtn: { text: translations.tastethecrunch, link: "/menu" },
        secondaryBtn: { text: translations.chefspecials, link: "/offers" },
        highlightBadge: translations.bestseller,
      },
      {
        id: 3,
        image: "/banners/banner-feast.jpg",
        tag: translations.authenticculinaryfeast,
        tagType: "trending",
        titlePrefix: translations.ramenbannersubtitle,
        titleHighlight: translations.sushibanquet,
        description: translations.feastbannerdesc,
        primaryBtn: { text: translations.booktable, link: "/reservation" },
        secondaryBtn: { text: translations.ordertakeout, link: "/menu" },
        highlightBadge: translations.finediningexperience,
      },
      {
        id: 4,
        image: "/banners/banner-dessert.jpg",
        tag: translations.sweetindulgencebar,
        tagType: "sweet",
        titlePrefix: translations.dessertbannersubtitle,
        titleHighlight: translations.craftcocktails,
        description: translations.dessertbannerdesc,
        primaryBtn: { text: translations.dessertanddrinks, link: "/menu" },
        secondaryBtn: { text: translations.reserveevening, link: "/reservation" },
        highlightBadge: translations.eveningspecial,
      },
    ],
    [translations]
  );

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  }, [bannerSlides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  }, [bannerSlides.length]);

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
        {bannerSlides.map((slide, index) => {
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
                      <span>{translations.verifieddiners}</span>
                    </div>
                    <div className="floating-pill">
                      <BoltIcon fontSize="inherit" className="floating-pill-icon" />
                      <span>{translations.doorstepdelivery}</span>
                    </div>
                    <div className="floating-pill">
                      <SpaIcon fontSize="inherit" className="floating-pill-icon" />
                      <span>{translations.freshfarmingredients}</span>
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
        {bannerSlides.map((slide, index) => {
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
