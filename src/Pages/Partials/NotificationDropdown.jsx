import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import RestaurantMenuOutlinedIcon from "@mui/icons-material/RestaurantMenuOutlined";
import TableRestaurantOutlinedIcon from "@mui/icons-material/TableRestaurantOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import {
  getNotifications,
  markAsRead,
  formatTimeAgo,
} from "../../utils/notificationService.js";

const getNotificationIcon = (type) => {
  switch (type) {
    case "order":
      return <RestaurantMenuOutlinedIcon className="notif-type-icon order-icon" />;
    case "table":
      return <TableRestaurantOutlinedIcon className="notif-type-icon table-icon" />;
    case "offer":
      return <LocalOfferOutlinedIcon className="notif-type-icon offer-icon" />;
    case "reservation":
      return <EventAvailableOutlinedIcon className="notif-type-icon reservation-icon" />;
    default:
      return <InfoOutlinedIcon className="notif-type-icon general-icon" />;
  }
};

const NotificationDropdown = ({ className = "" }) => {
  const navigate = useNavigate();
  const { translations = {} } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationList, setNotificationList] = useState(() => getNotifications());
  const dropdownRef = useRef(null);

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

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const unreadCount = useMemo(() => {
    return notificationList.filter((n) => !n.isRead).length;
  }, [notificationList]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleItemClick = (item) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    setIsOpen(false);
    if (item.url) {
      navigate(item.url);
    }
  };

  const handleViewOrders = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    navigate("/orders");
  };

  return (
    <div
      ref={dropdownRef}
      className={`notification-dropdown-wrapper ${className} ${isOpen ? "open" : ""}`}
    >
      <button
        type="button"
        className={`nav-notification-btn ${isOpen ? "active" : ""}`}
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={translations.notifications}
        aria-label={translations.notifications}
      >
        <NotificationsOutlinedIcon className="nav-notification-icon" fontSize="small" />
        {unreadCount > 0 && (
          <span className="notification-count-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown-menu" role="menu">
          {/* Header */}
          <div className="notification-dropdown-header">
            <div className="notif-header-title-wrap">
              <div className="notif-header-icon-box">
                <NotificationsOutlinedIcon fontSize="small" />
              </div>
              <h4 className="notif-header-title">{translations.notifications}</h4>
            </div>
          </div>

          {/* Body / List */}
          <div className="notification-dropdown-body">
            {notificationList.length === 0 ? (
              <div className="notification-empty-state">
                <div className="notif-empty-icon-wrap">
                  <NotificationsOutlinedIcon className="notif-empty-icon" />
                </div>
                <p className="notif-empty-title">{translations.nonotifications}</p>
                <p className="notif-empty-subtitle">{translations.allcaughtup}</p>
              </div>
            ) : (
              <div className="notification-items-list">
                {notificationList.map((item) => (
                  <div
                    key={item.id}
                    className={`notification-item ${!item.isRead ? "unread" : "read"} ${
                      item.type || "general"
                    }`}
                    onClick={() => handleItemClick(item)}
                    role="menuitem"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleItemClick(item);
                      }
                    }}
                  >
                    <div className="notif-icon-circle">{getNotificationIcon(item.type)}</div>
                    <div className="notif-content-wrap">
                      <div className="notif-title-row">
                        <span className="notif-item-title">{item.title}</span>
                      </div>
                      {item.message && <p className="notif-item-msg">{item.message}</p>}
                      <div className="notif-meta-row">
                        <span className="notif-item-time">{formatTimeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="notification-dropdown-footer">
            <button
              type="button"
              className="notif-view-orders-btn"
              onClick={handleViewOrders}
            >
              <span>{translations.vieworders}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;