export const getReservationStatusConfig = (status, translations = {}) => {
  const norm = String(status || "").toLowerCase().replace(/[-\s_]/g, "");

  switch (norm) {
    case "pending":
      return {
        label: translations.pending || "Pending",
        color: "#d97706",
        bgColor: "#fef3c7",
        borderColor: "#fde68a",
        dotColor: "#f59e0b",
        iconType: "schedule",
      };
    case "confirmed":
      return {
        label: translations.confirmed || "Confirmed",
        color: "#059669",
        bgColor: "#d1fae5",
        borderColor: "#a7f3d0",
        dotColor: "#10b981",
        iconType: "check",
      };
    case "seated":
      return {
        label: translations.seated || "Seated",
        color: "#2563eb",
        bgColor: "#dbeafe",
        borderColor: "#bfdbfe",
        dotColor: "#3b82f6",
        iconType: "seat",
      };
    case "cancelled":
      return {
        label: translations.cancelled || "Cancelled",
        color: "#dc2626",
        bgColor: "#fee2e2",
        borderColor: "#fecaca",
        dotColor: "#ef4444",
        iconType: "cancel",
      };
    case "rejected":
      return {
        label: translations.rejected || "Rejected",
        color: "#dc2626",
        bgColor: "#fee2e2",
        borderColor: "#fecaca",
        dotColor: "#ef4444",
        iconType: "cancel",
      };
    case "noshow":
      return {
        label: translations.noshow || "No Show",
        color: "#6b7280",
        bgColor: "#f3f4f6",
        borderColor: "#e5e7eb",
        dotColor: "#9ca3af",
        iconType: "person_off",
      };
    default:
      return {
        label: status || translations.unknown || "Unknown",
        color: "#6b7280",
        bgColor: "#f3f4f6",
        borderColor: "#e5e7eb",
        dotColor: "#9ca3af",
        iconType: "info",
      };
  }
};

export const formatReservationDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateStr;
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