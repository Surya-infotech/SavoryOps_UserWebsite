import { CUSTOMER_FCM_STORAGE_KEY, resetCustomerFcmSessionCache } from "./firebase.js";

/**
 * Keys in localStorage that should NOT be removed when a user logs out
 * or deletes their account (app preferences, selected branch, and order type).
 */
const PRESERVED_STORAGE_KEYS = [
  "selectedLanguage",
  "selectedBranchId",
  "selectedOrderType",
];

/**
 * Call the backend logout API to remove the customer's token from the database tokens list.
 *
 * @param {string} token - The customer's JWT token
 * @param {string} [customerId] - The customer's database ID
 */
export const logoutCustomerApi = async (token, customerId) => {
  const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
  const fcmToken =
    typeof localStorage !== "undefined" ? localStorage.getItem(CUSTOMER_FCM_STORAGE_KEY) || "" : "";

  if (!adminPanelBackendPath) {
    resetCustomerFcmSessionCache();
    return;
  }

  try {
    if (token) {
      await fetch(`${adminPanelBackendPath}/Website/General/Logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "customer",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token, customerId, fcmToken }),
      });
    } else if (fcmToken) {
      await fetch(`${adminPanelBackendPath}/Website/General/remove-fcm-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "customer",
        },
        body: JSON.stringify({ fcmToken, customerId }),
      });
    }
  } catch (error) {
    console.error("Error during customer logout API call:", error);
  } finally {
    resetCustomerFcmSessionCache();
  }
};

/**
 * Clear all localStorage items on logout or account deletion,
 * preserving only the user's selected language, selected branch, and selected order type.
 */
export const clearStorageOnLogout = () => {
  if (typeof localStorage === "undefined") return;

  // 1. Snapshot values of keys to preserve
  const preservedEntries = PRESERVED_STORAGE_KEYS.map((key) => [
    key,
    localStorage.getItem(key),
  ]);

  // 2. Clear all storage
  localStorage.clear();

  // 3. Restore preserved keys
  for (const [key, value] of preservedEntries) {
    if (value !== null) {
      localStorage.setItem(key, value);
    }
  }
};
