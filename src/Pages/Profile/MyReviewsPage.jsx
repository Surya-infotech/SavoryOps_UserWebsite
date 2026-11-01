import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";

import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { formatOrderDateTime } from "../Orders/orderHelpers.js";
import "../../Scss/Pages/Profile/myreviewspage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ReviewShimmerCard = () => (
  <div className="review-shimmer-tile">
    <div className="shimmer-bar top-accent" />
    <div className="shimmer-tile-main">
      <div className="shimmer-header">
        <div className="shimmer-box badge" />
        <div className="shimmer-box stars" />
      </div>
      <div className="shimmer-restaurant-row">
        <div className="shimmer-avatar" />
        <div className="shimmer-meta">
          <div className="shimmer-box title" />
          <div className="shimmer-box subtitle" />
        </div>
      </div>
      <div className="shimmer-quote-box">
        <div className="shimmer-box line full" />
        <div className="shimmer-box line mid" />
      </div>
      <div className="shimmer-footer">
        <div className="shimmer-box date" />
      </div>
    </div>
  </div>
);

const MyReviewsPage = () => {
  const { showSnackbar } = useSnackbar();
  const { translations = {}, isRtl } = useLanguage();

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date and Time formats from user preferences/storage
  const dateFormat = localStorage.getItem("DateFormat") || "DD/MM/YYYY";
  const timeFormat = localStorage.getItem("TimeFormat") || "hh:mm A";
  const timeZone = localStorage.getItem("TimeZone") || "Asia/Kolkata";

  const getCustomerId = () => {
    return (localStorage.getItem(customerIdName));
  };

  const getToken = () => {
    return (localStorage.getItem(customerTokenName));
  };

  // Fetch reviews from website route
  const fetchMyReviews = useCallback(async () => {
    const customerId = getCustomerId();
    const token = getToken();

    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${adminPanelBackendPath}/Website/Profile/GetMyReviews/${customerId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "x-user": "customer", "Authorization": `Bearer ${token}`, },
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(Array.isArray(data) ? data : []);
      } else {
        showSnackbar(
          translations.somethingWentWrong || "Failed to load reviews.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error fetching my reviews:", error);
      showSnackbar(
        translations.somethingWentWrong || "Error fetching reviews.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showSnackbar, translations.somethingWentWrong]);

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  // Render 5 stars
  const renderStars = (rating) => {
    const stars = [];
    const normalizedRating = Math.round(Number(rating) || 0);
    for (let i = 1; i <= 5; i++) {
      if (i <= normalizedRating) {
        stars.push(<StarIcon key={i} className="star-icon star-filled" />);
      } else {
        stars.push(<StarBorderIcon key={i} className="star-icon star-empty" />);
      }
    }
    return stars;
  };

  return (
    <div className={`my-reviews-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs matching Profile & ManageAddress */}
      <Breadcrumbs
        items={[
          { label: translations.home || "Home", path: "/" },
          { label: translations.myaccount || "My Account", path: "/profile" },
          { label: translations.myreviews || "My Reviews" },
        ]}
      />

      <div className="my-reviews-container">
        {/* Content Area */}
        {loading ? (
          /* Shimmer Grid */
          <div className="my-reviews-grid">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <ReviewShimmerCard key={k} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State - Matching ManageAddress and Orders */
          <div className="my-reviews-empty-state">
            <div className="empty-icon-wrap">
              <RateReviewOutlinedIcon className="empty-illustration-icon" />
            </div>
            <h3>{translations.noReviews || "No Reviews Yet"}</h3>
            <p>
              {translations.noReviewsMessage ||
                "You haven't written any reviews yet. Share your experience with your favorite restaurants!"}
            </p>
            <Link to="/menu" className="empty-action-btn">
              <RestaurantMenuIcon fontSize="small" />
              <span>{translations.exploremenu || "Explore Menu"}</span>
            </Link>
          </div>
        ) : (
          /* Multi-column Responsive Cards Grid */
          <div className="my-reviews-grid">
            {reviews.map((rev) => (
              <div key={rev._id} className="review-card-tile">
                {/* Top Gold Accent Bar */}
                <div className="card-accent-bar" />

                <div className="review-card-main">
                  {/* 1. Header: Order # Badge & Star Rating */}
                  <div className="review-tile-header">
                    <div className="order-no-badge">
                      <ReceiptLongIcon className="order-no-icon" />
                      <span>#{rev.orderno}</span>
                    </div>

                    <div
                      className="rating-stars-container"
                      aria-label={`Rating: ${rev.rating} out of 5 stars`}
                    >
                      {renderStars(rev.rating)}
                    </div>
                  </div>

                  {/* 2. Restaurant & Branch Identity */}
                  <div className="review-restaurant-row">
                    <div className="restaurant-avatar-box">
                      <StorefrontIcon />
                    </div>
                    <div className="restaurant-meta-col">
                      <h4 className="restaurant-brand-name" title={rev.branchname}>
                        {rev.branchname}
                      </h4>
                      {rev.businessname && (
                        <div
                          className="restaurant-branch-subline"
                          title={rev.businessname}
                        >
                          <LocationOnOutlinedIcon className="branch-pin-icon" />
                          <span>{rev.businessname}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 3. Review Quote Body */}
                  <div className="review-quote-box">
                    <FormatQuoteRoundedIcon className="quote-icon" />
                    <p className="review-text-content">{rev.review}</p>
                  </div>

                  {/* 4. Footer: Date */}
                  <div className="review-tile-footer">
                    <div className="review-date-pill">
                      <CalendarMonthOutlinedIcon />
                      <span>
                        {formatOrderDateTime(
                          rev.createdAt,
                          dateFormat,
                          timeFormat,
                          timeZone
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReviewsPage;