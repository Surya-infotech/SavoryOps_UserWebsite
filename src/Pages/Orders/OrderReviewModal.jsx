import { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CircularProgress from "@mui/material/CircularProgress";
import RateReviewIcon from "@mui/icons-material/RateReview";
import HandleUnauthorized from "../../utils/HandleUnauthorized.jsx";
import "../../Scss/Pages/Orders/orderreviewmodal.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

const OrderReviewModal = ({
  isOpen,
  onClose,
  order,
  isEdit = false,
  existingReview = null,
  onReviewSubmitted,
  showSnackbar,
  translations = {},
}) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    }
  }, [isOpen, isEdit, existingReview]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (rating === 0) {
      setErrorMsg(translations.pleaseselectrating);
      return;
    }

    if (!reviewText.trim()) {
      setErrorMsg(translations.pleaseenterreview);
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

      const data = await response.json().catch(() => null);
      if (HandleUnauthorized(data)) {
        setIsSubmitting(false);
        return;
      }
      if (response.ok) {
        const successMessage = isEdit
          ? translations.yourreviewupdated
          : translations.yourreviewsubmitted;
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
      const msg = translations.somethingWentWrong;
      setErrorMsg(msg);
      showSnackbar(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-review-modal-backdrop" onClick={onClose}>
      <div
        className="order-review-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="order-review-modal-header modal-header">
          <div className="order-review-modal-title-wrap modal-title-wrap">
            <RateReviewIcon className="order-review-modal-header-icon modal-header-icon" />
            <h3 className="order-review-modal-title">
              {isEdit
                ? translations.editreview
                : translations.writeareview}
            </h3>
          </div>
          <button
            type="button"
            className="order-review-modal-close-btn modal-close-btn"
            onClick={onClose}
            aria-label={translations.close}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="order-review-modal-body modal-body">
            <div className="order-review-order-summary review-order-summary">
              <span className="order-review-order-tag order-tag">Order #{order.orderno}</span>
              <span className="order-review-restaurant-name restaurant-name">{order.businessname}</span>
            </div>

            {/* Star Rating Section */}
            <div className="order-review-rating-section rating-selector-wrap">
              <label className="order-review-rating-label rating-label">
                {translations.yourrating}
              </label>
              <div
                className="order-review-stars-row stars-row rating-stars"
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
                      className={`order-review-star-btn star-btn ${isFilled ? "filled active" : "empty"}`}
                      onClick={() => setRating(starValue)}
                      onMouseEnter={() => setHoverRating(starValue)}
                      aria-label={`${starValue} ${translations.stars}`}
                    >
                      {isFilled ? (
                        <StarIcon className="order-review-star-icon star-icon filled" />
                      ) : (
                        <StarBorderIcon className="order-review-star-icon star-icon outline" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="order-review-rating-badge-wrap">
                {(hoverRating || rating) > 0 ? (
                  <span className={`order-review-rating-badge rating-hint rating-caption rate-${hoverRating || rating}`}>
                    {(hoverRating || rating) === 1 && translations.poor}
                    {(hoverRating || rating) === 2 && translations.fair}
                    {(hoverRating || rating) === 3 && translations.good}
                    {(hoverRating || rating) === 4 && translations.verygood}
                    {(hoverRating || rating) === 5 && translations.excellent}
                  </span>
                ) : (
                  <span className="order-review-rating-badge rating-hint rating-caption empty">
                    {translations.tapastartorate}
                  </span>
                )}
              </div>
            </div>

            {/* Review Comment Area */}
            <div className="order-review-input-group review-input-group">
              <label htmlFor="reviewTextArea" className="order-review-input-label">
                {translations.yourreviewtext}
              </label>
              <textarea
                id="reviewTextArea"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder={translations.writereviewplaceholder}
                maxLength={1000}
                className="order-review-textarea"
              />
              <div className="order-review-char-count char-count">{reviewText.length} / 1000</div>
            </div>

            {errorMsg && <div className="order-review-error-banner form-error-banner">{errorMsg}</div>}
          </div>

          <div className="order-review-modal-footer modal-footer">
            <div className="order-review-footer-actions footer-right-actions">
              <button
                type="button"
                className="order-review-cancel-btn secondary-btn"
                onClick={onClose}
                disabled={isSubmitting}
              >
                {translations.cancel}
              </button>
              <button
                type="submit"
                className="order-review-submit-btn primary-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : isEdit ? (
                  translations.updatereview
                ) : (
                  translations.submitreview
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