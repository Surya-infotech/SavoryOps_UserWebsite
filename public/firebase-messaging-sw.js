/* global importScripts, firebase, clients */
// Firebase Cloud Messaging Service Worker for SavoryOps User Website
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyDwK5CJM5X5MwRWSpTTFjBoq5O6YuYGUYo",
  authDomain: "savoryops-notification.firebaseapp.com",
  projectId: "savoryops-notification",
  storageBucket: "savoryops-notification.firebasestorage.app",
  messagingSenderId: "166494710636",
  appId: "1:166494710636:web:dceb6ddbdbb326daf1e149",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle background messages when only data payload is provided (avoid duplicates when notification object is present)
messaging.onBackgroundMessage((payload) => {
  if (!payload.notification) {
    const notificationTitle = payload.data?.title || "SavoryOps Order Update";
    const notificationOptions = {
      body: payload.data?.body || "",
      icon: payload.data?.icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: payload.data?.tag || payload.data?.type || "savoryops_customer_notification",
      data: payload.data || {},
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  }
});

// Resolve path on current origin so clicks work on localhost, *.savoryops.website, and *.savoryops.com
function resolveTargetUrl(notificationData) {
  const rawPath = notificationData?.path;
  if (rawPath && typeof rawPath === "string" && rawPath.startsWith("/")) {
    return new URL(rawPath, self.location.origin).href;
  }
  const rawUrl = notificationData?.url;
  if (rawUrl && typeof rawUrl === "string") {
    try {
      const parsed = new URL(rawUrl, self.location.origin);
      return new URL(parsed.pathname + parsed.search + parsed.hash, self.location.origin).href;
    } catch {
      return self.location.origin;
    }
  }
  return self.location.origin;
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = resolveTargetUrl(event.notification.data);

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === targetUrl && "focus" in client) {
          return client.focus();
        }
      }
      for (const client of windowClients) {
        if ("navigate" in client && "focus" in client) {
          return client.navigate(targetUrl).then((navigatedClient) => navigatedClient?.focus?.());
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});