import { getWebsiteSubdomain } from "../Pages/Partials/UnderMaintenance.jsx";

/**
 * Centralized Notification Service for SavoryOps User Website
 * Keeps notification state strictly in memory + synchronized with backend MongoDB API
 * and cross-tab BroadcastChannel events (no notification data persisted in localStorage).
 */

const LEGACY_NOTIFICATION_STORAGE_KEYS = [
  "savoryops_customer_notifications",
  "savoryops_customer_notifications_server",
];
const NOTIFICATION_BROADCAST_CHANNEL = "savoryops_customer_notifications";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const CUSTOMER_TOKEN_KEY = import.meta.env.VITE_CUSTOMERTOKEN_NAME;

let inFlightSyncPromise = null;
let serverNotifications = [];
let localNotifications = [];
let pendingPushNotifications = [];
let broadcastChannelInstance = null;

const getCustomerAuthToken = () => {
  if (typeof localStorage === "undefined" || !CUSTOMER_TOKEN_KEY) return "";
  return localStorage.getItem(CUSTOMER_TOKEN_KEY) || "";
};

const isServerNotificationId = (id) => /^[a-f\d]{24}$/i.test(String(id || ""));

const getBroadcastChannel = () => {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!broadcastChannelInstance) {
    try {
      broadcastChannelInstance = new BroadcastChannel(NOTIFICATION_BROADCAST_CHANNEL);
    } catch {
      return null;
    }
  }
  return broadcastChannelInstance;
};

const postCrossTabSync = (type = "NOTIFICATIONS_UPDATED") => {
  try {
    getBroadcastChannel()?.postMessage({ type, timestamp: Date.now() });
  } catch {
    // Ignore BroadcastChannel restriction
  }
};

const buildCustomerHeaders = (token) => {
  const headers = {
    "Content-Type": "application/json",
    "x-user": "customer",
    Authorization: `Bearer ${token}`,
  };
  const subdomain = getWebsiteSubdomain();
  if (subdomain) {
    headers["x-subdomain"] = subdomain;
  }
  return headers;
};

/**
 * Normalize backend or payload notification type into a UI category.
 */
export const normalizeNotificationCategory = (rawType = "") => {
  const normalized = String(rawType || "").toLowerCase();
  if (normalized.includes("order") || normalized.includes("kot")) return "order";
  if (normalized.includes("reservation")) return "reservation";
  if (normalized.includes("table")) return "table";
  if (normalized.includes("offer")) return "offer";
  return "general";
};

/**
 * Resolve an in-app React Router path from a notification URL/path/data payload.
 */
export const resolveNotificationPath = (rawUrlOrData, fallback = "") => {
  const dataObj =
    rawUrlOrData && typeof rawUrlOrData === "object" ? rawUrlOrData : null;
  const rawPath = dataObj ? dataObj.path : null;
  if (rawPath && typeof rawPath === "string" && rawPath.startsWith("/")) {
    return rawPath;
  }

  const candidate = dataObj ? dataObj.url : rawUrlOrData;
  if (candidate && typeof candidate === "string") {
    const trimmed = candidate.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith("/")) return trimmed;
    try {
      const base =
        typeof window !== "undefined" ? window.location.origin : "http://localhost";
      const parsed = new URL(trimmed, base);
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return fallback || trimmed;
    }
  }

  return fallback;
};

const normalizeServerNotification = (item = {}) => {
  const rawCreatedAt = item.createdAtRaw || item.createdAt || new Date().toISOString();
  return {
    id: String(item._id || item.id || ""),
    title: item.title || "",
    message: item.body ?? item.message ?? "",
    rawType: item.type || item.data?.type || "",
    type: normalizeNotificationCategory(
      item.type || item.data?.type || item.data?.cancelScope
    ),
    url: resolveNotificationPath(item.url || item.data || "", ""),
    data: item.data || {},
    isRead: Boolean(item.isRead),
    createdAt: rawCreatedAt,
    createdAtFormatted: item.createdAtFormatted || "",
    source: "server",
  };
};

/**
 * Generate unique local session notification ID
 */
const generateNotificationId = () => {
  return `notif_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
};

/**
 * Format relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday")
 */
export const formatTimeAgo = (dateStr, fallbackFormatted = "") => {
  if (!dateStr) return fallbackFormatted || "";
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) {
      return fallbackFormatted || String(dateStr);
    }

    const diffMs = Math.max(0, Date.now() - date.getTime());
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
    return fallbackFormatted || "";
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
 * Apply an in-memory transform across all notification lists and notify listeners.
 */
const updateAllStores = (transform) => {
  serverNotifications = transform(serverNotifications);
  localNotifications = transform(localNotifications);
  pendingPushNotifications = transform(pendingPushNotifications);
  notifyChange(getNotifications());
};

/**
 * Get all merged notifications from memory (server DB records + in-session local/push events)
 */
export const getNotifications = () => {
  const token = getCustomerAuthToken();
  const activeServerList = token ? serverNotifications : [];

  const seenIds = new Set();
  const combined = [];

  for (const item of activeServerList) {
    if (!item?.id || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    combined.push(item);
  }

  for (const item of pendingPushNotifications) {
    if (!item?.id || seenIds.has(item.id)) continue;
    const matchesServer = activeServerList.some(
      (srv) => srv.title === item.title && srv.message === item.message
    );
    if (matchesServer) continue;
    seenIds.add(item.id);
    combined.push(item);
  }

  for (const item of localNotifications) {
    if (!item?.id || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    combined.push(item);
  }

  combined.sort((a, b) => {
    const ta = new Date(a.createdAt).getTime();
    const tb = new Date(b.createdAt).getTime();
    return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
  });

  return combined;
};

/**
 * Replace in-session local notifications list in memory
 */
export const saveNotifications = (notifications) => {
  localNotifications = Array.isArray(notifications) ? notifications : [];
  notifyChange(getNotifications());
  return true;
};

/**
 * Fetch authenticated customer's notifications from backend MongoDB into memory.
 */
export const syncNotificationsFromServer = async ({ force = false } = {}) => {
  const token = getCustomerAuthToken();
  if (!token || !BACKEND_URL) {
    serverNotifications = [];
    pendingPushNotifications = [];
    const current = getNotifications();
    notifyChange(current);
    return current;
  }

  if (inFlightSyncPromise && !force) {
    return inFlightSyncPromise;
  }

  const runSync = async () => {
    try {
      const response = await fetch(
        `${BACKEND_URL}/Website/General/notifications?limit=50`,
        {
          method: "GET",
          headers: buildCustomerHeaders(token),
        }
      );

      if (!response.ok) {
        return getNotifications();
      }

      const data = await response.json();
      if (!data?.success || !Array.isArray(data.notifications)) {
        return getNotifications();
      }

      const normalizedServer = data.notifications
        .map(normalizeServerNotification)
        .filter((item) => item.id);

      serverNotifications = normalizedServer;

      // Drop optimistic push previews once backend confirms or ages out
      const now = Date.now();
      pendingPushNotifications = pendingPushNotifications.filter((pending) => {
        const syncedById = normalizedServer.some((s) => s.id === pending.id);
        const syncedByContent = normalizedServer.some(
          (s) => s.title === pending.title && s.message === pending.message
        );
        const ageMs = now - new Date(pending.createdAt).getTime();
        return !syncedById && !syncedByContent && ageMs < 120000;
      });

      const merged = getNotifications();
      notifyChange(merged);
      return merged;
    } catch (error) {
      console.error("Error syncing notifications from server:", error);
      return getNotifications();
    }
  };

  inFlightSyncPromise = runSync().finally(() => {
    inFlightSyncPromise = null;
  });

  return inFlightSyncPromise;
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = () => {
  const list = getNotifications();
  return list.filter((n) => !n.isRead).length;
};

/**
 * Add an in-memory notification for the active session
 * @param {Object} notif - { title, message, type: 'order'|'table'|'offer'|'reservation'|'general', url }
 */
export const addNotification = ({ title, message, type = "general", url = "" }) => {
  if (!title) return null;

  // Deduplicate recent identical notification (within 30 seconds)
  const isDuplicate = localNotifications.some(
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
    type: normalizeNotificationCategory(type),
    url: url || "",
    isRead: false,
    createdAt: new Date().toISOString(),
    source: "local",
  };

  const updated = [newEntry, ...localNotifications].slice(0, 50);
  saveNotifications(updated);
  return newEntry;
};

/**
 * Show an incoming push immediately when received in foreground, then confirm via server sync.
 */
export const addPushPreviewNotification = ({
  id = "",
  title,
  message = "",
  type = "order",
  url = "",
}) => {
  if (!title) return null;

  if (!getCustomerAuthToken()) {
    return addNotification({ title, message, type, url });
  }

  const previewId = id ? String(id) : `pending_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  const existing = getNotifications().some(
    (n) =>
      n.id === previewId ||
      (n.title === title &&
        n.message === message &&
        Date.now() - new Date(n.createdAt).getTime() < 30000)
  );
  if (existing) return null;

  const previewEntry = {
    id: previewId,
    title,
    message,
    type: normalizeNotificationCategory(type),
    url: resolveNotificationPath(url, ""),
    isRead: false,
    createdAt: new Date().toISOString(),
    source: "push_preview",
  };

  pendingPushNotifications = [previewEntry, ...pendingPushNotifications].slice(0, 20);
  notifyChange(getNotifications());
  return previewEntry;
};

/**
 * Mark a single notification as read
 */
export const markAsRead = async (notificationId) => {
  if (!notificationId) return;

  updateAllStores((list) =>
    list.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
  );

  const token = getCustomerAuthToken();
  if (token && BACKEND_URL && isServerNotificationId(notificationId)) {
    try {
      await fetch(`${BACKEND_URL}/Website/General/notifications/read/${notificationId}`, {
        method: "PUT",
        headers: buildCustomerHeaders(token),
      });
      postCrossTabSync("NOTIFICATIONS_UPDATED");
    } catch (error) {
      console.error("Error marking server notification as read:", error);
    }
  }
};

/**
 * Delete a single notification
 */
export const deleteNotification = async (notificationId) => {
  if (!notificationId) return;

  updateAllStores((list) => list.filter((n) => n.id !== notificationId));

  const token = getCustomerAuthToken();
  if (token && BACKEND_URL && isServerNotificationId(notificationId)) {
    try {
      await fetch(`${BACKEND_URL}/Website/General/notifications/${notificationId}`, {
        method: "DELETE",
        headers: buildCustomerHeaders(token),
      });
      postCrossTabSync("NOTIFICATIONS_UPDATED");
    } catch (error) {
      console.error("Error deleting server notification:", error);
    }
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async () => {
  updateAllStores((list) => list.map((n) => ({ ...n, isRead: true })));

  const token = getCustomerAuthToken();
  if (token && BACKEND_URL) {
    try {
      await fetch(`${BACKEND_URL}/Website/General/notifications/mark-all-read`, {
        method: "PUT",
        headers: buildCustomerHeaders(token),
      });
      postCrossTabSync("NOTIFICATIONS_UPDATED");
    } catch (error) {
      console.error("Error marking all server notifications as read:", error);
    }
  }
};

/**
 * Clear all notifications
 */
export const clearAllNotifications = async () => {
  updateAllStores(() => []);

  const token = getCustomerAuthToken();
  if (token && BACKEND_URL) {
    try {
      await fetch(`${BACKEND_URL}/Website/General/notifications/clear-all`, {
        method: "DELETE",
        headers: buildCustomerHeaders(token),
      });
      postCrossTabSync("NOTIFICATIONS_UPDATED");
    } catch (error) {
      console.error("Error clearing server notifications:", error);
    }
  }
};

/**
 * Subscribe a UI component to real-time notification changes, initial server sync,
 * focus/visibility refreshes, auth storage changes, and optional periodic polling.
 *
 * @param {Function} onChange - Callback invoked with updated notifications array
 * @param {Object} [options]
 * @param {number} [options.pollIntervalMs=60000] - Background refresh interval (0 to disable)
 * @returns {Function} Unsubscribe cleanup function
 */
export const subscribeToNotifications = (onChange, { pollIntervalMs = 60000 } = {}) => {
  if (typeof window === "undefined") return () => {};

  const emitCurrent = (list) => {
    if (typeof onChange === "function") {
      onChange(Array.isArray(list) ? list : getNotifications());
    }
  };

  const handleNotificationChange = (event) => {
    emitCurrent(event?.detail?.notifications || getNotifications());
  };

  const handleAuthStorageChange = (event) => {
    if (!event?.key || event.key === CUSTOMER_TOKEN_KEY) {
      syncNotificationsFromServer({ force: true });
    }
  };

  const handleFocusOrVisible = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    syncNotificationsFromServer();
  };

  window.addEventListener("notificationChange", handleNotificationChange);
  window.addEventListener("storage", handleAuthStorageChange);
  window.addEventListener("focus", handleFocusOrVisible);
  document.addEventListener("visibilitychange", handleFocusOrVisible);

  // Sync immediately with backend
  syncNotificationsFromServer();

  const timerId =
    pollIntervalMs > 0 ? window.setInterval(() => syncNotificationsFromServer(), pollIntervalMs) : null;

  return () => {
    window.removeEventListener("notificationChange", handleNotificationChange);
    window.removeEventListener("storage", handleAuthStorageChange);
    window.removeEventListener("focus", handleFocusOrVisible);
    document.removeEventListener("visibilitychange", handleFocusOrVisible);
    if (timerId !== null) {
      window.clearInterval(timerId);
    }
  };
};

// Auto-wire event listeners and remove any legacy notification keys from localStorage
if (typeof window !== "undefined") {
  if (typeof localStorage !== "undefined") {
    for (const key of LEGACY_NOTIFICATION_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
  }

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

  window.addEventListener("savoryops_customer_notification", () => {
    syncNotificationsFromServer({ force: true });
  });

  window.addEventListener("customerAuthChange", () => {
    syncNotificationsFromServer({ force: true });
  });

  const channel = getBroadcastChannel();
  if (channel) {
    channel.addEventListener("message", (event) => {
      if (
        event?.data?.type === "NOTIFICATION_RECEIVED" ||
        event?.data?.type === "NOTIFICATIONS_UPDATED"
      ) {
        syncNotificationsFromServer({ force: true });
      }
    });
  }
}