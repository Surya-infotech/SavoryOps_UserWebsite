import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import RestaurantMenuOutlinedIcon from "@mui/icons-material/RestaurantMenuOutlined";
import TableRestaurantOutlinedIcon from "@mui/icons-material/TableRestaurantOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import {
  getNotifications,
  markAsRead,
  clearAllNotifications,
  deleteNotification,
  formatTimeAgo,
  subscribeToNotifications,
} from "../../utils/notificationService.js";
import "../../Scss/Pages/Notifications/notificationspage.scss";

const getNotificationIcon = (type) => {
  switch (type) {
    case "order":
      return <RestaurantMenuOutlinedIcon className="notif-page-type-icon order-icon" />;
    case "table":
      return <TableRestaurantOutlinedIcon className="notif-page-type-icon table-icon" />;
    case "offer":
      return <LocalOfferOutlinedIcon className="notif-page-type-icon offer-icon" />;
    case "reservation":
      return <EventAvailableOutlinedIcon className="notif-page-type-icon reservation-icon" />;
    default:
      return <InfoOutlinedIcon className="notif-page-type-icon general-icon" />;
  }
};

const getNotificationTypeLabel = (type, translations = {}) => {
  switch (type) {
    case "order":
      return translations.orders || "Order";
    case "table":
      return translations.table || "Table";
    case "offer":
      return translations.offers || "Special Offer";
    case "reservation":
      return translations.tablereservation || "Reservation";
    default:
      return translations.notification || "Notification";
  }
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname || "";

  const [notificationList, setNotificationList] = useState(() => getNotifications());
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  // Dynamic document title
  useEffect(() => {
    const pageTitle = translations.notifications || "Notifications";
    if (businessDisplayName) {
      document.title = `${pageTitle} | ${businessDisplayName}`;
    } else {
      document.title = pageTitle;
    }
    return () => {
      if (businessDisplayName) {
        document.title = businessDisplayName;
      }
    };
  }, [translations, businessDisplayName]);

  // Sync state with backend server, storage, and real-time window events
  useEffect(() => {
    return subscribeToNotifications(setNotificationList, { pollIntervalMs: 60000 });
  }, []);

  // Close confirmation modal on Escape
  useEffect(() => {
    if (!isClearAllModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isClearingAll) {
        setIsClearAllModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isClearAllModalOpen, isClearingAll]);

  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.url) {
      navigate(item.url);
    }
  };

  const handleOpenClearAllModal = () => {
    setIsClearAllModalOpen(true);
  };

  const handleConfirmClearAll = async () => {
    if (isClearingAll) return;
    setIsClearingAll(true);
    try {
      await clearAllNotifications();
    } finally {
      setIsClearingAll(false);
      setIsClearAllModalOpen(false);
    }
  };

  const handleDeleteItem = (e, id) => {
    e.stopPropagation();
    deleteNotification(id);
  };

  const breadcrumbItems = [
    { label: translations.home || "Home", path: "/" },
    { label: translations.notifications || "Notifications" },
  ];

  return (
    <div className={`notifications-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs - Exact design and position as Profile & Orders */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="notifications-page-container">
        <div className="notifications-page-content">
          {/* Actions bar when notifications exist */}
          {notificationList.length > 0 && (
            <div className="notifications-top-actions">
              <button
                type="button"
                className="notif-action-btn clear-all-btn"
                onClick={handleOpenClearAllModal}
              >
                <DeleteOutlineOutlinedIcon fontSize="small" />
                <span>{translations.clearall || "Clear all"}</span>
              </button>
            </div>
          )}

          {/* Notifications List or Empty State - Exact Parity with Orders Page */}
          {notificationList.length === 0 ? (
            <div className="address-empty-card notifications-empty-state">
              <div className="empty-icon-wrap">
                <NotificationsOutlinedIcon className="empty-icon" />
              </div>
              <h2 className="empty-title">
                {translations.nonotificationsfound ||
                  translations.nonotifications ||
                  "No notifications yet."}
              </h2>
              <p className="empty-subtitle">
                {translations.nonotificationsdesc ||
                  "Your notification history will appear here once you receive updates. Explore our main menu to discover delicious treats!"}
              </p>
              <Link to="/menu" className="empty-add-btn">
                <RestaurantMenuIcon fontSize="small" />
                <span>{translations.exploremenu || "Explore Menu"}</span>
              </Link>
            </div>
          ) : (
            <div className="notifications-list-grid">
              {notificationList.map((item) => (
                <div
                  key={item.id}
                  className={`notification-page-card ${!item.isRead ? "unread" : "read"} ${item.type || "general"
                    }`}
                  onClick={() => handleItemClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      handleItemClick(item);
                    }
                  }}
                >
                  <div className="card-accent-bar" />
                  <div className="card-main-content">
                    <div className="card-top-row">
                      <div className="card-top-left">
                        <div className="card-icon-area">
                          <div className="notif-avatar-circle">{getNotificationIcon(item.type)}</div>
                        </div>
                        <span className="card-type-tag">
                          {getNotificationTypeLabel(item.type, translations)}
                        </span>
                      </div>
                      <span className="card-timestamp">
                        {formatTimeAgo(item.createdAt, item.createdAtFormatted)}
                      </span>
                    </div>

                    <div className="card-body-area">
                      <h4 className="card-title">
                        {item.title}
                        {!item.isRead && <span className="card-unread-dot" />}
                      </h4>

                      {item.message && <p className="card-message">{item.message}</p>}

                      <div className="card-bottom-row">
                        {item.url && (
                          <span className="card-action-link">
                            <span>{translations.viewdetails || "View Details"}</span>
                            <ArrowForwardIcon fontSize="inherit" className="arrow-icon" />
                          </span>
                        )}

                        <button
                          type="button"
                          className="card-delete-btn"
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          title={translations.delete || "Delete"}
                          aria-label={translations.delete || "Delete"}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {isClearAllModalOpen && (
        <div
          className="notifications-delete-modal-overlay"
          onClick={() => !isClearingAll && setIsClearAllModalOpen(false)}
        >
          <div
            className="delete-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-all-notifications-title"
          >
            <div className="delete-icon-box">
              <DeleteOutlineOutlinedIcon className="delete-icon" />
            </div>
            <h3 id="clear-all-notifications-title" className="delete-modal-title">
              {translations.clearallnotifications || "Delete All Notifications?"}
            </h3>
            <p className="delete-modal-text">
              {translations.clearallnotificationsconfirm ||
                "Are you sure you want to delete all notifications? This action cannot be undone."}
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={() => setIsClearAllModalOpen(false)}
                disabled={isClearingAll}
              >
                {translations.cancel || "Cancel"}
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmClearAll}
                disabled={isClearingAll}
              >
                {isClearingAll ? (
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

export default NotificationsPage;