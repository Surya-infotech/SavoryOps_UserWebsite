import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
import { useLanguage } from "../../Context/useLanguage.js";
import {
  getOrderStatusColor,
  formatOrderDateTime,
} from "./orderHelpers.js";
import OrderStatusIcon from "./OrderStatusIcon.jsx";
import "../../Scss/Pages/Orders/orderstatushistorymodal.scss";

const OrderStatusHistoryModal = ({
  isOpen,
  onClose,
  order,
  dateFormat,
  timeFormat,
  timeZone,
  translations = {},
}) => {
  const { isRtl } = useLanguage();

  if (!isOpen || !order) return null;

  const sortedStatusLogs = order.statusLogs
    ? [...order.statusLogs].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    : [];

  const orderNumber = order.orderno || order.orderNumber || (order._id ? order._id.slice(-6).toUpperCase() : "");

  return (
    <div className={`order-history-modal-backdrop ${isRtl ? "is-rtl" : ""}`} onClick={onClose}>
      <div
        className="order-history-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-history-title"
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-header-icon-box">
              <HistoryIcon className="modal-header-icon" />
            </div>
            <div className="modal-title-text">
              <h3 id="order-history-title">
                {translations.orderstatushistory}
              </h3>
              {orderNumber && (
                <span className="modal-orderno-badge">
                  {translations.orderno} #{orderNumber}
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
                const statusColor = getOrderStatusColor(log.newStatus);

                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-rail">
                      <div
                        className="timeline-dot"
                        style={{
                          backgroundColor: statusColor,
                          boxShadow: `0 0 0 2.5px #ffffff, 0 0 0 4px ${statusColor}40`,
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
                            backgroundColor: `${statusColor}14`,
                            color: statusColor,
                            borderColor: `${statusColor}35`,
                          }}
                        >
                          <OrderStatusIcon status={log.newStatus} fontSize="inherit" />
                          <span>{translations[log.newStatus] || log.newStatus}</span>
                        </span>
                      </div>
                      <div className="timeline-timestamp">
                        <AccessTimeIcon fontSize="inherit" />
                        <span>
                          {formatOrderDateTime(
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
                {translations.nostatushistoryfound}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-close-submit-btn" onClick={onClose}>
            {translations.close}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusHistoryModal;