import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import CalendarTodayOutlinedIcon from "@mui/icons-material/CalendarTodayOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import FormatQuoteRoundedIcon from "@mui/icons-material/FormatQuoteRounded";
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

const MyReviewsPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { translations = {}, isRtl } = useLanguage();

  const [reviews, setReviews] = useState([]);
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
    return (localStorage.getItem(customerIdName));
  };

  const getToken = () => {
    return (localStorage.getItem(customerTokenName));
  };

  // Fetch reviews using the separate website route powered by the user app's controller
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
        const response = await fetch(`${adminPanelBackendPath}/Website/Profile/GetMyReviews/${customerId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-user": "customer", "Authorization": `Bearer ${token}` }
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

  // Open Edit Modal for a specific review
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

  // Open Delete Confirmation Modal
  const handlePromptDelete = (review) => {
    setReviewToDelete(review);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete Review
  const handleConfirmDelete = async () => {
    if (!reviewToDelete) return;
    setIsDeleting(true);

    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Order/DeleteOrderReview/${reviewToDelete._id}/${reviewToDelete.ownerid}/${reviewToDelete._id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json", "x-user": "admin", },
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
      {/* Unified Site Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: translations.home || "Home", path: "/" },
          { label: translations.myreviews || "My Reviews" },
        ]}
      />

      <div className="my-reviews-container">
        {/* Page Header */}
        <div className="my-reviews-header">
          <div className="header-titles">
            <h1 className="page-title">{translations.myreviews || "My Reviews"}</h1>
            <p className="page-subtitle">
              {translations.reviewssubtitle ||
                "Check your past dining reviews, dish ratings, and culinary feedback."}
            </p>
          </div>

          <div className="header-actions">
            {!loading && reviews.length > 0 && (
              <span className="reviews-count-badge">
                {reviews.length}{" "}
                {reviews.length === 1
                  ? translations.review || "Review"
                  : translations.reviews || "Reviews"}
              </span>
            )}
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

        {/* Content Body */}
        {loading && !refreshing ? (
          /* Loading Shimmer State */
          <div className="my-reviews-shimmer-list">
            {[1, 2, 3].map((item) => (
              <div key={item} className="review-shimmer-card">
                <div className="shimmer-header">
                  <div className="shimmer-business">
                    <div className="shimmer-icon shimmer-wave" />
                    <div className="shimmer-text shimmer-wave" />
                  </div>
                  <div className="shimmer-stars">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div key={s} className="shimmer-star shimmer-wave" />
                    ))}
                  </div>
                </div>
                <div className="shimmer-meta">
                  <div className="shimmer-order shimmer-wave" />
                  <div className="shimmer-date shimmer-wave" />
                </div>
                <div className="shimmer-body">
                  <div className="shimmer-line shimmer-line-full shimmer-wave" />
                  <div className="shimmer-line shimmer-line-partial shimmer-wave" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          /* Empty State - Matching User App */
          <div className="my-reviews-empty-card">
            <div className="empty-icon-wrap">
              <RateReviewOutlinedIcon className="empty-icon" />
            </div>
            <h2 className="empty-title">
              {translations.noReviews || "No Reviews Yet"}
            </h2>
            <p className="empty-subtitle">
              {translations.noReviewsMessage ||
                "You haven't written any reviews yet. Share your experience with your favorite restaurants!"}
            </p>
            <Link to="/menu" className="empty-action-btn">
              <RestaurantMenuIcon fontSize="small" />
              <span>{translations.exploremenu || "Explore Menu"}</span>
            </Link>
          </div>
        ) : (
          /* Reviews List - 1:1 Design Parity with User App */
          <div className="my-reviews-list">
            {reviews.map((rev) => {
              const displayName = rev.branchname
                ? rev.businessname
                  ? `${rev.branchname} (${rev.businessname})`
                  : rev.branchname
                : rev.businessname || "Restaurant Review";

              return (
                <div key={rev._id} className="review-card">
                  {/* Card Header */}
                  <div className="review-card-header">
                    <div className="business-info">
                      <StorefrontIcon className="business-icon" />
                      <h3 className="business-name" title={displayName}>
                        {displayName}
                      </h3>
                    </div>

                    <div className="header-meta-group">
                      <div
                        className="rating-stars"
                        aria-label={`Rating: ${rev.rating} out of 5 stars`}
                      >
                        {renderStars(rev.rating)}
                      </div>

                      <div className="card-actions">
                        <Tooltip title={translations.editreview || "Edit Review"} arrow>
                          <button
                            type="button"
                            className="action-btn edit-btn"
                            onClick={() => handleOpenEdit(rev)}
                            aria-label="Edit review"
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </button>
                        </Tooltip>
                        <Tooltip title={translations.deletereview || "Delete Review"} arrow>
                          <button
                            type="button"
                            className="action-btn delete-btn"
                            onClick={() => handlePromptDelete(rev)}
                            aria-label="Delete review"
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </button>
                        </Tooltip>
                      </div>
                    </div>
                  </div>

                  {/* Order & Date Info Row */}
                  <div className="review-order-info">
                    <div className="order-tag">
                      <ReceiptLongOutlinedIcon className="meta-icon" />
                      <span className="order-label">
                        {translations.order || "Order"}: #{rev.orderno}
                      </span>
                    </div>

                    <div className="date-tag">
                      <CalendarTodayOutlinedIcon className="meta-icon" />
                      <span className="date-text">
                        {formatOrderDateTime(
                          rev.createdAt,
                          dateFormat,
                          timeFormat,
                          timeZone
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Review Text Body */}
                  <div className="review-content">
                    <FormatQuoteRoundedIcon className="quote-icon" />
                    <p className="review-text">{rev.review}</p>
                  </div>
                </div>
              );
            })}
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

      {/* Delete Review Confirmation Modal - Design identical to OrderDetails & ManageAddress */}
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