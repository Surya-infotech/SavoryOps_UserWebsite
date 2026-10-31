/**
 * Keys in localStorage that should NOT be removed when a user logs out
 * or deletes their account (app preferences, selected branch, and order type).
 */
const PRESERVED_STORAGE_KEYS = [
  "selectedLanguage",
  "selectedBranchId",
  "selectedOrderType",
];
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
