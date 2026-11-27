/**
 * Centralized Coupon Storage & API Helper for SavoryOps User Website
 */

const APPLIED_COUPON_KEY = "appliedWebsiteCoupon";
const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

export const getAppliedCoupon = () => {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(APPLIED_COUPON_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.couponcode) return null;
    return parsed;
  } catch (error) {
    console.error("Error reading applied coupon:", error);
    return null;
  }
};

export const saveAppliedCoupon = (coupon) => {
  try {
    if (typeof localStorage === "undefined") return false;
    if (!coupon || !coupon.couponcode) {
      localStorage.removeItem(APPLIED_COUPON_KEY);
    } else {
      localStorage.setItem(APPLIED_COUPON_KEY, JSON.stringify(coupon));
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("couponUpdated", { detail: coupon || null }));
    }
    return true;
  } catch (error) {
    console.error("Error saving applied coupon:", error);
    return false;
  }
};

export const clearAppliedCoupon = () => {
  return saveAppliedCoupon(null);
};

export const fetchAvailableCoupons = async ({
  branchId,
  customerId = null,
  orderType = "",
  subtotalprice = 0,
  subdomain = "",
} = {}) => {
  if (!branchId || !adminPanelBackendPath) {
    return { enabled: false, coupons: [] };
  }

  const basePath = customerId
    ? `${adminPanelBackendPath}/Website/Order/GetAvailableCoupons/${customerId}/${branchId}`
    : `${adminPanelBackendPath}/Website/Order/GetAvailableCoupons/${branchId}`;

  const params = new URLSearchParams();
  if (orderType) params.set("ordertype", orderType);
  params.set("channel", "website");
  if (subtotalprice !== undefined && subtotalprice !== null) {
    params.set("subtotalprice", String(Number(subtotalprice) || 0));
  }

  const response = await fetch(`${basePath}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-user": "admin",
      ...(subdomain ? { "x-subdomain": subdomain } : {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { enabled: Boolean(data?.enabled), coupons: [], message: data?.message };
  }

  return {
    enabled: Boolean(data?.enabled),
    coupons: Array.isArray(data?.coupons) ? data.coupons : [],
  };
};

export const validateCouponCode = async ({
  branchId,
  customerId = null,
  couponCode = "",
  orderType = "",
  subtotalprice = 0,
  subdomain = "",
} = {}) => {
  if (!branchId || !adminPanelBackendPath) {
    return { valid: false, message: "Branch information is missing." };
  }

  const url = customerId
    ? `${adminPanelBackendPath}/Website/Order/ValidateCoupon/${customerId}/${branchId}`
    : `${adminPanelBackendPath}/Website/Order/ValidateCoupon/${branchId}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user": "admin",
      ...(subdomain ? { "x-subdomain": subdomain } : {}),
    },
    body: JSON.stringify({
      couponcode: String(couponCode || "").trim().toUpperCase(),
      ordertype: orderType || "",
      channel: "website",
      subtotalprice: Number(subtotalprice) || 0,
      ...(customerId ? { customerid: customerId } : {}),
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.valid) {
    return {
      valid: false,
      status: response.status,
      message: data?.message || "Invalid coupon code.",
    };
  }

  return {
    valid: true,
    message: data.message,
    discountAmount: Number(data.discountAmount ?? data.coupon?.discountamount ?? 0),
    coupon: data.coupon || null,
  };
};

export default {
  getAppliedCoupon,
  saveAppliedCoupon,
  clearAppliedCoupon,
  fetchAvailableCoupons,
  validateCouponCode,
};