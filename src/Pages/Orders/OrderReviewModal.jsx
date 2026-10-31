import React, { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CircularProgress from "@mui/material/CircularProgress";
import RateReviewIcon from "@mui/icons-material/RateReview";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import "../../Scss/Pages/Orders/orderreviewmodal.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

const OrderReviewModal = ({
  isOpen,
  onClose,
  order,
  isEdit = false,
  existingReview = null,
  onReviewSubmitted,
  onReviewDeleted,
  showSnackbar,
  translations = {},
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (isEdit && existingReview) {
        setRating(existingReview.rating || 0);
        setReviewText(existingReview.review || "");
      } else {
        setRating(0);
        setReviewText("");
      }
      setHoverRating(0);
      setErrorMsg("");
      setShowDeleteConfirm(false);
    }
  }, [isOpen, isEdit, existingReview]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (rating === 0) {
      setErrorMsg(translations.pleaseselectrating || "Please select a rating of 1 to 5 stars.");
      return;
    }

    if (!reviewText.trim()) {
      setErrorMsg(translations.pleaseenterreview || "Please enter your review text.");
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        isEdit && existingReview?._id
          ? `${adminPanelBackendPath}/Website/Order/UpdateOrderReview/${order._id}/${order.ownerid}/${existingReview._id}`
          : `${adminPanelBackendPath}/Website/Order/SaveOrderReview/${order._id}/${order.ownerid}`;

      const response = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "admin",
        },
        body: JSON.stringify({
          rating,
          review: reviewText.trim(),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const successMessage = isEdit
          ? translations.yourreviewupdated || "Your review has been updated successfully."
          : translations.yourreviewsubmitted || "Your review has been submitted successfully.";
        showSnackbar(successMessage, "success");
        onReviewSubmitted(data.review || { rating, review: reviewText.trim(), updatedAt: new Date().toISOString() });
        onClose();
      } else {
        const err = data.message || (isEdit ? "Failed to update review" : "Failed to submit review");
        setErrorMsg(err);
        showSnackbar(err, "error");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      const msg = translations.somethingWentWrong || "Something went wrong. Please try again.";
      setErrorMsg(msg);
      showSnackbar(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview?._id) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Order/DeleteOrderReview/${order._id}/${order.ownerid}/${existingReview._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        showSnackbar(
          translations.yourreviewdeleted || "Your review has been deleted successfully.",
          "success"
        );
        onReviewDeleted();
        onClose();
      } else {
        const err = data.message || translations.failedtodeletereview || "Failed to delete review";
        showSnackbar(err, "error");
      }
    } catch (err) {
      console.error("Error deleting review:", err);
      showSnackbar(translations.somethingWentWrong || "Something went wrong.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="order-review-modal-backdrop" onClick={onClose}>
      <div
        className="order-review-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <RateReviewIcon className="modal-header-icon" />
            <h3>
              {isEdit
                ? translations.editreview || "Edit Review"
                : translations.writeareview || "Write a Review"}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="review-order-summary">
              <span className="order-tag">Order #{order.orderno}</span>
              <span className="restaurant-name">{order.businessname}</span>
            </div>

            {/* Star Rating Section */}
            <div className="rating-selector-wrap">
              <label className="rating-label">
                {translations.yourrating || "Your Overall Rating"}
              </label>
              <div
                className="stars-row"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((starValue) => {
                  const isFilled =
                    hoverRating > 0
                      ? starValue <= hoverRating
                      : starValue <= rating;
                  return (
                    <button
                      key={starValue}
                      type="button"
                      className="star-btn"
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      aria-label={`${starValue} Stars`}
                    >
                      {isFilled ? (
                        <StarIcon className="star-icon filled" />
                      ) : (
                        <StarBorderIcon className="star-icon outline" />
                      )}
                    </button>
                  );
                })}
              </div>
              <span className="rating-hint">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent!"}
              </span>
            </div>

            {/* Review Comment Area */}
            <div className="review-input-group">
              <label htmlFor="reviewTextArea">
                {translations.yourreviewtext || "Your Review & Feedback"}
              </label>
              <textarea
                id="reviewTextArea"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={
                  translations.enteryourreview ||
                  "Tell us about the flavors, presentation, staff hospitality, and overall experience..."
                }
                maxLength={1000}
              />
              <div className="char-count">{reviewText.length} / 1000</div>
            </div>

            {errorMsg && <div className="form-error-banner">{errorMsg}</div>}

            {showDeleteConfirm && (
              <div className="delete-confirm-box">
                <p>Are you sure you want to permanently delete this review?</p>
                <div className="delete-confirm-actions">
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      "Yes, Delete"
                    )}
                  </button>
                  <button
                    type="button"
                    className="secondary-btn small"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            {isEdit && !showDeleteConfirm && (
              <button
                type="button"
                className="delete-link-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <DeleteOutlineIcon fontSize="small" />
                <span>{translations.deletereview || "Delete Review"}</span>
              </button>
            )}

            <div className="footer-right-actions">
              <button
                type="button"
                className="secondary-btn"
                onClick={onClose}
                disabled={isSubmitting || isDeleting}
              >
                {translations.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                className="primary-btn"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : isEdit ? (
                  translations.update || "Update Review"
                ) : (
                  translations.submitreview || "Submit Review"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderReviewModal;