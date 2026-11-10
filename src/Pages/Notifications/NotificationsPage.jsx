import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
import RestaurantIcon from "@mui/icons-material/Restaurant";
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
  const [activeTab, setActiveTab] = useState("all"); // "all" | "unread" | "order" | "reservation" | "table" | "offer"

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

  // Filter tabs config
  const tabs = useMemo(() => [
    { id: "all", label: translations.all || "All", count: notificationList.length },
    { id: "unread", label: translations.unread || "Unread", count: unreadCount },
    {
      id: "order",
      label: translations.orders || "Orders",
      count: notificationList.filter((n) => n.type === "order").length,
    },
    {
      id: "reservation",
      label: translations.tablereservation || "Reservations",
      count: notificationList.filter((n) => n.type === "reservation").length,
    },
    {
      id: "table",
      label: translations.table || "Table",
      count: notificationList.filter((n) => n.type === "table").length,
    },
    {
      id: "offer",
      label: translations.offers || "Offers",
      count: notificationList.filter((n) => n.type === "offer").length,
    },
  ], [notificationList, unreadCount, translations]);

  // Filtered notifications
  const displayedNotifications = useMemo(() => {
    if (activeTab === "all") return notificationList;
    if (activeTab === "unread") return notificationList.filter((n) => !n.isRead);
    return notificationList.filter((n) => n.type === activeTab);
  }, [notificationList, activeTab]);

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
      {/* Unified Site Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="notifications-page-container">
        {/* Header Section */}
        <div className="notifications-page-header">
          <div className="notifications-header-meta">
            <div className="notifications-title-row">
              <div className="notifications-title-icon-box">
                <NotificationsOutlinedIcon />
              </div>
              <h1 className="notifications-main-title">{translations.notifications || "Notifications"}</h1>
              {unreadCount > 0 && (
                <span className="notifications-unread-pill">
                  {unreadCount} {translations.unread || "Unread"}
                </span>
              )}
            </div>
            <p className="notifications-main-subtitle">
              {translations.notificationssubtitle ||
                "Stay updated on your live orders, reservations, tableside sessions, and exclusive restaurant rewards."}
            </p>
          </div>

          <div className="notifications-header-actions">
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
            {notificationList.length > 0 && (
              <button
                type="button"
                className="notif-action-btn clear-all-btn"
                onClick={handleClearAll}
              >
                <DeleteSweepOutlinedIcon fontSize="small" />
                <span>{translations.clearall || "Clear all"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="notifications-filter-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`notif-filter-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && <span className="tab-count-badge">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Notifications List or Empty State */}
        {displayedNotifications.length === 0 ? (
          <div className="notifications-empty-state">
            <div className="empty-state-card">
              <div className="empty-icon-ring">
                <NotificationsOutlinedIcon className="empty-icon" />
              </div>
              <h3 className="empty-title">{translations.nonotifications || "No new notifications"}</h3>
              <p className="empty-desc">
                {translations.allcaughtup || "You're all caught up!"}
              </p>
              <button
                type="button"
                className="empty-action-btn"
                onClick={() => navigate("/menu")}
              >
                <RestaurantIcon fontSize="small" />
                <span>{translations.browsemenu || "Explore Menu"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="notifications-list-grid">
            {displayedNotifications.map((item) => (
              <div
                key={item.id}
                className={`notification-page-card ${!item.isRead ? "unread" : "read"} ${
                  item.type || "general"
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
  );
};

export default NotificationsPage;