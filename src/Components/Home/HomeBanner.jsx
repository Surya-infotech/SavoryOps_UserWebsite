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

const HomeBanner = ({ banners = [] }) => {
  const { translations = {} } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef(null);

  const bannerSlides = useMemo(() => {
    if (!Array.isArray(banners)) return [];
    return banners.map((item, idx) => ({
      id: item._id || item.bannerid || idx + 1,
      image: item.image || "",
      tag: item.tag || "",
      highlightBadge: item.highlightBadge || "",
      titlePrefix: item.titlePrefix || "",
      titleHighlight: item.titleHighlight || "",
      description: item.description || "",
      primaryBtn: {
        text: item.primaryBtnText || "",
        link: item.primaryBtnLink || "/menu",
      },
      secondaryBtn: {
        text: item.secondaryBtnText || "",
        link: item.secondaryBtnLink || "/menu",
      },
      featureBadge1: item.featureBadge1 || "",
      featureBadge2: item.featureBadge2 || "",
      featureBadge3: item.featureBadge3 || "",
    }));
  }, [banners]);

  const activeSlideIndex =
    bannerSlides.length > 0 ? currentSlide % bannerSlides.length : 0;

  const nextSlide = useCallback(() => {
    if (bannerSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
  }, [bannerSlides.length]);

  const prevSlide = useCallback(() => {
    if (bannerSlides.length <= 1) return;
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length);
  }, [bannerSlides.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto advance timer
  useEffect(() => {
    if (!isPaused && bannerSlides.length > 1) {
      timerRef.current = setInterval(() => {
        nextSlide();
      }, SLIDE_DURATION);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, nextSlide, currentSlide, bannerSlides.length]);

  if (bannerSlides.length === 0) {
    return null;
  }

  return (
    <section
      className="hero-banner-container"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label={translations.featuredrestaurantbanners}
    >
      {/* Navigation Arrows */}
      {bannerSlides.length > 1 && (
        <>
          <button
            type="button"
            className="hero-nav-arrow hero-nav-prev"
            onClick={prevSlide}
            aria-label={translations.previousslide}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </button>

          <button
            type="button"
            className="hero-nav-arrow hero-nav-next"
            onClick={nextSlide}
            aria-label={translations.nextslide}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </button>
        </>
      )}

      {/* Slides Track */}
      <div className="hero-slider-track">
        {bannerSlides.map((slide, index) => {
          const isActive = index === activeSlideIndex;
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
                    {slide.highlightBadge && (
                      <span className="hero-badge-tag">{slide.highlightBadge}</span>
                    )}
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
                    {slide.primaryBtn?.text && (
                      <Link to={slide.primaryBtn.link} className="hero-btn-primary">
                        <span>{slide.primaryBtn.text}</span>
                        <ArrowForwardIcon fontSize="inherit" />
                      </Link>
                    )}

                    {slide.secondaryBtn?.text && (
                      <Link to={slide.secondaryBtn.link} className="hero-btn-secondary">
                        <RestaurantMenuIcon fontSize="small" />
                        <span>{slide.secondaryBtn.text}</span>
                      </Link>
                    )}
                  </div>

                  {/* Floating Highlights Badges */}
                  <div className="hero-floating-badges">
                    {slide.featureBadge1 && (
                      <div className="floating-pill">
                        <StarIcon fontSize="inherit" className="floating-pill-icon" />
                        <span>{slide.featureBadge1}</span>
                      </div>
                    )}
                    {slide.featureBadge2 && (
                      <div className="floating-pill">
                        <BoltIcon fontSize="inherit" className="floating-pill-icon" />
                        <span>{slide.featureBadge2}</span>
                      </div>
                    )}
                    {slide.featureBadge3 && (
                      <div className="floating-pill">
                        <SpaIcon fontSize="inherit" className="floating-pill-icon" />
                        <span>{slide.featureBadge3}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Dots & Indicators */}
      {bannerSlides.length > 1 && (
        <div className="hero-indicators-container">
          {bannerSlides.map((slide, index) => {
            const isActive = index === activeSlideIndex;
            return (
              <button
                key={slide.id}
                type="button"
                className={`hero-dot-btn ${isActive ? "active" : ""}`}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
                {isActive && <div className="hero-dot-progress" key={`progress-${activeSlideIndex}`} />}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default HomeBanner;