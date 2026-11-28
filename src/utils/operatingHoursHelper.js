import moment from "moment-timezone";

const parseToMinutes = (t) => {
  if (!t) return null;
  let h = Number(t.openingtimeHour || t.closeingtimeHour || t.hours || 0);
  const m = Number(t.openingtimeMinute || t.closeingtimeMinute || t.minutes || 0);
  const p = (t.openingperiod || t.closeingperiod || t.period || "AM").toUpperCase();
  if (p === "PM" && h < 12) h += 12;
  if (p === "AM" && h === 12) h = 0;
  return h * 60 + m;
};

/**
 * Evaluates whether a branch is open, closed, on break, or accepting after-hours orders.
 * @param {Object} options
 * @param {Object} options.branchHoursDoc - { timezone, workinghours }
 * @param {Object} options.branchSetting - { afterHoursOrdering, ordertypes }
 * @param {String} [options.requestedOrderType] - "Delivery", "Pickup", etc.
 * @returns {Object} { isOpen, isAfterHours, canOrder, statusMessage, allowedOrderTypes, isBranchClosed }
 */
export function evaluateBranchOperatingHours({
  branchHoursDoc,
  branchSetting,
  requestedOrderType = null,
  translations = {},
} = {}) {
  // If no branchHoursDoc is configured, assume branch is open by default
  if (!branchHoursDoc || !Array.isArray(branchHoursDoc.workinghours) || branchHoursDoc.workinghours.length === 0) {
    const afterHours = branchSetting?.afterHoursOrdering;
    const allowed = Array.isArray(afterHours?.allowedOrderTypes) ? afterHours.allowedOrderTypes : [];
    return {
      isOpen: true,
      isAfterHours: false,
      canOrder: true,
      statusMessage: translations.branchisopen,
      allowedOrderTypes: allowed,
      isBranchClosed: false,
    };
  }

  const timezone = branchHoursDoc.timezone || "Australia/Sydney";
  const branchNow = moment().tz(timezone);
  const currentIsoWeekday = branchNow.isoWeekday(); // 1 = Monday ... 7 = Sunday
  const branchLocalDay = branchNow.format("dddd");

  const todaySchedule = (branchHoursDoc.workinghours || []).find(
    (wh) => Number(wh.dayid) === currentIsoWeekday
  );

  let isOpen = true;
  let statusMessage = translations.branchisopen;

  if (!todaySchedule || todaySchedule.dayoff) {
    isOpen = false;
    statusMessage = `${translations.branchclosedtoday} (${branchLocalDay})`;
  } else {
    const currentMinutes = branchNow.hours() * 60 + branchNow.minutes();
    const openMinutes = parseToMinutes(todaySchedule.openingtime);
    const closeMinutes = parseToMinutes(todaySchedule.closingtime);

    if (openMinutes != null && closeMinutes != null) {
      if (currentMinutes < openMinutes || currentMinutes > closeMinutes) {
        isOpen = false;
        const openH = todaySchedule.openingtime?.openingtimeHour || 12;
        const openM = String(todaySchedule.openingtime?.openingtimeMinute || 0).padStart(2, "0");
        const openP = todaySchedule.openingtime?.openingperiod || "AM";
        const closeH = todaySchedule.closingtime?.closeingtimeHour || 12;
        const closeM = String(todaySchedule.closingtime?.closeingtimeMinute || 0).padStart(2, "0");
        const closeP = todaySchedule.closingtime?.closeingperiod || "PM";
        statusMessage = `${translations.branchhourscomplete} (${openH}:${openM} ${openP} - ${closeH}:${closeM} ${closeP})`;
      }
    }

    if (isOpen && Array.isArray(todaySchedule.breaktimes)) {
      for (const bt of todaySchedule.breaktimes) {
        const bStart = parseToMinutes(bt.breakstarttime);
        const bEnd = parseToMinutes(bt.breakendtime);
        if (bStart != null && bEnd != null && currentMinutes >= bStart && currentMinutes <= bEnd) {
          isOpen = false;
          statusMessage = translations.branchonbreak;
          break;
        }
      }
    }
  }

  const afterHours = branchSetting?.afterHoursOrdering;
  const isAfterHoursEnabled = Boolean(afterHours?.status);
  const allowedOrderTypes = Array.isArray(afterHours?.allowedOrderTypes)
    ? afterHours.allowedOrderTypes
    : [];

  if (isOpen) {
    return {
      isOpen: true,
      isAfterHours: false,
      canOrder: true,
      statusMessage: translations.branchisopen,
      allowedOrderTypes,
      isBranchClosed: false,
    };
  }

  // Branch is closed
  if (!isAfterHoursEnabled) {
    return {
      isOpen: false,
      isAfterHours: false,
      canOrder: false,
      statusMessage,
      allowedOrderTypes: [],
      isBranchClosed: true,
    };
  }

  // After-hours ordering is active
  if (requestedOrderType) {
    const reqLower = String(requestedOrderType).trim().toLowerCase();
    const isTypeAllowed = allowedOrderTypes.some(
      (t) => t.toLowerCase() === reqLower
    );
    return {
      isOpen: false,
      isAfterHours: true,
      canOrder: isTypeAllowed,
      statusMessage: isTypeAllowed
        ? `${translations.afterhoursorderingactive}: ${requestedOrderType}`
        : `${requestedOrderType} - ${translations.notavailableafterhours} (${translations.available}: ${allowedOrderTypes.join(", ") || translations.none})`,
      allowedOrderTypes,
      isBranchClosed: true,
    };
  }

  return {
    isOpen: false,
    isAfterHours: true,
    canOrder: allowedOrderTypes.length > 0,
    statusMessage: `${translations.afterhoursorderingactive}: ${allowedOrderTypes.join(", ")}`,
    allowedOrderTypes,
    isBranchClosed: true,
  };
}

/**
 * Filter branch order types based on branch operating hours and after-hours ordering settings.
 * @param {Object} options
 * @param {Object} options.branchSetting
 * @param {Object} options.branchHoursDoc
 * @returns {{ activeOrderTypes: Array, isAfterHours: Boolean, isOpen: Boolean, statusMessage: String }}
 */
export function getAvailableOrderTypes({ branchSetting, branchHoursDoc, translations = {} } = {}) {
  const rawTypes = Array.isArray(branchSetting?.ordertypes)
    ? branchSetting.ordertypes.filter((t) => t.isEnabled === true)
    : [];

  const evaluation = evaluateBranchOperatingHours({
    branchHoursDoc,
    branchSetting,
    translations,
  });

  if (evaluation.isOpen) {
    return {
      activeOrderTypes: rawTypes,
      isAfterHours: false,
      isOpen: true,
      statusMessage: translations.branchisopen,
    };
  }

  if (evaluation.isAfterHours) {
    const allowed = (evaluation.allowedOrderTypes || []).map((t) =>
      String(t).toLowerCase()
    );
    const filtered = rawTypes.filter((ot) =>
      allowed.includes(String(ot.ordertypename).toLowerCase())
    );
    return {
      activeOrderTypes: filtered,
      isAfterHours: true,
      isOpen: false,
      statusMessage: evaluation.statusMessage,
    };
  }

  return {
    activeOrderTypes: [],
    isAfterHours: false,
    isOpen: false,
    statusMessage: evaluation.statusMessage,
  };
}