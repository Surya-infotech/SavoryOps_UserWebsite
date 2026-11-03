import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import {
  getReservationStatusConfig,
  formatReservationDateTime,
} from "./reservationHelpers.js";
import "../../Scss/Pages/Orders/orderstatushistorymodal.scss";

const ReservationStatusIcon = ({ iconType, fontSize = "inherit" }) => {
  switch (iconType) {
    case "schedule":
      return <ScheduleIcon fontSize={fontSize} />;
    case "check":
      return <CheckCircleOutlinedIcon fontSize={fontSize} />;
    case "seat":
      return <EventSeatIcon fontSize={fontSize} />;
    case "cancel":
      return <CancelOutlinedIcon fontSize={fontSize} />;
    case "person_off":
      return <PersonOffOutlinedIcon fontSize={fontSize} />;
    default:
      return <InfoOutlinedIcon fontSize={fontSize} />;
  }
};

const ReservationStatusHistoryModal = ({
  isOpen,
  onClose,
  reservation,
  dateFormat,
  timeFormat,
  timeZone,
  translations = {},
}) => {
  const { isRtl } = useLanguage();

  if (!isOpen || !reservation) return null;

  const sortedStatusLogs = reservation.statusLogs
    ? [...reservation.statusLogs].sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
    )
    : [];

  const reservationNo = reservation.reservationid || "";

  return (
    <div
      className={`order-history-modal-backdrop ${isRtl ? "is-rtl" : ""}`}
      onClick={onClose}
    >
      <div
        className="order-history-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reservation-history-title"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-header-icon-box">
              <HistoryIcon className="modal-header-icon" />
            </div>
            <div className="modal-title-text">
              <h3 id="reservation-history-title">
                {translations.reservationstatushistory}
              </h3>
              {reservationNo && (
                <span className="modal-orderno-badge">
                  {translations.reservationNo} #{reservationNo}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={translations.close}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        <div className="modal-body">
          {sortedStatusLogs.length > 0 ? (
            <div className="status-timeline">
              {sortedStatusLogs.map((log, index) => {
                const statusConfig = getReservationStatusConfig(
                  log.newStatus,
                  translations
                );

                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-rail">
                      <div
                        className="timeline-dot"
                        style={{
                          backgroundColor: statusConfig.color,
                          boxShadow: `0 0 0 2.5px #ffffff, 0 0 0 4px ${statusConfig.color}40`,
                        }}
                      />
                      {index < sortedStatusLogs.length - 1 && (
                        <div className="timeline-line" />
                      )}
                    </div>
                    <div className="timeline-content-card">
                      <div className="timeline-status-header">
                        <span
                          className="status-pill"
                          style={{
                            backgroundColor: `${statusConfig.color}14`,
                            color: statusConfig.color,
                            borderColor: `${statusConfig.color}35`,
                          }}
                        >
                          <ReservationStatusIcon
                            iconType={statusConfig.iconType}
                            fontSize="inherit"
                          />
                          <span>{statusConfig.label}</span>
                        </span>
                      </div>
                      <div className="timeline-timestamp">
                        <AccessTimeIcon fontSize="inherit" />
                        <span>
                          {formatReservationDateTime(
                            log.updatedAt,
                            dateFormat,
                            timeFormat,
                            timeZone
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-history-state">
              <AccessTimeIcon className="empty-history-icon" />
              <p>
                {translations.nostatushistory}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="modal-close-submit-btn"
            onClick={onClose}
          >
            {translations.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservationStatusHistoryModal;