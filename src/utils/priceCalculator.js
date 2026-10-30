/**
 * Centralized Price & Tax Calculator for SavoryOps UserWebsite
 * (Exact parity with SavoryOps UserApp priceCalculator.js)
 * Handles item price calculation considering:
 * - Base price (branch-level price override or item price)
 * - Tax Application Mode (apply_all, branch_level, ordertype_level, item_level)
 * - Tax Overrides (itemTaxOverridesBranch, itemTaxOverridesOrderType, orderTypeTaxOverridesBranch)
 * - Inclusive vs Exclusive tax computation (percentage & fixed)
 * - Inclusive tax price increment (inclusiveTaxIncreasesPrice)
 * - Selected Order Type (Delivery, Pickup, Dine-in, etc.)
 */

export const calculateItemPrice = (item, posPayload, selectedOrderType = null) => {
  const rawPrice = Number(item?.rawPrice ?? item?.price) || 0;
  if (!posPayload?.inclusiveTaxIncreasesPrice) {
    return rawPrice;
  }

  const branchTaxes = Array.isArray(posPayload?.branchTaxes)
    ? posPayload.branchTaxes
    : Array.isArray(posPayload?.taxes)
      ? posPayload.taxes
      : [];
  const itemTaxes = Array.isArray(item?.taxes) ? item.taxes : [];

  let orderTypeTaxes = [];
  const orderTypeDetails = Array.isArray(posPayload?.orderTypeDetails)
    ? posPayload.orderTypeDetails
    : Array.isArray(posPayload?.ordertypes)
      ? posPayload.ordertypes
      : [];

  if (selectedOrderType) {
    const orderTypeStr =
      typeof selectedOrderType === "object"
        ? String(selectedOrderType?.ordertypename || selectedOrderType?.ordertypeid || "").trim()
        : String(selectedOrderType).trim();
    const normalized = orderTypeStr.toLowerCase().replace(/[\s_-]+/g, "");

    if (normalized !== "quickorder" && normalized !== "quick") {
      const matchedOrderType = orderTypeDetails.find((ot) => {
        const idMatch =
          String(ot?.ordertypeid) === orderTypeStr ||
          (typeof selectedOrderType === "object" &&
            String(ot?.ordertypeid) === String(selectedOrderType?.ordertypeid));
        const nameMatch =
          String(ot?.ordertypename ?? "")
            .trim()
            .toLowerCase()
            .replace(/[\s_-]+/g, "") === normalized;
        return idMatch || nameMatch;
      });
      if (matchedOrderType && Array.isArray(matchedOrderType.taxes)) {
        orderTypeTaxes = matchedOrderType.taxes;
      }
    }
  } else {
    // When no specific order type is selected, resolve Dine In order type
    const dineInOrderType =
      orderTypeDetails.find((ot) => {
        const name = String(ot?.ordertypename ?? "")
          .toLowerCase()
          .replace(/[\s_-]+/g, "");
        return name === "dinein";
      }) ||
      orderTypeDetails.find((ot) => Array.isArray(ot?.taxes) && ot.taxes.length > 0) ||
      orderTypeDetails[0];

    if (dineInOrderType && Array.isArray(dineInOrderType.taxes)) {
      orderTypeTaxes = dineInOrderType.taxes;
    }
  }

  const mode = posPayload?.taxApplicationMode || "apply_all";
  const orderTypeTaxOverridesBranch = Boolean(posPayload?.orderTypeTaxOverridesBranch);
  const itemTaxOverridesBranch = Boolean(posPayload?.itemTaxOverridesBranch);
  const itemTaxOverridesOrderType = Boolean(posPayload?.itemTaxOverridesOrderType);

  let applicable = [];
  if (mode === "branch_level") {
    applicable = branchTaxes;
  } else if (mode === "ordertype_level") {
    applicable = orderTypeTaxes.length > 0 ? orderTypeTaxes : branchTaxes;
  } else if (mode === "item_level") {
    applicable = itemTaxes;
  } else {
    let finalBranch = [...branchTaxes];
    let finalOrderType = [...orderTypeTaxes];
    let finalItem = [...itemTaxes];

    if (itemTaxOverridesBranch && finalItem.length > 0) finalBranch = [];
    if (itemTaxOverridesOrderType && finalItem.length > 0) finalOrderType = [];
    if (orderTypeTaxOverridesBranch && finalOrderType.length > 0) finalBranch = [];

    applicable = [...finalBranch, ...finalOrderType, ...finalItem];
  }

  const combinedTaxes = Array.from(
    new Map(applicable.map((t) => [t.taxid ?? t.taxname, t])).values()
  );

  const incPercent = combinedTaxes
    .filter(
      (t) =>
        String(t.taxcomputation ?? "exclusive").toLowerCase() === "inclusive" &&
        String(t.taxtype ?? "percentage").toLowerCase() === "percentage"
    )
    .reduce((sum, t) => sum + (Number(t.price) || 0) / 100, 0);

  const incFixed = combinedTaxes
    .filter(
      (t) =>
        String(t.taxcomputation ?? "exclusive").toLowerCase() === "inclusive" &&
        String(t.taxtype ?? "fixed").toLowerCase() === "fixed"
    )
    .reduce((sum, t) => sum + (Number(t.price) || 0), 0);

  const displayPrice = rawPrice * (1 + incPercent) + incFixed;
  return Number(displayPrice.toFixed(2));
};

export default {
  calculateItemPrice,
};