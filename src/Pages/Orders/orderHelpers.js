import moment from "moment-timezone";

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
  if (norm === "work") return translations.work;
  if (norm === "other") return translations.other;
  return translations.home;
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

export const consolidateOrderItems = (items, dec = 2) => {
  if (!Array.isArray(items) || items.length <= 1) return items || [];

  const hasSplitDeals = items.some(
    (it, idx) =>
      (it.isDeal || it.isdeal || it.dealsbundlesid || (Array.isArray(it.bundleItems) && it.bundleItems.length > 0)) &&
      items.slice(idx + 1).some(
        (other) =>
          (other.isDeal || other.isdeal || other.dealsbundlesid || (Array.isArray(other.bundleItems) && other.bundleItems.length > 0)) &&
          ((it.dealsbundlesid != null && other.dealsbundlesid != null && String(it.dealsbundlesid) === String(other.dealsbundlesid)) ||
            (String(it.itemname || it.name || it.productname || "").trim().toLowerCase() ===
              String(other.itemname || other.name || other.productname || "").trim().toLowerCase()))
      )
  );

  if (!hasSplitDeals) return items;

  const result = [];
  const dealMap = new Map();

  items.forEach((item) => {
    const isDeal = Boolean(
      item.isDeal ||
      item.isdeal ||
      item.dealsbundlesid ||
      item.bundletype ||
      item.bundleType ||
      (Array.isArray(item.bundleItems) && item.bundleItems.length > 0) ||
      (Array.isArray(item.bundleitems) && item.bundleitems.length > 0)
    );

    if (!isDeal) {
      result.push(item);
      return;
    }

    const dId = item.dealsbundlesid != null ? String(item.dealsbundlesid) : null;
    const dName = String(item.itemname || item.name || item.productname || "").trim().toLowerCase();
    const groupKey = dId ? `deal_id_${dId}` : `deal_name_${dName}`;

    if (!dealMap.has(groupKey)) {
      const cloned = {
        ...item,
        bundleItems: Array.isArray(item.bundleItems)
          ? [...item.bundleItems]
          : (Array.isArray(item.bundleitems) ? [...item.bundleitems] : []),
        addons: Array.isArray(item.addons) ? [...item.addons] : [],
      };
      dealMap.set(groupKey, cloned);
      result.push(cloned);
    } else {
      const existing = dealMap.get(groupKey);

      // Merge bundleItems
      const incomingBundleItems = Array.isArray(item.bundleItems)
        ? item.bundleItems
        : (Array.isArray(item.bundleitems) ? item.bundleitems : []);
      incomingBundleItems.forEach((bi) => {
        const biName = String(bi.itemname || bi.name || "").trim().toLowerCase();
        const biId = bi.itemid != null ? String(bi.itemid) : null;
        const exists = existing.bundleItems.some((eBi) => {
          const eBiName = String(eBi.itemname || eBi.name || "").trim().toLowerCase();
          const eBiId = eBi.itemid != null ? String(eBi.itemid) : null;
          return (biId && eBiId && biId === eBiId) || (biName && eBiName && biName === eBiName);
        });
        if (!exists) {
          existing.bundleItems.push(bi);
        }
      });

      // Merge addons
      const incomingAddons = Array.isArray(item.addons) ? item.addons : [];
      incomingAddons.forEach((addon) => {
        const aName = String(addon.addonname || addon.name || "").trim().toLowerCase();
        const aId = addon.addonid != null ? String(addon.addonid) : (addon.id != null ? String(addon.id) : null);
        const exists = existing.addons.some((eAddon) => {
          const eAName = String(eAddon.addonname || eAddon.name || "").trim().toLowerCase();
          const eAId = eAddon.addonid != null ? String(eAddon.addonid) : (eAddon.id != null ? String(eAddon.id) : null);
          return (aId && eAId && aId === eAId) || (aName && eAName && aName === eAName);
        });
        if (!exists) {
          existing.addons.push(addon);
        }
      });

      // Price: use non-zero price if existing was 0
      if ((!existing.price || Number(existing.price) === 0) && Number(item.price) > 0) {
        existing.price = item.price;
      }

      if (String(item.itemStatus || item.itemstatus || item.status || "").toLowerCase() === "cancelled") {
        existing.itemStatus = "Cancelled";
        existing.itemstatus = "Cancelled";
        existing.cancelreason = existing.cancelreason || item.cancelreason || item.cancelReason || item.reason;
        existing.cancelledby = existing.cancelledby || item.cancelledby || item.cancelledBy;
        existing.cancelledat = existing.cancelledat || item.cancelledat || item.cancelledTime || item.cancelledAt;
      }
    }
  });

  // Re-calculate amounts for merged deals
  result.forEach((it) => {
    const isDeal = Boolean(it.isDeal || it.isdeal || it.dealsbundlesid || it.bundletype || it.bundleType);
    if (isDeal) {
      const qty = Number(it.qty ?? it.quantity) || 1;
      const price = parseFloat(it.price || 0);
      const addonsTotal = (it.addons || [])
        .filter((a) => a.selected === true || a.selected === undefined)
        .reduce((sum, a) => sum + (parseFloat(a.addonprice ?? a.price ?? 0) * qty), 0);
      it.amount = parseFloat((price * qty + addonsTotal).toFixed(dec));
    }
  });

  return result;
};