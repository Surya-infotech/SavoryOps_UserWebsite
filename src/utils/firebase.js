import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { addNotification } from "./notificationService.js";

export const firebaseConfig = {
  apiKey: "AIzaSyDwK5CJM5X5MwRWSpTTFjBoq5O6YuYGUYo",
  authDomain: "savoryops-notification.firebaseapp.com",
  projectId: "savoryops-notification",
  storageBucket: "savoryops-notification.firebasestorage.app",
  messagingSenderId: "166494710636",
  appId: "1:166494710636:web:dceb6ddbdbb326daf1e149",
};

export const CUSTOMER_FCM_STORAGE_KEY = "SAVORYOPS_CUSTOMER_FCM_TOKEN";

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let messagingInstance = null;
let inFlightRegistrationPromise = null;
let inFlightAuthToken = null;
let lastRegisteredSessionKey = null;
let foregroundListenerRegistered = false;

export const getFirebaseMessaging = async () => {
  if (typeof window === "undefined") return null;
  const supported = await isSupported().catch(() => false);
  if (!supported) {
    console.warn(
      "[FCM] Firebase messaging is not supported in this browser environment. window.isSecureContext =",
      window.isSecureContext
    );
    return null;
  }
  if (!messagingInstance) {
    messagingInstance = getMessaging(app);
  }
  return messagingInstance;
};

const notifyPushStatusChanged = () => {
  try {
    window.dispatchEvent(new CustomEvent("savoryops_customer_push_status"));
  } catch {
    // Ignore event errors
  }
};

export const getCustomerPushStatus = () => {
  if (typeof window === "undefined") {
    return { status: "unsupported", isSecureContext: false, permission: "default", origin: "", hasToken: false };
  }

  const origin = window.location.origin;
  const hasToken = Boolean(localStorage.getItem(CUSTOMER_FCM_STORAGE_KEY));

  if (!window.isSecureContext) {
    return {
      status: "insecure_origin",
      isSecureContext: false,
      permission: "Notification" in window ? Notification.permission : "default",
      origin,
      hasToken,
    };
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return {
      status: "unsupported",
      isSecureContext: true,
      permission: "default",
      origin,
      hasToken,
    };
  }

  if (Notification.permission === "denied") {
    return {
      status: "permission_denied",
      isSecureContext: true,
      permission: "denied",
      origin,
      hasToken,
    };
  }

  if (Notification.permission !== "granted") {
    return {
      status: "needs_permission",
      isSecureContext: true,
      permission: Notification.permission,
      origin,
      hasToken,
    };
  }

  return {
    status: hasToken && lastRegisteredSessionKey ? "registered" : "not_registered",
    isSecureContext: true,
    permission: "granted",
    origin,
    hasToken,
  };
};

export const markCustomerFcmTokenRegistered = (authToken, fcmToken) => {
  if (!authToken || !fcmToken) return;
  lastRegisteredSessionKey = `${authToken}:${fcmToken}`;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CUSTOMER_FCM_STORAGE_KEY, fcmToken);
  }
  notifyPushStatusChanged();
};

/**
 * Request notification permission, register service worker, and store customer FCM token on backend.
 *
 * @param {string} authToken - Customer JWT token
 * @param {object} [options]
 * @param {boolean} [options.force=false]
 * @returns {Promise<string|null>}
 */
export const requestCustomerNotificationPermission = async (authToken, { force = false } = {}) => {
  if (typeof window === "undefined" || !authToken) return null;

  if (inFlightRegistrationPromise && inFlightAuthToken === authToken && !force) {
    return inFlightRegistrationPromise;
  }

  if (!window.isSecureContext) {
    console.warn(
      "[FCM] Insecure origin detected (" +
        window.location.origin +
        "). Web Push and Service Workers require HTTPS or localhost. For Chrome local dev include the port, e.g. " +
        window.location.origin
    );
  }

  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    console.warn("[FCM] Push notifications are not supported in this browser.");
    return null;
  }

  const runRegistration = async () => {
    try {
      const messaging = await getFirebaseMessaging();
      if (!messaging) {
        notifyPushStatusChanged();
        return null;
      }

      const permission =
        Notification.permission === "granted"
          ? "granted"
          : await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("[FCM] Customer notification permission not granted:", permission);
        notifyPushStatusChanged();
        return null;
      }

      const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
        scope: "/",
      });
      try {
        await registration.update();
      } catch {
        // Ignore update errors
      }

      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);

      const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || undefined;
      const tokenOptions = { serviceWorkerRegistration: registration };
      if (vapidKey) tokenOptions.vapidKey = vapidKey;

      const fcmToken = await getToken(messaging, tokenOptions);
      if (!fcmToken) {
        console.warn("[FCM] No customer FCM registration token returned.");
        notifyPushStatusChanged();
        return null;
      }

      const sessionKey = `${authToken}:${fcmToken}`;
      if (!force && lastRegisteredSessionKey === sessionKey) {
        return fcmToken;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      if (backendUrl) {
        const response = await fetch(`${backendUrl}/Website/General/save-fcm-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
            "x-user": "customer",
          },
          body: JSON.stringify({
            fcmToken,
            device: "Web Browser",
          }),
        });

        if (response.ok) {
          lastRegisteredSessionKey = sessionKey;
          localStorage.setItem(CUSTOMER_FCM_STORAGE_KEY, fcmToken);
          notifyPushStatusChanged();
        } else {
          const resData = await response.json().catch(() => ({}));
          console.warn("[FCM] Failed to save customer FCM token:", response.status, resData);
          notifyPushStatusChanged();
          return null;
        }
      }

      return fcmToken;
    } catch (err) {
      console.error("[FCM] Error requesting customer notification permission:", err);
      notifyPushStatusChanged();
      return null;
    } finally {
      if (inFlightRegistrationPromise === promise) {
        inFlightRegistrationPromise = null;
        inFlightAuthToken = null;
      }
    }
  };

  const promise = runRegistration();
  inFlightRegistrationPromise = promise;
  inFlightAuthToken = authToken;
  return promise;
};

export const enableCustomerPushNotifications = async (authToken) => {
  const preStatus = getCustomerPushStatus();
  if (preStatus.status === "insecure_origin" || preStatus.status === "unsupported" || preStatus.status === "permission_denied") {
    return { ok: false, ...preStatus };
  }

  const token = await requestCustomerNotificationPermission(authToken, { force: true });
  const postStatus = getCustomerPushStatus();
  return {
    ok: Boolean(token && postStatus.hasToken),
    token,
    ...postStatus,
  };
};

/**
 * Remove customer FCM token from backend upon logout / session invalidation.
 *
 * @param {string} [authToken]
 */
export const removeCustomerFcmToken = async (authToken) => {
  if (typeof localStorage === "undefined") return;
  const fcmToken = localStorage.getItem(CUSTOMER_FCM_STORAGE_KEY);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  try {
    if (backendUrl && (fcmToken || authToken)) {
      const headers = {
        "Content-Type": "application/json",
        "x-user": "customer",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      await fetch(`${backendUrl}/Website/General/remove-fcm-token`, {
        method: "POST",
        headers,
        body: JSON.stringify({ fcmToken: fcmToken || "" }),
      });
    }
  } catch (err) {
    console.error("[FCM] Error removing customer FCM token:", err);
  } finally {
    lastRegisteredSessionKey = null;
    localStorage.removeItem(CUSTOMER_FCM_STORAGE_KEY);
  }
};

/**
 * Clear in-memory FCM session cache without network request (e.g., when Logout endpoint already removed it).
 */
export const resetCustomerFcmSessionCache = () => {
  lastRegisteredSessionKey = null;
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(CUSTOMER_FCM_STORAGE_KEY);
  }
  notifyPushStatusChanged();
};

function resolveLocalNotificationPath(data = {}) {
  if (data.path && typeof data.path === "string" && data.path.startsWith("/")) {
    return data.path;
  }
  if (data.url && typeof data.url === "string") {
    try {
      const parsed = new URL(data.url, window.location.origin);
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    } catch {
      return data.url;
    }
  }
  return "/orders";
}

function mapNotificationCategory(rawType = "") {
  const normalized = String(rawType).toLowerCase();
  if (normalized.includes("order") || normalized.includes("kot")) return "order";
  if (normalized.includes("reservation")) return "reservation";
  if (normalized.includes("table")) return "table";
  if (normalized.includes("offer")) return "offer";
  return "general";
}

/**
 * Listen for foreground Firebase messages on User Website and sync with Notification dropdown & order screens.
 *
 * @param {Function} [onReceive]
 */
export const setupCustomerForegroundNotificationListener = async (onReceive) => {
  const messaging = await getFirebaseMessaging();
  if (!messaging || foregroundListenerRegistered) return;
  foregroundListenerRegistered = true;

  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || "SavoryOps Update";
    const body = payload.notification?.body || payload.data?.body || "";
    const icon = payload.notification?.icon || payload.data?.icon || "/favicon.ico";
    const tag = payload.data?.tag || payload.data?.type || `${title}_${body}`;
    const targetPath = resolveLocalNotificationPath(payload.data);

    addNotification({
      title,
      message: body,
      type: mapNotificationCategory(payload.data?.type || payload.data?.cancelScope),
      url: targetPath,
    });

    if (document.visibilityState === "visible" && Notification.permission === "granted") {
      try {
        const notif = new Notification(title, { body, icon, tag });
        notif.onclick = () => {
          window.focus();
          if (targetPath) {
            window.location.assign(targetPath);
          }
          notif.close();
        };
      } catch (e) {
        console.warn("[FCM] Desktop notification error:", e);
      }
    }

    try {
      window.dispatchEvent(
        new CustomEvent("savoryops_customer_notification", { detail: payload })
      );
    } catch {
      // Ignore event dispatch errors
    }

    if (typeof onReceive === "function") {
      onReceive(payload);
    }
  });
};

export default app;

