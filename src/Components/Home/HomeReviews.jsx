import { useState, useEffect, useRef, useCallback } from "react";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import TakeoutDiningIcon from "@mui/icons-material/TakeoutDining";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ReplyIcon from "@mui/icons-material/Reply";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "../../Pages/Partials/UnderMaintenance.jsx";
import "../../Scss/Components/Home/homereviews.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

const HomeReviews = () => {
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const brandName = business?.businessname || "SavoryOps Kitchen";

  // State Management
  const [reviewsList, setReviewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedReviews, setLikedReviews] = useState({});

  // Fetch all reviews for this business from backend based on subdomain (without branch filtering)
  useEffect(() => {
    let isMounted = true;

    const fetchReviews = async () => {
      const currentSubdomain = getWebsiteSubdomain();
      if (!currentSubdomain) {
        if (isMounted) {
          setLoading(false);
          setReviewsList([]);
        }
        return;
      }

      try {
        if (isMounted) setLoading(true);
        const response = await fetch(`${adminPanelBackendPath}/Website/Home/GetReviews`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
            "x-subdomain": currentSubdomain,
          },
        });

        const data = await response.json();
        if (isMounted) {
          if (response.ok && data.success && Array.isArray(data.reviews)) {
            setReviewsList(data.reviews);
          } else {
            setReviewsList([]);
          }
        }
      } catch (err) {
        console.error("Error fetching website reviews:", err);
        if (isMounted) setReviewsList([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchReviews();

    return () => {
      isMounted = false;
    };
  }, []);

  // Modal Details State
  const [activeReviewDetails, setActiveReviewDetails] = useState(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // New Review Form State
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newName, setNewName] = useState("");
  const [newDiningType, setNewDiningType] = useState("dine-in");
  const [newDish, setNewDish] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Horizontal Carousel Scrolling & Dragging (Exact Parity with Menu Showcase)
  const scrollTrackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Drag-to-scroll state
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const updateScrollButtons = useCallback(() => {
    const el = scrollTrackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  }, []);

  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track) return;

    updateScrollButtons();
    track.addEventListener("scroll", updateScrollButtons, { passive: true });
    window.addEventListener("resize", updateScrollButtons);

    const timer1 = setTimeout(updateScrollButtons, 150);
    const timer2 = setTimeout(updateScrollButtons, 500);

    return () => {
      track.removeEventListener("scroll", updateScrollButtons);
      window.removeEventListener("resize", updateScrollButtons);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [reviewsList, updateScrollButtons]);

  const handleScroll = (direction) => {
    const el = scrollTrackRef.current;
    if (!el) return;

    const cards = el.querySelectorAll(".review-card");
    if (!cards || cards.length === 0) return;

    const firstCard = cards[0];
    const cardWidth = firstCard.getBoundingClientRect().width;
    const gap = parseFloat(window.getComputedStyle(el).gap) || 20;
    const cardStep = cardWidth + gap;

    const maxScroll = el.scrollWidth - el.clientWidth;
    const currentScroll = el.scrollLeft;

    // Calculate current aligned card index
    const currentIndex = Math.round(currentScroll / cardStep);
    let targetIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0) targetIndex = 0;

    let targetScroll = targetIndex * cardStep;
    if (targetScroll > maxScroll) targetScroll = maxScroll;
    if (targetScroll < 0) targetScroll = 0;

    el.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });

    setTimeout(updateScrollButtons, 350);
    setTimeout(updateScrollButtons, 500);
  };

  // Mouse drag handlers for track (instant, smooth, no re-render lag)
  const handleMouseDown = (e) => {
    if (e.button !== 0 || !scrollTrackRef.current) return;
    isDraggingRef.current = true;
    scrollTrackRef.current.classList.add("is-dragging");
    startXRef.current = e.pageX - scrollTrackRef.current.offsetLeft;
    scrollLeftRef.current = scrollTrackRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollTrackRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollTrackRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.25;
    scrollTrackRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const el = scrollTrackRef.current;
    if (!el) return;
    el.classList.remove("is-dragging");

    // Snap to nearest clean card boundary so cards never get stuck halfway
    const firstCard = el.querySelector(".review-card");
    if (firstCard) {
      const cardWidth = firstCard.getBoundingClientRect().width;
      const gap = parseFloat(window.getComputedStyle(el).gap) || 20;
      const cardStep = cardWidth + gap;
      const maxScroll = el.scrollWidth - el.clientWidth;
      const targetIndex = Math.round(el.scrollLeft / cardStep);
      let targetScroll = targetIndex * cardStep;
      if (targetScroll > maxScroll) targetScroll = maxScroll;
      if (targetScroll < 0) targetScroll = 0;

      el.scrollTo({
        left: targetScroll,
        behavior: "smooth",
      });
    }

    setTimeout(updateScrollButtons, 350);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (activeReviewDetails || isWriteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeReviewDetails, isWriteModalOpen]);

  // Handle Likes / Helpful toggles
  const handleToggleHelpful = (reviewId, e) => {
    e.stopPropagation();
    setLikedReviews((prev) => {
      const isCurrentlyLiked = !!prev[reviewId];
      const updated = { ...prev, [reviewId]: !isCurrentlyLiked };
      setReviewsList((currentList) =>
        currentList.map((item) => {
          if (item.id === reviewId) {
            return {
              ...item,
              helpfulCount: isCurrentlyLiked ? item.helpfulCount - 1 : item.helpfulCount + 1,
            };
          }
          return item;
        })
      );
      return updated;
    });
  };

  // Handle New Review Submission
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newReviewText.trim() || newRating < 1) {
      setFormError(
        translations.fillrequiredfields
      );
      return;
    }

    const initials = newName
      .trim()
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "VG";

    const randomOrderNum = Math.floor(10850 + Math.random() * 500);

    const createdReview = {
      id: Date.now(),
      customerName: newName.trim(),
      avatarInitials: initials,
      avatarBg: "linear-gradient(135deg, #028802 0%, #69e869 100%)",
      verifiedBadge: `${translations.verifieddiner} • Web Review`,
      orderNo: `SO-${randomOrderNum}`,
      date: "Just now",
      diningType: newDiningType,
      diningLabel:
        newDiningType === "dine-in"
          ? translations.dinein
          : newDiningType === "delivery"
            ? translations.delivery
            : translations.takeaway,
      branch: brandName,
      rating: newRating,
      sentiment: newRating >= 4 ? "Exceptional" : "Good Experience",
      headline: `${newRating}-Star Dining Experience`,
      review: newReviewText.trim(),
      dishOrdered: newDish.trim() || translations.artisanpizzas,
      helpfulCount: 1,
      isUserSubmitted: true,
      ratingsBreakdown: {
        food: (newRating * 0.98).toFixed(1),
        hospitality: (newRating * 0.96).toFixed(1),
        ambiance: (newRating * 0.95).toFixed(1),
        value: (newRating * 0.94).toFixed(1),
      },
      itemsOrdered: [
        {
          name: newDish.trim() || "Artisan Specialty Selection",
          qty: 1,
          price: "$21.50",
          isVeg: true,
        },
      ],
      managerResponse: {
        author: `${brandName} Management`,
        date: "Just now",
        message: `Thank you ${newName.trim()}! We value your feedback and look forward to welcoming you back soon!`,
      },
    };

    setReviewsList((prev) => [createdReview, ...prev]);
    setSubmitSuccess(true);
    setFormError("");

    setTimeout(() => {
      setSubmitSuccess(false);
      setIsWriteModalOpen(false);
      setNewName("");
      setNewDish("");
      setNewReviewText("");
      setNewRating(5);
    }, 1500);
  };



  // Helper to render Star icons
  const renderStars = (ratingCount) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingCount) {
        stars.push(<StarIcon key={i} className="star-gold" fontSize="inherit" />);
      } else if (i - 0.5 <= ratingCount) {
        stars.push(<StarHalfIcon key={i} className="star-gold" fontSize="inherit" />);
      } else {
        stars.push(<StarBorderIcon key={i} className="star-muted" fontSize="inherit" />);
      }
    }
    return stars;
  };

  // Hide reviews section if loading is complete and no reviews exist for this business
  if (!loading && (!reviewsList || reviewsList.length === 0)) {
    return null;
  }

  return (
    <section className="home-reviews-section" id="guest-reviews">
      <div className="home-reviews-container">
        {/* Section Header: Left-aligned info matching other sections */}
        <div className="reviews-header-block">
          <div className="reviews-header-info">
            <div className="reviews-pill-tag">
              <SparklesIcon fontSize="inherit" />
              <span>{translations.customerreviewstag}</span>
            </div>
            <h2 className="reviews-main-title">
              {translations.customerreviewstitle}
            </h2>
            <p className="reviews-subtitle">
              {translations.customerreviewssubtitle}
            </p>
          </div>
        </div>

        {/* Reviews Horizontal Carousel with Floating Left and Right Side Buttons (Same as Menu Showcase) */}
        <div className="carousel-track-wrapper reviews-carousel-wrapper">
          {/* Floating Left Arrow Button */}
          <button
            type="button"
            className="carousel-side-arrow-btn left"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            aria-label="Scroll reviews left"
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
            aria-label="Scroll reviews right"
            title="Scroll right"
          >
            <ChevronRightIcon />
          </button>

          <div
            className="carousel-scroll-track reviews-cards-grid"
            ref={scrollTrackRef}
            onScroll={updateScrollButtons}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            {reviewsList.map((item) => {
              return (
                <article
                  key={item.id || item._id}
                  className="review-card"
                  id={`review-card-${item.id || item._id}`}
                >
                  {/* Card Header: Customer Info */}
                  <div className="review-card-header">
                    <div
                      className="customer-avatar"
                      style={{ background: item.avatarBg }}
                    >
                      {item.avatarInitials}
                    </div>
                    <div className="customer-text-meta">
                      <div className="customer-name-row">
                        <span className="customer-name" title={item.customerName}>
                          {item.customerName}
                        </span>
                      </div>
                      <div className="customer-sub-meta">
                        <span className="review-branch" title={item.branch}>
                          {item.branch}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="review-meta-strip">
                    <div className="rating-cluster-left">
                      <div className="stars-cluster">{renderStars(item.rating)}</div>
                      <span className="rating-numeric">{(Number(item.rating) || 5).toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Body Text */}
                  <p className="review-body-text">{item.review}</p>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================
          DETAILED REVIEW MODAL DIALOG (SHOWS FULL REVIEW DETAILS)
          ======================================================================== */}
      {activeReviewDetails && (
        <div
          className="review-modal-backdrop"
          onClick={() => setActiveReviewDetails(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div
            className="review-modal-card"
            onClick={(e) => e.stopPropagation()}
            id="review-details-modal"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-left">
                <div
                  className="modal-avatar"
                  style={{ background: activeReviewDetails.avatarBg }}
                >
                  {activeReviewDetails.avatarInitials}
                </div>
                <div className="modal-customer-info">
                  <div className="modal-name-row">
                    <h3 id="review-modal-title" className="modal-customer-name">
                      {activeReviewDetails.customerName}
                    </h3>
                    <span className="modal-verified-pill">
                      <CheckCircleIcon fontSize="inherit" />
                      <span>{activeReviewDetails.verifiedBadge}</span>
                    </span>
                  </div>
                  <div className="modal-meta-row">
                    <span>
                      <ReceiptLongIcon fontSize="inherit" />
                      {translations.orderno}: #{activeReviewDetails.orderNo}
                    </span>
                    <span className="meta-separator">•</span>
                    <span>
                      <AccessTimeIcon fontSize="inherit" />
                      {activeReviewDetails.date}
                    </span>
                    <span className="meta-separator">•</span>
                    <span>
                      <LocationOnIcon fontSize="inherit" />
                      {activeReviewDetails.branch}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveReviewDetails(null)}
                aria-label="Close review details"
              >
                <CloseIcon fontSize="inherit" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="modal-body-scrollable">
              {/* Overall Score & Dining Channel */}
              <div className="modal-score-banner">
                <div className="modal-score-left">
                  <div className="modal-stars-wrap">
                    {renderStars(activeReviewDetails.rating)}
                  </div>
                  <span className="modal-rating-num">{activeReviewDetails.rating}.0 / 5.0</span>
                  <span className="modal-sentiment-tag">{activeReviewDetails.sentiment}</span>
                </div>

                <div className="modal-channel-badge">
                  {activeReviewDetails.diningType === "dine-in" && (
                    <TableRestaurantIcon fontSize="inherit" />
                  )}
                  {activeReviewDetails.diningType === "delivery" && (
                    <DeliveryDiningIcon fontSize="inherit" />
                  )}
                  {activeReviewDetails.diningType === "takeaway" && (
                    <TakeoutDiningIcon fontSize="inherit" />
                  )}
                  <span>{activeReviewDetails.diningLabel}</span>
                </div>
              </div>

              {/* Full Review Text with Headline */}
              <div className="modal-review-text-section">
                <h4 className="modal-headline">{activeReviewDetails.headline}</h4>
                <div className="modal-quote-wrapper">
                  <FormatQuoteIcon className="modal-quote-icon" />
                  <p className="modal-full-review-content">{activeReviewDetails.review}</p>
                </div>
              </div>

              {/* Experience Criteria Ratings Breakdown */}
              <div className="modal-criteria-section">
                <h5 className="section-title">
                  {translations.ratingsbreakdown}
                </h5>
                <div className="criteria-grid">
                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.foodquality}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.food} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill green-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.food / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.servicehospitality}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.hospitality} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill blue-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.hospitality / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.ambiance}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.ambiance} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill purple-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.ambiance / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.valueformoney}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.value} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill amber-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.value / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items in this Order */}
              {activeReviewDetails.itemsOrdered && activeReviewDetails.itemsOrdered.length > 0 && (
                <div className="modal-items-section">
                  <h5 className="section-title">
                    {translations.itemsordered}
                  </h5>
                  <div className="items-list">
                    {activeReviewDetails.itemsOrdered.map((dish, idx) => (
                      <div key={idx} className="item-row">
                        <div className="item-left">
                          <span
                            className={`diet-dot ${dish.isVeg ? "veg" : "non-veg"}`}
                            title={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                          />
                          <span className="dish-qty">{dish.qty}x</span>
                          <span className="dish-name">{dish.name}</span>
                        </div>
                        <span className="dish-price">{dish.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Restaurant Manager / Chef Response */}
              {activeReviewDetails.managerResponse && (
                <div className="modal-response-box">
                  <div className="response-header-row">
                    <div className="response-author-col">
                      <ReplyIcon fontSize="inherit" className="reply-icon" />
                      <span className="response-title">
                        {translations.restaurantresponse}
                      </span>
                      <span className="author-pill">
                        {activeReviewDetails.managerResponse.author}
                      </span>
                    </div>
                    <span className="response-date">
                      {activeReviewDetails.managerResponse.date}
                    </span>
                  </div>
                  <p className="response-message-text">
                    "{activeReviewDetails.managerResponse.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className={`modal-helpful-btn ${likedReviews[activeReviewDetails.id] ? "liked" : ""
                  }`}
                onClick={(e) => handleToggleHelpful(activeReviewDetails.id, e)}
              >
                {likedReviews[activeReviewDetails.id] ? (
                  <ThumbUpIcon fontSize="inherit" />
                ) : (
                  <ThumbUpOutlinedIcon fontSize="inherit" />
                )}
                <span>
                  {translations.helpful} ({activeReviewDetails.helpfulCount})
                </span>
              </button>

              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setActiveReviewDetails(null)}
              >
                {translations.closereview}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          "WRITE A REVIEW" INTERACTIVE MODAL DIALOG
          ======================================================================== */}
      {isWriteModalOpen && (
        <div
          className="review-modal-backdrop"
          onClick={() => setIsWriteModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="write-review-title"
        >
          <div
            className="write-modal-card"
            onClick={(e) => e.stopPropagation()}
            id="write-review-modal"
          >
            <div className="write-modal-header">
              <div>
                <h3 id="write-review-title" className="write-modal-title">
                  {translations.shareyourfeedback}
                </h3>
                <p className="write-modal-desc">
                  {translations.sharefeedbacksubtitle}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsWriteModalOpen(false)}
                aria-label="Close"
              >
                <CloseIcon fontSize="inherit" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="write-success-state">
                <CheckCircleIcon className="success-icon" />
                <h4>{translations.reviewsubmittedsuccess}</h4>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="write-review-form" noValidate>
                {formError && <div className="form-error-banner">{formError}</div>}

                {/* Rating Picker */}
                <div className="form-rating-picker-block">
                  <label className="field-label">
                    {translations.yourrating} <span className="req">*</span>
                  </label>
                  <div className="rating-interactive-stars">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`star-pick-btn ${(hoverRating || newRating) >= val ? "filled" : ""
                          }`}
                        onMouseEnter={() => setHoverRating(val)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setNewRating(val)}
                        aria-label={`${val} Star`}
                      >
                        <StarIcon fontSize="large" />
                      </button>
                    ))}
                    <span className="rating-hint-text">
                      {hoverRating || newRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name & Dining Type Row */}
                <div className="form-two-col-row">
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="review-name">
                      {translations.yourname} <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="review-name"
                      placeholder={translations.enteryourname}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="form-text-input"
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label" htmlFor="review-dining-type">
                      {translations.diningtype}
                    </label>
                    <select
                      id="review-dining-type"
                      className="form-select-input"
                      value={newDiningType}
                      onChange={(e) => setNewDiningType(e.target.value)}
                    >
                      <option value="dine-in">{translations.dinein}</option>
                      <option value="delivery">{translations.delivery}</option>
                      <option value="takeaway">{translations.takeaway}</option>
                    </select>
                  </div>
                </div>

                {/* Favorite Dish */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="review-dish">
                    {translations.yourfavoritedish}
                  </label>
                  <input
                    type="text"
                    id="review-dish"
                    placeholder={
                      translations.enteryourfavoritedish
                    }
                    value={newDish}
                    onChange={(e) => setNewDish(e.target.value)}
                    className="form-text-input"
                  />
                </div>

                {/* Review Text */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="review-text">
                    {translations.yourreviewtext} <span className="req">*</span>
                  </label>
                  <textarea
                    id="review-text"
                    rows={4}
                    placeholder={
                      translations.enteryourreview
                    }
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="form-textarea-input"
                    required
                  />
                </div>

                {/* Submit Action */}
                <div className="write-form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsWriteModalOpen(false)}
                  >
                    {translations.cancel}
                  </button>
                  <button type="submit" className="submit-btn" id="submit-review-action">
                    <span>{translations.submitreview}</span>
                    <ArrowForwardIcon fontSize="inherit" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeReviews;