import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import NotificationsOutlinedIcon from "@mui/icons-material/NotificationsOutlined";
import RestaurantMenuOutlinedIcon from "@mui/icons-material/RestaurantMenuOutlined";
import TableRestaurantOutlinedIcon from "@mui/icons-material/TableRestaurantOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import EventAvailableOutlinedIcon from "@mui/icons-material/EventAvailableOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import {
  enableCustomerPushNotifications,
  getCustomerPushStatus,
} from "../../utils/firebase.js";
import {
  getNotifications,
  markAsRead,
  clearAllNotifications,
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

const customerTokenKey = import.meta.env.VITE_CUSTOMERTOKEN_NAME;

const NotificationDropdown = ({ className = "" }) => {
  const navigate = useNavigate();
  const { translations = {} } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationList, setNotificationList] = useState(() => getNotifications());
  const [pushStatus, setPushStatus] = useState(() => getCustomerPushStatus());
  const [enablingPush, setEnablingPush] = useState(false);
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

    const syncPushStatus = () => {
      setPushStatus(getCustomerPushStatus());
    };
    window.addEventListener("savoryops_customer_push_status", syncPushStatus);
    window.addEventListener("customerAuthChange", syncPushStatus);

    return () => {
      window.removeEventListener("notificationChange", handleNotificationChange);
      window.removeEventListener("storage", refreshNotifications);
      window.removeEventListener("savoryops_customer_push_status", syncPushStatus);
      window.removeEventListener("customerAuthChange", syncPushStatus);
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
    setPushStatus(getCustomerPushStatus());
    setIsOpen((prev) => !prev);
  };

  const authToken = customerTokenKey && typeof localStorage !== "undefined" ? localStorage.getItem(customerTokenKey) : null;
  const showPushBanner = Boolean(authToken && pushStatus.status !== "registered" && pushStatus.status !== "unsupported");

  const handleEnablePush = async (e) => {
    e.stopPropagation();
    if (!authToken || enablingPush) return;
    setEnablingPush(true);
    try {
      const result = await enableCustomerPushNotifications(authToken);
      setPushStatus(getCustomerPushStatus());
      if (result.ok) {
        showSnackbar("Push notifications enabled successfully.", "success");
      } else if (result.status === "insecure_origin") {
        showSnackbar(
          `Open chrome://flags/#unsafely-treat-insecure-origin-as-secure, add ${result.origin}, and relaunch Chrome.`,
          "warning"
        );
      } else if (result.status === "permission_denied") {
        showSnackbar("Notifications are blocked in your browser site settings.", "warning");
      } else {
        showSnackbar("Could not register browser push notifications.", "error");
      }
    } finally {
      setEnablingPush(false);
    }
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

  const handleClearAll = (e) => {
    e.stopPropagation();
    clearAllNotifications();
  };

  const handleViewAllNotifications = (e) => {
    e.stopPropagation();
    setIsOpen(false);
    navigate("/notifications");
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

          {showPushBanner && (
            <div
              style={{
                padding: "8px 14px",
                backgroundColor: "#fff8eb",
                borderBottom: "1px solid #fde68a",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                fontSize: "12px",
                color: "#78350f",
              }}
            >
              <span style={{ lineHeight: 1.35 }}>
                {pushStatus.status === "insecure_origin"
                  ? `HTTP origin blocked by browser. Add ${pushStatus.origin} (with port) in chrome://flags/#unsafely-treat-insecure-origin-as-secure`
                  : pushStatus.status === "permission_denied"
                    ? "Notifications are blocked in browser site settings."
                    : "Enable browser alerts for order & KOT updates."}
              </span>
              {(pushStatus.status === "needs_permission" || pushStatus.status === "not_registered") && (
                <button
                  type="button"
                  onClick={handleEnablePush}
                  disabled={enablingPush}
                  style={{
                    flexShrink: 0,
                    padding: "5px 10px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#f97316",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: "11px",
                    cursor: enablingPush ? "wait" : "pointer",
                  }}
                >
                  {enablingPush ? "Enabling..." : "Enable"}
                </button>
              )}
            </div>
          )}

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
                    className={`notification-item ${!item.isRead ? "unread" : "read"} ${item.type || "general"
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
          {notificationList.length > 0 && (
            <div className="notification-dropdown-footer">
              <button
                type="button"
                className="notif-clear-all-btn"
                onClick={handleClearAll}
                title={translations.clearall || "Clear all"}
              >
                <DeleteSweepOutlinedIcon fontSize="small" />
                <span>{translations.clearall || "Clear all"}</span>
              </button>
              <button
                type="button"
                className="notif-view-all-btn"
                onClick={handleViewAllNotifications}
              >
                <span>{translations.viewallnotifications || "View all notifications"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;