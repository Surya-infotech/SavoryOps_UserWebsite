import React from "react";
import CloseIcon from "@mui/icons-material/Close";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import HistoryIcon from "@mui/icons-material/History";
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
  if (!isOpen || !order) return null;

  const sortedStatusLogs = order.statusLogs
    ? [...order.statusLogs].sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      )
    : [];

  return (
    <div className="order-history-modal-backdrop" onClick={onClose}>
      <div
        className="order-history-modal-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <HistoryIcon className="modal-header-icon" />
            <h3>{translations.orderstatushistory || "Order Status History"}</h3>
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

        <div className="modal-body">
          {sortedStatusLogs.length > 0 ? (
            <div className="status-timeline">
              {sortedStatusLogs.map((log, index) => {
                const statusColor = getOrderStatusColor(log.newStatus);
                const isLatest = index === 0;

                return (
                  <div key={index} className="timeline-item">
                    <div className="timeline-rail">
                      <div
                        className={`timeline-dot ${isLatest ? "is-latest" : ""}`}
                        style={{ backgroundColor: statusColor }}
                      />
                      {index < sortedStatusLogs.length - 1 && (
                        <div className="timeline-line" />
                      )}
                    </div>
                    <div
                      className="timeline-content"
                      style={{ borderLeftColor: statusColor }}
                    >
                      <div className="timeline-status-badge">
                        <span
                          className="status-pill"
                          style={{
                            backgroundColor: `${statusColor}18`,
                            color: statusColor,
                            borderColor: `${statusColor}40`,
                          }}
                        >
                          <OrderStatusIcon status={log.newStatus} fontSize="inherit" />
                          <span>{translations[log.newStatus] || log.newStatus}</span>
                        </span>
                        {isLatest && (
                          <span className="current-badge">
                            {translations.current || "Current"}
                          </span>
                        )}
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
                {translations.nostatushistoryfound ||
                  "No status history recorded for this order yet."}
              </p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="secondary-btn" onClick={onClose}>
            {translations.close || "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusHistoryModal;