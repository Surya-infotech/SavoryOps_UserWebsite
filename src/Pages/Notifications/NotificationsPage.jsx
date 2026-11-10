import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
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
  markAllAsRead,
  clearAllNotifications,
  deleteNotification,
  formatTimeAgo,
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

  // Sync state with storage and window events
  const refreshNotifications = useCallback(() => {
    setNotificationList(getNotifications());
  }, []);

  useEffect(() => {
    const handleNotificationChange = (e) => {
      if (e?.detail?.notifications) {
        setNotificationList(e.detail.notifications);
      } else {
        refreshNotifications();
      }
    };

    window.addEventListener("notificationChange", handleNotificationChange);
    window.addEventListener("storage", refreshNotifications);

    return () => {
      window.removeEventListener("notificationChange", handleNotificationChange);
      window.removeEventListener("storage", refreshNotifications);
    };
  }, [refreshNotifications]);

  const unreadCount = useMemo(() => {
    return notificationList.filter((n) => !n.isRead).length;
  }, [notificationList]);

  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    if (item.url) {
      navigate(item.url);
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleClearAll = () => {
    clearAllNotifications();
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
              {unreadCount > 0 && (
                <button
                  type="button"
                  className="notif-action-btn mark-all-btn"
                  onClick={handleMarkAllRead}
                >
                  <DoneAllIcon fontSize="small" />
                  <span>{translations.markallread || "Mark all as read"}</span>
                </button>
              )}
              <button
                type="button"
                className="notif-action-btn clear-all-btn"
                onClick={handleClearAll}
              >
                <DeleteSweepOutlinedIcon fontSize="small" />
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
                    <div className="card-icon-area">
                      <div className="notif-avatar-circle">{getNotificationIcon(item.type)}</div>
                    </div>

                    <div className="card-body-area">
                      <div className="card-top-row">
                        <span className="card-type-tag">
                          {getNotificationTypeLabel(item.type, translations)}
                        </span>
                        <span className="card-timestamp">{formatTimeAgo(item.createdAt)}</span>
                      </div>

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
    </div>
  );
};

export default NotificationsPage;