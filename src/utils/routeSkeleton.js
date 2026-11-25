/**
 * Maps a URL pathname (and optional search string) to a LoadingSpinner type
 * so every route renders a skeleton matching its actual page layout.
 *
 * @param {string} pathname
 * @param {string} [search]
 * @returns {string}
 */
export const getSkeletonTypeForPath = (pathname = "/", search = "") => {
  const normalized = (pathname || "/").replace(/\/+$/, "") || "/";
  const hasIdParam = Boolean(new URLSearchParams(search || "").get("id"));

  if (normalized === "/") return "home";
  if (normalized === "/signin") return "signin";
  if (normalized === "/about") return "about";
  if (normalized === "/menu") return "menu";
  if (normalized === "/offers") return "offers";
  if (normalized === "/cart") return "cart";
  if (normalized === "/checkout") return "checkout";
  if (normalized === "/profile") return "profile";
  if (normalized === "/manage-address") return "addresses";
  if (normalized === "/my-reviews") return "reviews";
  if (normalized === "/settings") return "settings";
  if (normalized === "/notifications") return "notifications";

  if (normalized === "/reservation") {
    return hasIdParam ? "reservation-detail" : "reservation";
  }
  if (
    normalized.startsWith("/reservation/") ||
    normalized.startsWith("/reservationdetails/")
  ) {
    return "reservation-detail";
  }

  if (normalized === "/orders") {
    return hasIdParam ? "order-detail" : "orders";
  }
  if (
    normalized.startsWith("/orders/") ||
    normalized.startsWith("/orderdetails/")
  ) {
    return "order-detail";
  }

  if (normalized === "/policy" || normalized.startsWith("/policy/")) {
    return "policy";
  }

  return "page";
};