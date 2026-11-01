import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { formatOrderDateTime } from "../Orders/orderHelpers.js";
import OrderReviewModal from "../Orders/OrderReviewModal.jsx";
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
        <div className="shimmer-actions">
          <div className="shimmer-box action" />
          <div className="shimmer-box action" />
        </div>
      </div>
    </div>
  </div>
);

const MyReviewsPage = () => {
  const { showSnackbar } = useSnackbar();
  const { translations = {}, isRtl } = useLanguage();

  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Edit Review Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [reviewToEdit, setReviewToEdit] = useState(null);

  // Delete Review Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Date and Time formats from user preferences/storage
  const dateFormat = localStorage.getItem("DateFormat") || "DD/MM/YYYY";
  const timeFormat = localStorage.getItem("TimeFormat") || "hh:mm A";
  const timeZone = localStorage.getItem("TimeZone") || "Asia/Kolkata";

  const getCustomerId = () => {
    return (
      localStorage.getItem(customerIdName) ||
      localStorage.getItem("CUSTOMER_ID") ||
      localStorage.getItem("customerId") ||
      localStorage.getItem("customerid") ||
      ""
    );
  };

  const getToken = () => {
    return (
      localStorage.getItem(customerTokenName) ||
      localStorage.getItem("savoryopscustomer_token") ||
      localStorage.getItem("token") ||
      ""
    );
  };

  // Fetch reviews from website route
  const fetchMyReviews = useCallback(
    async (isManualRefresh = false) => {
      const customerId = getCustomerId();
      const token = getToken();

      if (!customerId) {
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (isManualRefresh) {
        setRefreshing(true);
      }

      try {
        const headers = {
          "Content-Type": "application/json",
          "x-user": "customer",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        const response = await fetch(
          `${adminPanelBackendPath}/Website/Profile/GetMyReviews/${customerId}`,
          {
            method: "GET",
            headers,
          }
        );

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
        setRefreshing(false);
      }
    },
    [showSnackbar, translations.somethingWentWrong]
  );

  useEffect(() => {
    fetchMyReviews();
  }, [fetchMyReviews]);

  // Client-side search filtering
  const filteredReviews = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.trim().toLowerCase();
    return reviews.filter((item) => {
      const orderNo = String(item.orderno || "").toLowerCase();
      const branchName = String(item.branchname || "").toLowerCase();
      const businessName = String(item.businessname || "").toLowerCase();
      const reviewText = String(item.review || "").toLowerCase();
      return (
        orderNo.includes(q) ||
        branchName.includes(q) ||
        businessName.includes(q) ||
        reviewText.includes(q)
      );
    });
  }, [reviews, search]);

  // Open Edit Modal for a review
  const handleOpenEdit = (review) => {
    setReviewToEdit(review);
    setIsEditModalOpen(true);
  };

  // Callback when review is updated via OrderReviewModal
  const handleReviewUpdated = (updatedData) => {
    if (!reviewToEdit) return;
    setReviews((prev) =>
      prev.map((r) =>
        r._id === reviewToEdit._id
          ? {
            ...r,
            rating: updatedData.rating !== undefined ? updatedData.rating : r.rating,
            review: updatedData.review !== undefined ? updatedData.review : r.review,
            updatedAt: updatedData.updatedAt || new Date().toISOString(),
          }
          : r
      )
    );
    setIsEditModalOpen(false);
    setReviewToEdit(null);
  };

  // Prompt delete review
  const handlePromptDelete = (review) => {
    setReviewToDelete(review);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete review
  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Order/DeleteOrderReview/${reviewToDelete._id}/${reviewToDelete.ownerid}/${reviewToDelete._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
          },
        }
      );

      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        showSnackbar(
          translations.yourreviewdeleted || "Your review has been deleted successfully.",
          "success"
        );
        setReviews((prev) => prev.filter((r) => r._id !== reviewToDelete._id));
        setIsDeleteModalOpen(false);
        setReviewToDelete(null);
      } else {
        const err =
          data.message ||
          translations.failedtodeletereview ||
          "Failed to delete review";
        showSnackbar(err, "error");
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      showSnackbar(
        translations.somethingWentWrong || "Something went wrong.",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

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
        {/* Page Header */}
        <div className="my-reviews-page-header">
          <div className="reviews-header-meta">
            <h1 className="reviews-main-title">
              {translations.myreviews || "My Reviews"}
            </h1>
            <p className="reviews-main-subtitle">
              {translations.reviewssubtitle ||
                "Check your past dining reviews, dish ratings, and culinary feedback."}
            </p>
          </div>
        </div>

        {/* Toolbar: Search, Count Badge, Refresh */}
        {(loading || reviews.length > 0) && (
          <div className="my-reviews-toolbar">
            <div className="toolbar-left">
              {!loading && (
                <span className="reviews-count-chip">
                  {filteredReviews.length}{" "}
                  {filteredReviews.length === 1
                    ? translations.review || "Review"
                    : translations.reviews || "Reviews"}
                </span>
              )}
            </div>

            <div className="toolbar-right">
              {/* Search Box matching OrdersPage */}
              <div className="reviews-search-box">
                <SearchIcon className="search-icon" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={
                    translations.searchreviews ||
                    "Search by restaurant, order, or feedback..."
                  }
                />
                {search && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <CloseIcon fontSize="small" />
                  </button>
                )}
              </div>

              {/* Refresh Button */}
              <Tooltip title={translations.refresh || "Refresh"} arrow>
                <button
                  type="button"
                  className={`refresh-btn ${refreshing ? "is-refreshing" : ""}`}
                  onClick={() => fetchMyReviews(true)}
                  disabled={loading || refreshing}
                  aria-label="Refresh reviews"
                >
                  <RefreshIcon fontSize="small" />
                </button>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Content Area */}
        {loading && !refreshing ? (
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
        ) : filteredReviews.length === 0 ? (
          /* Search Empty State */
          <div className="my-reviews-empty-state search-empty">
            <div className="empty-icon-wrap search">
              <SearchOffIcon className="empty-illustration-icon" />
            </div>
            <h3>{translations.noreviewsfound || "No reviews found"}</h3>
            <p>
              {translations.nosearchresultsfound ||
                "No reviews match your search criteria. Try a different query."}
            </p>
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearch("")}
            >
              {translations.clearsearch || "Clear Search Filter"}
            </button>
          </div>
        ) : (
          /* Multi-column Responsive Cards Grid */
          <div className="my-reviews-grid">
            {filteredReviews.map((rev) => (
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
                      className="rating-badge"
                      title={`${rev.rating} / 5`}
                      aria-label={`Rating: ${rev.rating} out of 5 stars`}
                    >
                      <div className="stars-group">
                        {renderStars(rev.rating)}
                      </div>
                      <span className="rating-number">{Number(rev.rating).toFixed(1)}</span>
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

                  {/* 4. Footer: Date & Actions (Edit & Delete) */}
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

                    <div className="card-actions-group">
                      <Tooltip title={translations.editreview || "Edit Review"} arrow>
                        <button
                          type="button"
                          className="card-action-btn edit"
                          onClick={() => handleOpenEdit(rev)}
                          aria-label="Edit review"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </button>
                      </Tooltip>
                      <Tooltip title={translations.deletereview || "Delete Review"} arrow>
                        <button
                          type="button"
                          className="card-action-btn delete"
                          onClick={() => handlePromptDelete(rev)}
                          aria-label="Delete review"
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reusable Edit Review Modal */}
      {isEditModalOpen && reviewToEdit && (
        <OrderReviewModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setReviewToEdit(null);
          }}
          order={{
            _id: reviewToEdit._id,
            ownerid: reviewToEdit.ownerid,
            orderno: reviewToEdit.orderno,
            businessname: reviewToEdit.branchname
              ? `${reviewToEdit.branchname} (${reviewToEdit.businessname || ""})`
              : reviewToEdit.businessname || "Order Review",
          }}
          isEdit={true}
          existingReview={reviewToEdit}
          onReviewSubmitted={handleReviewUpdated}
          showSnackbar={showSnackbar}
          translations={translations}
        />
      )}

      {/* Delete Review Confirmation Dialog */}
      {isDeleteModalOpen && reviewToDelete && (
        <div
          className="delete-review-modal-overlay"
          onClick={() => !isDeleting && setIsDeleteModalOpen(false)}
        >
          <div
            className="delete-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="delete-icon-box">
              <DeleteOutlineIcon className="delete-icon" />
            </div>
            <h3 className="delete-modal-title">
              {translations.deletereviewtitle ||
                translations.deletereview ||
                "Delete Review?"}
            </h3>
            <p className="delete-modal-text">
              {translations.deletereviewconfirm ||
                "Are you sure you want to permanently delete your review for this order?"}
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                {translations.cancel || "Cancel"}
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <CircularProgress size={16} color="inherit" />
                    <span>{translations.deleting || "Deleting..."}</span>
                  </>
                ) : (
                  translations.delete || "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyReviewsPage;
