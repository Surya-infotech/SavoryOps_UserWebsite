/**
 * Centralized Cart Billing & Tax Breakdown Calculator for SavoryOps UserWebsite
 * (Exact parity with SavoryOps_UserApp billingCalculator.js)
 * Handles:
 * - Subtotal calculation (item price + selected addons)
 * - Priority Charges resolution (Special Day Charges > regular Additional Charges)
 * - Before-Tax Charges (percentage & fixed)
 * - Exclusive Tax Calculation per item/branch/order type with proportionate before-tax base
 * - Total Exclusive Tax summary
 * - After-Tax Charges (percentage & fixed on subtotal + before-tax charges + exclusive tax)
 * - Round-Off calculation (nearest, up, down)
 * - Grand Total
 */

export const resolveActiveCharges = (payload) => {
  if (!payload) return { activeCharges: [], isSpecialDay: false };
  const now = new Date();
  const todayDayName = now.toLocaleDateString("en-US", { weekday: "long" });

  const getYmd = (d) => {
    if (!d) return "";
    if (typeof d === "string") {
      const s = d.trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    }
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return "";
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const todayYmd = `${y}-${m}-${d}`;

  const activeSpecialDay = (payload?.specialDayCharges || []).filter((c) => {
    if (!c.status) return false;
    const startYmd = getYmd(c.startDate);
    const endYmd = getYmd(c.endDate) || startYmd;
    if (!startYmd) return false;
    return todayYmd >= startYmd && todayYmd <= endYmd;
  });

  if (activeSpecialDay.length > 0) {
    return { activeCharges: activeSpecialDay, isSpecialDay: true };
  }

  const activeAdditional = (payload?.additionalCharges || []).filter(
    (c) => c.status && Array.isArray(c.applicableDays) && c.applicableDays.includes(todayDayName)
  );

  return { activeCharges: activeAdditional, isSpecialDay: false };
};

export const computeCartBilling = (items, payload, selectedOrderType = null) => {
  if (!items || items.length === 0) {
    return {
      subtotal: 0,
      beforeTaxCharges: [],
      taxRows: [],
      totalExclusiveTax: 0,
      afterTaxCharges: [],
      additionalCharges: [],
      specialDayCharges: [],
      roundoff: { status: false, roundedAmount: 0, roundtype: null, roundoffType: null },
      grandTotal: 0,
    };
  }

  // STAGE 1: Cart Subtotal
  const subtotal = items.reduce((sum, item) => {
    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.quantity) || 1;
    const addonsTotal = (item.addons || []).reduce((aSum, a) => {
      if (a && a.selected !== false) return aSum + (Number(a.price) || 0) * itemQty;
      return aSum;
    }, 0);
    return sum + itemPrice * itemQty + addonsTotal;
  }, 0);

  // STAGE 2: Priority Charges & BEFORE TAX Charges
  const { activeCharges, isSpecialDay } = resolveActiveCharges(payload);
  let totalBeforeTaxChargeAmount = 0;
  const beforeTaxCharges = activeCharges
    .filter((c) => (c.applicationtiming || "before_tax") === "before_tax")
    .map((c) => {
      const val = Number(c.chargevalue ?? c.chargeValue ?? c.val ?? c.value ?? c.price ?? c.amount) || 0;
      const isPct = String(c.chargetype || c.chargeType || c.type || c.charge_type || "percentage").toLowerCase().trim() === "percentage";
      const amount = isPct ? (subtotal * val) / 100 : val;
      totalBeforeTaxChargeAmount += amount;
      const id = isSpecialDay
        ? (c.specialdayid || c._id || c.id || c.eventname || c.chargename)
        : (c.chargeid || c._id || c.id || c.chargename || c.name);
      const name = isSpecialDay
        ? (c.eventname || c.chargename || c.name || "")
        : (c.chargename || c.name || "");
      return {
        ...c,
        id,
        ...(isSpecialDay ? { specialdayid: id, eventname: name } : { chargeid: id, chargename: name }),
        name,
        chargename: name,
        eventname: name,
        chargetype: isPct ? "percentage" : "fixed",
        applicationtiming: "before_tax",
        chargevalue: val,
        val,
        value: val,
        amount: Number(amount.toFixed(2)),
      };
    });

  // STAGE 3: Exclusive Taxes Calculation
  const mode = payload?.taxApplicationMode || "apply_all";
  const orderTypeTaxOverridesBranch = Boolean(payload?.orderTypeTaxOverridesBranch);
  const itemTaxOverridesBranch = Boolean(payload?.itemTaxOverridesBranch);
  const itemTaxOverridesOrderType = Boolean(payload?.itemTaxOverridesOrderType);

  const branchTaxes = Array.isArray(payload?.branchTaxes)
    ? payload.branchTaxes
    : Array.isArray(payload?.taxes)
      ? payload.taxes
      : [];

  let orderTypeTaxes = [];
  const orderTypeDetails = Array.isArray(payload?.orderTypeDetails)
    ? payload.orderTypeDetails
    : Array.isArray(payload?.ordertypes)
      ? payload.ordertypes
      : [];

  if (selectedOrderType) {
    const orderTypeStr = typeof selectedOrderType === "object"
      ? String(selectedOrderType?.ordertypename || selectedOrderType?.ordertypeid || "").trim()
      : String(selectedOrderType).trim();
    const normalized = orderTypeStr.toLowerCase().replace(/[\s_-]+/g, "");

    if (normalized !== "quickorder" && normalized !== "quick") {
      const matchedOrderType = orderTypeDetails.find((ot) => {
        const idMatch = String(ot?.ordertypeid) === orderTypeStr ||
          (typeof selectedOrderType === "object" && String(ot?.ordertypeid) === String(selectedOrderType?.ordertypeid));
        const nameMatch = String(ot?.ordertypename ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "") === normalized;
        return idMatch || nameMatch;
      });
      if (matchedOrderType && Array.isArray(matchedOrderType.taxes)) {
        orderTypeTaxes = matchedOrderType.taxes;
      }
    }
  } else {
    const dineInOrderType = orderTypeDetails.find((ot) => {
      const name = String(ot?.ordertypename ?? "").toLowerCase().replace(/[\s_-]+/g, "");
      return name === "dinein";
    }) || orderTypeDetails.find((ot) => Array.isArray(ot?.taxes) && ot.taxes.length > 0) || orderTypeDetails[0];

    if (dineInOrderType && Array.isArray(dineInOrderType.taxes)) {
      orderTypeTaxes = dineInOrderType.taxes;
    }
  }

  let totalExclusiveTax = 0;
  const taxSummaryMap = new Map();

  const addTaxBreakdown = (tax, baseAmount, level, itemQty = 1) => {
    if (!tax || !tax.taxname) return;
    const taxcomputation = String(tax.taxcomputation ?? "exclusive").toLowerCase();
    if (taxcomputation === "inclusive") return;

    const taxid = tax.taxid ?? tax.taxname;
    const taxname = tax.taxname;
    const taxtype = String(tax.taxtype ?? "percentage").toLowerCase() === "fixed" ? "fixed" : "percentage";
    const rate = Number(tax.price) || 0;
    const isPct = taxtype === "percentage";

    const amount = isPct ? (baseAmount * rate) / 100 : (rate * itemQty);
    totalExclusiveTax += amount;

    if (taxSummaryMap.has(taxid)) {
      taxSummaryMap.get(taxid).amount += amount;
      taxSummaryMap.get(taxid).calculatedAmount = taxSummaryMap.get(taxid).amount;
    } else {
      taxSummaryMap.set(taxid, {
        taxid,
        taxname,
        taxtype,
        taxcomputation,
        taxLevel: level || "branch",
        rate,
        price: rate,
        amount,
        calculatedAmount: amount,
        isPct,
      });
    }
  };

  for (const item of items) {
    const itemTaxes = Array.isArray(item.taxes) ? item.taxes : [];
    const itemQty = Number(item.quantity) || 1;
    const lineSub = (Number(item.price) || 0) * itemQty + (item.addons || []).reduce((aSum, a) => (a && a.selected !== false) ? aSum + (Number(a.price) || 0) * itemQty : aSum, 0);

    let applicableTaxes = [];
    if (mode === "branch_level") {
      applicableTaxes = branchTaxes.map((t) => ({ ...t, taxLevel: "branch" }));
    } else if (mode === "ordertype_level") {
      const src = orderTypeTaxes.length > 0 ? orderTypeTaxes : branchTaxes;
      const lvl = orderTypeTaxes.length > 0 ? "ordertype" : "branch";
      applicableTaxes = src.map((t) => ({ ...t, taxLevel: lvl }));
    } else if (mode === "item_level") {
      applicableTaxes = itemTaxes.map((t) => ({ ...t, taxLevel: "item" }));
    } else {
      let finalBranch = branchTaxes.map((t) => ({ ...t, taxLevel: "branch" }));
      let finalOrderType = orderTypeTaxes.map((t) => ({ ...t, taxLevel: "ordertype" }));
      let finalItem = itemTaxes.map((t) => ({ ...t, taxLevel: "item" }));

      if (itemTaxOverridesBranch && finalItem.length > 0) finalBranch = [];
      if (itemTaxOverridesOrderType && finalItem.length > 0) finalOrderType = [];
      if (orderTypeTaxOverridesBranch && finalOrderType.length > 0) finalBranch = [];

      applicableTaxes = [...finalBranch, ...finalOrderType, ...finalItem];
    }

    const dedupedTaxes = Array.from(
      new Map(applicableTaxes.map((t) => [t.taxid ?? t.taxname, t])).values()
    );

    item.appliedTaxes = dedupedTaxes;

    const lineRatio = subtotal > 0 ? lineSub / subtotal : 0;
    const lineTaxableBase = lineSub + lineRatio * totalBeforeTaxChargeAmount;

    dedupedTaxes.forEach((tax) => {
      addTaxBreakdown(tax, lineTaxableBase, tax.taxLevel, itemQty);
    });
  }

  // STAGE 4: AFTER TAX Charges
  const afterTaxBase = subtotal + totalBeforeTaxChargeAmount + totalExclusiveTax;
  let totalAfterTaxChargeAmount = 0;
  const afterTaxCharges = activeCharges
    .filter((c) => c.applicationtiming === "after_tax")
    .map((c) => {
      const val = Number(c.chargevalue ?? c.chargeValue ?? c.val ?? c.value ?? c.price ?? c.amount) || 0;
      const isPct = String(c.chargetype || c.chargeType || c.type || c.charge_type || "percentage").toLowerCase().trim() === "percentage";
      const amount = isPct ? (afterTaxBase * val) / 100 : val;
      totalAfterTaxChargeAmount += amount;
      const id = isSpecialDay
        ? (c.specialdayid || c._id || c.id || c.eventname || c.chargename)
        : (c.chargeid || c._id || c.id || c.chargename || c.name);
      const name = isSpecialDay
        ? (c.eventname || c.chargename || c.name || "")
        : (c.chargename || c.name || "");
      return {
        ...c,
        id,
        ...(isSpecialDay ? { specialdayid: id, eventname: name } : { chargeid: id, chargename: name }),
        name,
        chargename: name,
        eventname: name,
        chargetype: isPct ? "percentage" : "fixed",
        applicationtiming: "after_tax",
        chargevalue: val,
        val,
        value: val,
        amount: Number(amount.toFixed(2)),
      };
    });

  const allMappedCharges = [...beforeTaxCharges, ...afterTaxCharges];
  const specialDayCharges = isSpecialDay ? allMappedCharges : [];
  const additionalCharges = !isSpecialDay ? allMappedCharges : [];

  // STAGE 5: Round Off & Grand Total
  const rawGrand = subtotal + totalBeforeTaxChargeAmount + totalExclusiveTax + totalAfterTaxChargeAmount;
  let grandTotal = rawGrand;
  let roundoffObj = { status: false, roundedAmount: 0, roundtype: null, roundoffType: null };

  if (payload?.roundoff && (payload.roundoff.status === true || payload.roundoff.status === "true")) {
    const rawRoundType = String(
      payload.roundoff.roundoffType ||
      payload.roundoff.roundtype ||
      payload.roundoff.roundOffType ||
      "round_up"
    ).toLowerCase().trim();

    let rType = "round_up";
    if (rawRoundType === "round_down" || rawRoundType === "down" || rawRoundType.includes("down")) {
      rType = "round_down";
      grandTotal = Math.floor(rawGrand);
    } else if (rawRoundType === "nearest_05" || rawRoundType.includes("05") || rawRoundType.includes("0.05") || rawRoundType.includes("5 cent")) {
      rType = "nearest_05";
      grandTotal = Math.round(Math.ceil(rawGrand / 0.05) * 0.05 * 100) / 100;
    } else if (rawRoundType === "nearest_10" || rawRoundType.includes("10") || rawRoundType.includes("0.10") || rawRoundType.includes("10 cent")) {
      rType = "nearest_10";
      grandTotal = Math.round(Math.ceil(rawGrand / 0.10) * 0.10 * 100) / 100;
    } else if (rawRoundType === "nearest_integer" || rawRoundType === "nearest" || rawRoundType.includes("whole") || rawRoundType.includes("integer")) {
      rType = "nearest_integer";
      grandTotal = Math.round(rawGrand);
    } else {
      rType = "round_up";
      grandTotal = Math.ceil(rawGrand);
    }

    grandTotal = Math.round(grandTotal * 100) / 100;
    const roundedDiff = Number((grandTotal - rawGrand).toFixed(2));

    roundoffObj = {
      status: true,
      roundtype: rType,
      roundoffType: rType,
      roundedAmount: roundedDiff,
    };
  }

  const rows = Array.from(taxSummaryMap.values());

  return {
    subtotal: Number(subtotal.toFixed(2)),
    beforeTaxCharges,
    taxRows: rows,
    totalExclusiveTax: Number(totalExclusiveTax.toFixed(2)),
    afterTaxCharges,
    additionalCharges,
    specialDayCharges,
    roundoff: roundoffObj,
    grandTotal: Number(grandTotal.toFixed(2)),
  };
};

export default {
  resolveActiveCharges,
  computeCartBilling,
};
