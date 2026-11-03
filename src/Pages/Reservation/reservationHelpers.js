import moment from "moment-timezone";

export const getStoredDateFormat = () => {
  if (typeof localStorage === "undefined") return "DD/MM/YYYY";
  return (
    localStorage.getItem("DateFormat") ||
    localStorage.getItem("dateFormat") ||
    "DD/MM/YYYY"
  );
};

export const getStoredTimeFormat = () => {
  if (typeof localStorage === "undefined") return "hh:mm A";
  return (
    localStorage.getItem("TimeFormat") ||
    localStorage.getItem("timeFormat") ||
    "hh:mm A"
  );
};

export const getStoredTimeZone = () => {
  if (typeof localStorage === "undefined") return "Asia/Kolkata";
  return (
    localStorage.getItem("TimeZone") ||
    localStorage.getItem("timeZone") ||
    localStorage.getItem("timezone") ||
    "Asia/Kolkata"
  );
};

export const getReservationStatusConfig = (status, translations = {}) => {
  const norm = String(status || "").toLowerCase().replace(/[-\s_]/g, "");

  switch (norm) {
    case "pending":
      return {
        label: translations.pending,
        color: "#d97706",
        bgColor: "#fef3c7",
        borderColor: "#fde68a",
        dotColor: "#f59e0b",
        iconType: "schedule",
      };
    case "confirmed":
      return {
        label: translations.confirmed,
        color: "#059669",
        bgColor: "#d1fae5",
        borderColor: "#a7f3d0",
        dotColor: "#10b981",
        iconType: "check",
      };
    case "seated":
      return {
        label: translations.seated,
        color: "#2563eb",
        bgColor: "#dbeafe",
        borderColor: "#bfdbfe",
        dotColor: "#3b82f6",
        iconType: "seat",
      };
    case "cancelled":
      return {
        label: translations.cancelled,
        color: "#dc2626",
        bgColor: "#fee2e2",
        borderColor: "#fecaca",
        dotColor: "#ef4444",
        iconType: "cancel",
      };
    case "rejected":
      return {
        label: translations.rejected,
        color: "#dc2626",
        bgColor: "#fee2e2",
        borderColor: "#fecaca",
        dotColor: "#ef4444",
        iconType: "cancel",
      };
    case "noshow":
      return {
        label: translations.noshow,
        color: "#6b7280",
        bgColor: "#f3f4f6",
        borderColor: "#e5e7eb",
        dotColor: "#9ca3af",
        iconType: "person_off",
      };
    default:
      return {
        label: status || translations.unknown,
        color: "#6b7280",
        bgColor: "#f3f4f6",
        borderColor: "#e5e7eb",
        dotColor: "#9ca3af",
        iconType: "info",
      };
  }
};

export const formatReservationDate = (dateStr, customDateFormat, customTimeZone) => {
  if (!dateStr) return "";
  const targetFormat = customDateFormat || getStoredDateFormat();
  const targetTz = customTimeZone || getStoredTimeZone();

  try {
    const trimmed = String(dateStr).trim();

    // If dateStr is a date-only string like "YYYY-MM-DD" or "YYYY/MM/DD",
    // parse as calendar date without timezone offset shift to preserve the exact booking date
    if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(trimmed)) {
      const parsed = moment(trimmed, ["YYYY-MM-DD", "YYYY/MM/DD"], true);
      if (parsed.isValid()) {
        return parsed.format(targetFormat);
      }
    }

    if (targetTz) {
      try {
        const m = moment.tz(trimmed, targetTz);
        if (m.isValid()) {
          return m.format(targetFormat);
        }
      } catch {
        // Fallback if targetTz is invalid
      }
    }

    const m = moment(trimmed);
    if (m.isValid()) {
      return m.format(targetFormat);
    }

    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return moment(d).format(targetFormat);
    }
  } catch (err) {
    console.warn("formatReservationDate error:", err);
  }

  return dateStr;
};

export const formatReservationTime = (timeStr, customTimeFormat, customTimeZone) => {
  if (!timeStr) return "";
  const targetFormat = customTimeFormat || getStoredTimeFormat();
  const targetTz = customTimeZone || getStoredTimeZone();

  try {
    const trimmed = String(timeStr).trim();

    const timeFormats = [
      "hh:mm:ss A",
      "h:mm:ss A",
      "hh:mm A",
      "h:mm A",
      "HH:mm:ss",
      "H:mm:ss",
      "HH:mm",
      "H:mm",
      "hh:mm:ssa",
      "h:mm:ssa",
      "hh:mma",
      "h:mma",
    ];

    const parsedTime = moment(trimmed, timeFormats, true);
    if (parsedTime.isValid()) {
      return parsedTime.format(targetFormat);
    }

    const parsedTimeLoose = moment(trimmed, timeFormats, false);
    if (parsedTimeLoose.isValid()) {
      return parsedTimeLoose.format(targetFormat);
    }

    // If timeStr is an ISO date-time string e.g. "2026-11-03T19:00:00.000Z"
    if (targetTz) {
      try {
        const m = moment.tz(trimmed, targetTz);
        if (m.isValid()) {
          return m.format(targetFormat);
        }
      } catch {
        // Fallback
      }
    }

    const m = moment(trimmed);
    if (m.isValid()) {
      return m.format(targetFormat);
    }
  } catch (err) {
    console.warn("formatReservationTime error:", err);
  }

  return timeStr;
};

export const formatReservationDateTime = (
  dateString,
  customDateFormat,
  customTimeFormat,
  customTimeZone
) => {
  if (!dateString) return "";
  const dFormat = customDateFormat || getStoredDateFormat();
  const tFormat = customTimeFormat || getStoredTimeFormat();
  const tz = customTimeZone || getStoredTimeZone();
  const combined = `${dFormat} ${tFormat}`;

  try {
    if (tz) {
      try {
        const m = moment.tz(dateString, tz);
        if (m.isValid()) return m.format(combined);
      } catch {
        // Fallback
      }
    }
    const m = moment(dateString);
    if (m.isValid()) return m.format(combined);
    return new Date(dateString).toLocaleString();
  } catch {
    return dateString;
  }
};

export const formatTime12h = (timeStr) => {
  if (!timeStr) return "";
  // If already in 12-hour AM/PM format (e.g. "07:30 PM")
  if (/(am|pm)/i.test(timeStr)) return timeStr.toUpperCase();

  // If in HH:mm 24-hour format
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    let hour = parseInt(parts[0], 10);
    const minute = parts[1].slice(0, 2);
    const period = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${String(hour).padStart(2, "0")}:${minute} ${period}`;
  }
  return timeStr;
};

export const getTodayDateInputString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};