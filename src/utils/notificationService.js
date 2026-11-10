/**
 * Centralized Notification Service for SavoryOps User Website
 * Handles notification storage, real-time event synchronization, read/unread states, and automatic event logging.
 */

const STORAGE_KEY = "savoryops_customer_notifications";

/**
 * Generate unique notification ID
 */
const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
};

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
export const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  try {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString();
  } catch {
    return "";
  }
};

/**
 * Dispatch notification change event for reactive component updating
 */
const notifyChange = (notifications) => {
  if (typeof window !== "undefined") {
    const unreadCount = (notifications || []).filter((n) => !n.isRead).length;
    window.dispatchEvent(
      new CustomEvent("notificationChange", {
        detail: {
          notifications: notifications || [],
          unreadCount,
        },
      })
    );
  }
};

/**
 * Get all notifications from localStorage
 */
export const getNotifications = () => {
  try {
    if (typeof localStorage === "undefined") return [];
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Error loading notifications from localStorage:", error);
    return [];
  }
};

/**
 * Save notifications array to localStorage
 */
export const saveNotifications = (notifications) => {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications || []));
    notifyChange(notifications);
    return true;
  } catch (error) {
    console.error("Error saving notifications to localStorage:", error);
    return false;
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = () => {
  const list = getNotifications();
  return list.filter((n) => !n.isRead).length;
};

/**
 * Add a new notification
 * @param {Object} notif - { title, message, type: 'order'|'table'|'offer'|'reservation'|'general', url }
 */
export const addNotification = ({ title, message, type = "general", url = "" }) => {
  if (!title) return null;
  const current = getNotifications();

  // Deduplicate recent identical notification (within 30 seconds)
  const isDuplicate = current.some(
    (n) =>
      n.title === title &&
      n.message === message &&
      Date.now() - new Date(n.createdAt).getTime() < 30000
  );
  if (isDuplicate) return null;

  const newEntry = {
    id: generateNotificationId(),
    title,
    message: message || "",
    type,
    url: url || "",
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...current].slice(0, 50); // Keep latest 50
  saveNotifications(updated);
  return newEntry;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = (notificationId) => {
  const current = getNotifications();
  const updated = current.map((n) =>
    n.id === notificationId ? { ...n, isRead: true } : n
  );
  saveNotifications(updated);
};

/**
 * Delete a single notification
 */
export const deleteNotification = (notificationId) => {
  const current = getNotifications();
  const updated = current.filter((n) => n.id !== notificationId);
  saveNotifications(updated);
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = () => {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  saveNotifications(updated);
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = () => {
  saveNotifications([]);
};

// Auto-wire tableChange event listener so QR scans log an automatic notification
if (typeof window !== "undefined") {
  window.addEventListener("tableChange", (event) => {
    const tableNo = event?.detail?.tableNo || event?.detail?.tableno;
    if (tableNo) {
      addNotification({
        title: `Connected to Table ${tableNo}`,
        message: `You are connected to Table ${tableNo}. Browse the menu and place orders directly from your table.`,
        type: "table",
        url: "/cart",
      });
    }
  });

  // Listen to order updates or placements
  window.addEventListener("orderPlaced", (event) => {
    const orderNo = event?.detail?.orderNo || event?.detail?.orderno;
    const orderId = event?.detail?.orderId || event?.detail?.orderid;
    if (orderNo) {
      addNotification({
        title: `Order #${orderNo} Placed`,
        message: "Your order has been received and is being prepared with fresh ingredients.",
        type: "order",
        url: orderId ? `/orderdetails/${orderId}` : "/orders",
      });
    }
  });
}

