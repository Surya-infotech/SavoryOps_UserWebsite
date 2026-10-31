import moment from "moment-timezone";
import { formatCurrency } from "../../utils/formatCurrency.js";

export const getOrderStatusColor = (status) => {
  const norm = String(status || "").trim();
  switch (norm) {
    case "Completed":
      return "#28a745";
    case "Pending":
      return "#f44336";
    case "Confirmed":
      return "#009688";
    case "Processing":
      return "#9c27b0";
    case "Cancelled":
      return "#757575";
    case "Items Added":
    case "Items Added by Waiter":
      return "#009688";
    case "Preparing":
      return "#ff9800";
    case "Driver Assigned":
      return "#9c27b0";
    case "On the Way":
      return "#2196f3";
    case "Delivered":
      return "#4caf50";
    default:
      return "#ff9800";
  }
};

export const getPaymentStatusColor = (status) => {
  const norm = String(status || "").trim();
  switch (norm) {
    case "Paid":
      return "#4caf50";
    case "UnPaid":
    case "Unpaid":
      return "#f44336";
    case "Refunded":
      return "#8b5cf6";
    case "Void":
      return "#64748b";
    default:
      return "#757575";
  }
};

export const getItemStatusColor = (status) => {
  const norm = String(status || "").trim();
  switch (norm) {
    case "Completed":
      return "#28a745";
    case "Pending":
      return "#f44336";
    case "Cancelled":
      return "#e53935";
    case "Assigned":
      return "#8a2be2";
    case "Preparing":
      return "#ffc107";
    case "Ready to Serve":
      return "#4caf50";
    default:
      return "#757575";
  }
};

export const getOrderTypeBackgroundColor = (orderType) => {
  const norm = String(orderType || "").toLowerCase().replace(/[-\s_]/g, "");
  switch (norm) {
    case "dinein":
      return "#4a90e2";
    case "pickup":
      return "#ff9800";
    case "delivery":
      return "#4caf50";
    case "takeaway":
      return "#9c27b0";
    case "quickorder":
    case "quick":
      return "#8ab17d";
    default:
      return "#4a90e2";
  }
};

export const isDeliveryOrderType = (orderType) => {
  if (!orderType) return false;
  const norm = String(orderType).toLowerCase().replace(/[-\s_]/g, "");
  return norm.includes("delivery");
};

export const isDineInOrderType = (orderType) => {
  if (!orderType) return false;
  const norm = String(orderType).toLowerCase().replace(/[-\s_]/g, "");
  return norm.includes("dine");
};

export const isItemCancelled = (it) => {
  return String(it?.itemStatus || it?.itemstatus || it?.status || "").toLowerCase() === "cancelled";
};

export const normalizeLocationDetails = (order) => {
  const loc = order?.locationdetails ?? order?.locationDetails ?? order?.location ?? null;
  if (!loc || typeof loc !== "object" || Array.isArray(loc)) return null;

  const address = loc.address || "";
  const city = loc.city || "";
  const state = loc.state || "";
  const country = loc.country || "";
  const postalcode = loc.postalcode || "";

  if (!address && !city && !state && !country) return null;

  return {
    address,
    city,
    state,
    country,
    postalcode,
    addresstype: loc.addresstype,
  };
};

export const formatLocationDetailsLine = (location) => {
  if (!location) return "";
  const parts = [location.address, location.city, location.state, location.country].filter(Boolean);
  const line = parts.join(", ");
  return location.postalcode ? `${line} - ${location.postalcode}` : line;
};

export const formatLocationAddressType = (type, translations = {}) => {
  const norm = String(type || "").toLowerCase().trim();
  if (norm === "work") return translations.work || "Work";
  if (norm === "other") return translations.other || "Other";
  return translations.home || "Home";
};

export const formatOrderDateTime = (
  dateString,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "hh:mm A",
  timeZone = "Asia/Kolkata"
) => {
  if (!dateString) return "";
  const combinedFormat = `${dateFormat} ${timeFormat}`;
  try {
    return moment.tz(dateString, timeZone).format(combinedFormat);
  } catch {
    return new Date(dateString).toLocaleString();
  }
};

export const formatOrderPrice = (price, order = {}) => {
  if (price === null || price === undefined) return "$0.00";
  const num = parseFloat(price) || 0;
  const symbol = order?.currencysymbol || order?.currencySymbol || "$";
  const position = order?.currencyposition || order?.currencyPosition || "left";
  const thousand = order?.thousandseparator || order?.thousandSeparator || ",";
  const decimal = order?.decimalseparator || order?.decimalSeparator || ".";
  const decimalPlaces = order?.decimal !== undefined ? parseInt(order.decimal, 10) : 2;

  let formattedPrice = num.toFixed(decimalPlaces);
  const parts = formattedPrice.split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
  formattedPrice = parts.join(decimal);

  if (position === "left") return `${symbol}${formattedPrice}`;
  if (position === "left-space") return `${symbol} ${formattedPrice}`;
  if (position === "right-space") return `${formattedPrice} ${symbol}`;
  if (position === "right") return `${formattedPrice}${symbol}`;
  return `${symbol}${formattedPrice}`;
};