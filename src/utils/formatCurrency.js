/**
 * Currency Formatter Utility for SavoryOps User Website
 * Matches the formatting rules defined in the Admin/Owner Panel:
 * - Symbol
 * - Decimal places
 * - Thousand separator
 * - Decimal separator
 * - Currency position (left, right, left-space, right-space, before, after)
 */

/** @returns {'left'|'right'|'left-space'|'right-space'|null} */
function normalizeCurrencyPosition(raw) {
  if (raw === undefined || raw === null || raw === "") return null;
  let v = String(raw).trim().toLowerCase().replace(/_/g, "-");
  if (v === "leftspace" || v === "left space") v = "left-space";
  if (v === "rightspace" || v === "right space") v = "right-space";
  if (v === "before") v = "left";
  if (v === "after") v = "right";
  const allowed = ["left", "right", "left-space", "right-space"];
  return allowed.includes(v) ? v : null;
}

/** When currencyPosition is not specified, infer common rules from symbol. */
function inferPositionFromSymbol(symbol) {
  if (symbol === undefined || symbol === null) return null;
  const s = String(symbol).trim();
  if (!s) return null;
  if (s === "€" || s === "\u20AC" || s.includes("\u20AC")) return "right-space";
  return null;
}

/**
 * Format numeric amount using explicit currency settings
 */
export function formatCurrency(
  amount,
  decimal = 2,
  thousandseparator = ",",
  decimalseparator = ".",
  currencysymbol = "$",
  currencyposition = "left"
) {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return amount !== undefined && amount !== null ? String(amount) : "0.00";
  }

  const num = Number(amount);
  const position =
    normalizeCurrencyPosition(currencyposition) ??
    inferPositionFromSymbol(currencysymbol) ??
    "left";

  const dec = Number(decimal !== undefined && decimal !== null && !isNaN(decimal) ? decimal : 2);
  let formattedAmount;

  try {
    const formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
      useGrouping: true,
    });
    formattedAmount = formatter.format(num);

    if (thousandseparator && thousandseparator !== ",") {
      formattedAmount = formattedAmount.replace(/,/g, thousandseparator);
    }

    if (decimalseparator && decimalseparator !== ".") {
      formattedAmount = formattedAmount.replace(/\./g, decimalseparator);
    }
  } catch {
    formattedAmount = num.toFixed(dec);
    if (decimalseparator && decimalseparator !== ".") {
      formattedAmount = formattedAmount.replace(/\./g, decimalseparator);
    }
  }

  const symbol = currencysymbol !== undefined && currencysymbol !== null ? currencysymbol : "$";

  if (symbol) {
    switch (position) {
      case "left":
        return `${symbol}${formattedAmount}`;
      case "left-space":
        return `${symbol} ${formattedAmount}`;
      case "right":
        return `${formattedAmount}${symbol}`;
      case "right-space":
        return `${formattedAmount} ${symbol}`;
      default:
        return `${symbol}${formattedAmount}`;
    }
  }

  return formattedAmount;
}

/**
 * Helper to retrieve currently active branch from in-memory cache
 */
export function getActiveBranch() {
  if (typeof window !== "undefined" && window.__selectedBranch) {
    return window.__selectedBranch;
  }
  return null;
}

/**
 * Formats a monetary amount based on a branch object (e.g. from navbar / branchChange event).
 * If branch is missing, defaults to sensible USD formatting.
 */
export function formatPriceFromBranch(amount, branchDetails) {
  const branch = branchDetails || getActiveBranch();
  if (!branch || typeof branch !== "object") {
    return formatCurrency(amount, 2, ",", ".", "$", "left");
  }

  const decimal = branch.decimal !== undefined ? branch.decimal : 2;
  const thousandseparator = branch.thousandseparator || ",";
  const decimalseparator = branch.decimalseparator || ".";
  const currencysymbol = branch.currencysymbol || branch.currencySymbol || "$";
  const currencyposition = branch.currencyposition || branch.currencyPosition || "left";

  return formatCurrency(
    amount,
    decimal,
    thousandseparator,
    decimalseparator,
    currencysymbol,
    currencyposition
  );
}

export default formatPriceFromBranch;