import { useState, useEffect } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CircularProgress from "@mui/material/CircularProgress";
import { useLanguage } from "../../Context/useLanguage.js";

const ReservationCancelModal = ({
  isOpen,
  onClose,
  onConfirm,
  reservationNo,
  isCancelling,
  translations = {},
}) => {
  const { isRtl } = useLanguage();
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
  };

  return (
    <div
      className={`cancel-reservation-modal-overlay ${isRtl ? "is-rtl" : ""}`}
      onClick={() => !isCancelling && onClose()}
    >
      <div
        className="cancel-reservation-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-reservation-title"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-header-icon-box danger">
              <CancelOutlinedIcon className="modal-header-icon" />
            </div>
            <div className="modal-title-text">
              <h3 id="cancel-reservation-title">
                {translations.cancelreservation || "Cancel Reservation"}
              </h3>
              {reservationNo && (
                <span className="modal-orderno-badge">
                  {translations.reservationNo || "Reservation"} #{reservationNo}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={translations.close || "Close"}
            disabled={isCancelling}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="cancel-modal-body">
          <div className="cancel-modal-warning">
            <WarningAmberIcon fontSize="small" />
            <span>
              {translations.cancellationconfirmdesc ||
                "Are you sure you want to cancel this booking? This action cannot be undone."}
            </span>
          </div>

          <div className="cancel-reason-field">
            <label htmlFor="cancel-reason-textarea">
              {translations.cancellationreason || "Reason for Cancellation"}
              <span className="required-star">*</span>
            </label>
            <textarea
              id="cancel-reason-textarea"
              className="cancel-reason-textarea"
              rows={3}
              placeholder={
                translations.entercancellationreason ||
                "e.g. Schedule conflict, feeling unwell, change of plans..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={isCancelling}
              autoFocus
            />
          </div>

          <div className="modal-footer-actions">
            <button
              type="button"
              className="dismiss-btn"
              onClick={onClose}
              disabled={isCancelling}
            >
              {translations.keepbooking || "Keep Reservation"}
            </button>
            <button
              type="submit"
              className="confirm-danger-btn"
              disabled={isCancelling || !reason.trim()}
            >
              {isCancelling ? (
                <>
                  <CircularProgress size={16} color="inherit" />
                  <span>
                    {translations.cancellingreservation || "Cancelling..."}
                  </span>
                </>
              ) : (
                <span>
                  {translations.confirmcancellation || "Confirm Cancellation"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationCancelModal;

