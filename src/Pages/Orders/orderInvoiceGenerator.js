import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { formatOrderDateTime, formatOrderPrice } from "./orderHelpers.js";

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Normalizes a base64 string or data URI into a valid data URI.
 */
export const normalizeBase64Image = (base64) => {
  if (!base64 || typeof base64 !== "string") return null;
  const trimmed = base64.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return trimmed;

  // Detect mime type from raw base64 header or default to png
  let mime = "image/png";
  if (trimmed.startsWith("/9j/")) {
    mime = "image/jpeg";
  } else if (trimmed.startsWith("iVBOR")) {
    mime = "image/png";
  } else if (trimmed.startsWith("R0lGOD")) {
    mime = "image/gif";
  } else if (trimmed.startsWith("UklGR")) {
    mime = "image/webp";
  } else if (trimmed.startsWith("PHN2Zy") || trimmed.startsWith("PD94b")) {
    mime = "image/svg+xml";
  }

  return `data:${mime};base64,${trimmed}`;
};

/**
 * Extracts and resolves the base64 logo from orderData if provided by the backend.
 */
export const getLogoBase64FromOrder = (orderData) => {
  if (!orderData || typeof orderData !== "object") return null;
  const candidate = orderData.logobase64;
  if (candidate && typeof candidate === "string" && candidate.trim()) {
    return normalizeBase64Image(candidate);
  }
  return null;
};

/**
 * Loads an image URL as base64 data URL to prevent cross-origin canvas tainting in html2canvas.
 */
export const loadLogoAsBase64 = async (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:")) return normalizeBase64Image(trimmed);

  try {
    const response = await fetch(trimmed, { mode: "cors" });
    if (!response.ok) throw new Error("Fetch failed");
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    try {
      return await new Promise((resolve) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth || img.width;
            canvas.height = img.naturalHeight || img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/png"));
          } catch {
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = trimmed;
      });
    } catch {
      return null;
    }
  }
};

/**
 * CSS stylesheet exactly matching SavoryOps_UserApp/src/utils/invoiceTemplate.js
 */
export const generateInvoiceStyles = () => `
  @page {
    size: A4;
    margin: 0;
  }
  .invoice-wrapper {
    box-sizing: border-box;
    font-family: Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    margin: 0 auto;
    padding: 0;
    background-color: #ffffff;
    color: #333333;
    font-size: 12px;
    line-height: 1.35;
    width: 100%;
    max-width: 794px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .invoice-wrapper * {
    box-sizing: border-box;
  }
  .invoice-wrapper .header {
    text-align: center;
    border-bottom: 2px solid #28a745;
    padding-bottom: 10px;
    margin-bottom: 15px;
    background-color: #ffffff;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    position: relative;
    min-height: 95px;
    box-sizing: border-box;
  }
  .invoice-wrapper .logo {
    position: absolute;
    left: 15px;
    top: 15px;
    width: 70px;
    height: 70px;
    max-width: 70px;
    max-height: 70px;
    object-fit: contain;
    border-radius: 4px;
    display: block;
  }
  .invoice-wrapper .header-content {
    margin: 0 95px;
    min-height: 65px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  .invoice-wrapper .header-content.no-logo {
    margin: 0 95px;
  }
  .invoice-wrapper .header h1 {
    color: #28a745;
    margin: 0 0 5px 0;
    font-size: 20px;
    font-weight: bold;
    text-transform: capitalize;
    letter-spacing: 0.2px;
  }
  .invoice-wrapper .header h2 {
    color: #333333;
    margin: 0 0 6px 0;
    font-size: 16px;
    font-weight: 600;
  }
  .invoice-wrapper .header p {
    margin: 0;
    font-size: 11px;
    color: #666666;
  }
  .invoice-wrapper .header-date {
    position: absolute;
    right: 15px;
    bottom: 15px;
    text-align: right;
    font-size: 11px;
    color: #444444;
  }
  .invoice-wrapper .customer-info {
    margin-bottom: 15px;
  }
  .invoice-wrapper .customer-info-row {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }
  .invoice-wrapper .customer-info-row .info-item {
    flex: 1 1 30%;
    min-width: 120px;
  }
  .invoice-wrapper .info-row-wrapper {
    display: flex;
    gap: 15px;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }
  .invoice-wrapper .info-card {
    flex: 1 1 0;
    background-color: #ffffff;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    min-width: 0;
    box-sizing: border-box;
  }
  .invoice-wrapper .info-card h3 {
    color: #28a745;
    border-bottom: 1px solid #eeeeee;
    padding-bottom: 5px;
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
  }
  .invoice-wrapper .info-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  .invoice-wrapper .info-item {
    display: flex;
    align-items: flex-start;
    padding: 2px 0;
    font-size: 11px;
    line-height: 1.35;
  }
  .invoice-wrapper .order-info-row {
    justify-content: space-between;
    gap: 10px;
  }
  .invoice-wrapper .info-pair {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .invoice-wrapper .info-pair-right {
    justify-content: flex-end;
  }
  .invoice-wrapper .info-label {
    font-weight: bold;
    color: #555555;
    font-size: 11px;
    flex-shrink: 0;
  }
  .invoice-wrapper .info-value {
    color: #333333;
    font-size: 11px;
    margin-left: 5px;
    word-break: break-word;
  }
  .invoice-wrapper .status-badge {
    background-color: #28a745;
    color: #ffffff;
    padding: 2px 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: bold;
    margin-left: 5px;
    text-transform: capitalize;
  }
  .invoice-wrapper .status-pending {
    background-color: #ffc107;
    color: #333333;
  }
  .invoice-wrapper .status-completed {
    background-color: #28a745;
    color: #ffffff;
  }
  .invoice-wrapper .status-unpaid {
    background-color: #dc3545;
    color: #ffffff;
  }
  .invoice-wrapper .status-paid {
    background-color: #28a745;
    color: #ffffff;
  }
  .invoice-wrapper .status-refunded {
    background-color: #8b5cf6;
    color: #ffffff;
  }
  .invoice-wrapper .status-void {
    background-color: #64748b;
    color: #ffffff;
  }
  .invoice-wrapper .items-section-title {
    color: #28a745;
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: bold;
  }
  .invoice-wrapper .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 15px;
    background-color: #ffffff;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #dddddd;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    font-size: 11px;
  }
  .invoice-wrapper .items-table th,
  .invoice-wrapper .items-table td {
    border: 1px solid #dddddd;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
  }
  .invoice-wrapper .price-column,
  .invoice-wrapper .amount-column {
    text-align: right !important;
  }
  .invoice-wrapper .items-table th {
    background-color: #28a745;
    color: #ffffff;
    font-weight: bold;
    font-size: 11px;
  }
  .invoice-wrapper .items-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .invoice-wrapper .addon-item {
    margin-left: 15px;
    font-style: italic;
    color: #666666;
    font-size: 10px;
    display: block;
    margin-top: 2px;
  }
  .invoice-wrapper .special-instructions {
    color: #dc3545;
    font-style: italic;
    margin-top: 3px;
    font-size: 10px;
    display: block;
  }
  .invoice-wrapper .summary {
    margin-top: 15px;
    background-color: #ffffff;
    padding: 15px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    box-sizing: border-box;
  }
  .invoice-wrapper .summary h3 {
    color: #28a745;
    border-bottom: 1px solid #eeeeee;
    padding-bottom: 5px;
    margin: 0 0 10px 0;
    font-size: 14px;
    font-weight: 600;
  }
  .invoice-wrapper .summary-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
    padding: 2px 0;
    font-size: 11px;
    color: #444444;
  }
  .invoice-wrapper .total-row {
    font-weight: bold;
    font-size: 14px;
    border-top: 2px solid #28a745;
    padding-top: 8px;
    margin-top: 8px;
    color: #28a745;
  }
  .invoice-wrapper .footer {
    margin-top: 15px;
    text-align: center;
    color: #666666;
    background-color: #ffffff;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    font-size: 10px;
    box-sizing: border-box;
  }
  .invoice-wrapper .footer p {
    margin: 3px 0;
  }
  @media print {
    .invoice-wrapper {
      padding: 0;
      background-color: #ffffff;
    }
    .invoice-wrapper .header,
    .invoice-wrapper .info-card,
    .invoice-wrapper .summary,
    .invoice-wrapper .footer {
      box-shadow: none;
      border: 1px solid #dddddd;
    }
    .no-print {
      display: none !important;
    }
  }
`;

/**
 * Builds the inner invoice HTML matching SavoryOps_UserApp/src/utils/invoiceTemplate.js
 */
export const generateInvoiceBodyHTML = (
  orderData,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "hh:mm A",
  timeZone = "Asia/Kolkata",
  translations = {},
  invoiceGeneratedAt = new Date().toISOString(),
  logoBase64Uri = null
) => {
  const getTranslation = (key, fallback = "") =>
    (translations && translations[key]) || fallback || "";
  const formatPrice = (price) => formatOrderPrice(price, orderData);

  const formatCustomerField = (value) => {
    if (value === undefined || value === null) return "N/A";
    const normalized = typeof value === "string" ? value.trim() : value.toString();
    return normalized === "" ? "N/A" : normalized;
  };

  // Table details from areatabledetails or tableno/areaname (matching UserApp)
  const getTableDetailsHTML = () => {
    const areaDetails = orderData.areatabledetails;
    if (Array.isArray(areaDetails) && areaDetails.length > 0) {
      return areaDetails
        .map((area) => {
          const tableNos =
            area.tables && area.tables.length
              ? area.tables.map((t) => t.tableno).join(", ")
              : "";
          return `<div class="info-item"><span class="info-label">${escapeHtml(area.areaname || "")}:</span><span class="info-value">${escapeHtml(tableNos || "-")}</span></div>`;
        })
        .join("");
    }
    if (orderData.tableno || orderData.areaname) {
      return `<div class="info-item"><span class="info-label">${escapeHtml(getTranslation("tableno") || "Table No")}:</span><span class="info-value">${escapeHtml(orderData.tableno || "")} ${orderData.areaname ? `(${escapeHtml(orderData.areaname)})` : ""}</span></div>`;
    }
    return "";
  };

  const tableDetailsHTML = getTableDetailsHTML();
  const formattedInvoiceGeneratedAt = formatOrderDateTime(
    invoiceGeneratedAt,
    dateFormat,
    timeFormat,
    timeZone
  );

  const branchdetails = orderData?.branchdetails;
  const branchPhoneDisplay = formatCustomerField(branchdetails?.phone);

  const formatBranchAddress = (details) => {
    if (!details || typeof details !== "object") return "N/A";
    const address = (details.address || "").trim();
    const cityname = (details.cityname || "").trim();
    const statename = (details.statename || "").trim();
    const postalcode = (details.postalcode || "").trim();
    const countryname = (details.countryname || "").trim();

    let cityStateZip = [cityname, statename].filter(Boolean).join(", ");
    if (postalcode) {
      cityStateZip = cityStateZip ? `${cityStateZip} - ${postalcode}` : postalcode;
    }

    const parts = [address, cityStateZip, countryname].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const branchAddressDisplay = formatBranchAddress(branchdetails);

  // Restaurant logo (explicit base64 -> backend logobase64 -> logourl fallback)
  const resolvedLogoUrl =
    (logoBase64Uri ? (normalizeBase64Image(logoBase64Uri) || logoBase64Uri) : null) ||
    getLogoBase64FromOrder(orderData) ||
    orderData?.logourl ||
    "";
  const invoiceLogoHtml = resolvedLogoUrl
    ? `<img class="logo" src="${escapeHtml(resolvedLogoUrl)}" alt="Logo" onerror="this.style.display='none'" />`
    : "";

  const rawCustomerEmail = orderData?.customerEmail ?? orderData?.customer?.email ?? "";
  const customerEmail =
    typeof rawCustomerEmail === "string"
      ? rawCustomerEmail.trim()
      : rawCustomerEmail
        ? String(rawCustomerEmail).trim()
        : "";
  const hasCustomerEmail = customerEmail !== "" && customerEmail.toLowerCase() !== "n/a";

  const isItemCancelled = (it) =>
    String(it?.itemstatus || it?.itemStatus || it?.status || "").toLowerCase() === "cancelled";

  const activeProducts = (
    Array.isArray(orderData.products) && orderData.products.length > 0
      ? orderData.products
      : Array.isArray(orderData.items)
        ? orderData.items
        : []
  ).filter((p) => !isItemCancelled(p));

  let itemsRows = "";
  if (activeProducts.length > 0) {
    activeProducts.forEach((product) => {
      const productName = product.productname || product.itemname || product.name || "Item";
      const productPrice = product.price || 0;
      const productQuantity = product.quantity || product.qty || 1;
      const productAmount =
        product.amount !== undefined ? product.amount : (parseFloat(productPrice) || 0) * productQuantity;

      let addonsHtml = "";
      if (Array.isArray(product.addons) && product.addons.length > 0) {
        product.addons.forEach((addon) => {
          const addonName = addon.addonname || addon.name || "";
          const addonPrice = addon.addonprice || addon.price || 0;
          addonsHtml += `<span class="addon-item">+ ${escapeHtml(addonName)} (${formatPrice(addonPrice)})</span>`;
        });
      }

      let specialInstructionsHtml = "";
      if (product.specialInstructions) {
        specialInstructionsHtml = `<span class="special-instructions">${escapeHtml(getTranslation("specialinstructions") || "Special Instructions")}: ${escapeHtml(product.specialInstructions)}</span>`;
      }

      itemsRows += `
        <tr>
          <td>
            <strong>${escapeHtml(productName)}</strong>
            ${addonsHtml}
            ${specialInstructionsHtml}
          </td>
          <td style="text-align: center;">${productQuantity}</td>
          <td class="price-column">${formatPrice(productPrice)}</td>
          <td class="amount-column">${formatPrice(productAmount)}</td>
        </tr>
      `;
    });
  } else {
    itemsRows = `
      <tr>
        <td colspan="4" style="text-align: center; color: #888888; padding: 12px;">
          ${escapeHtml(getTranslation("noitemfound") || "No items found")}
        </td>
      </tr>
    `;
  }

  // Before-tax charges
  const beforeTaxCharges = (orderData?.additionalCharges || [])
    .concat(orderData?.specialDayCharges || [])
    .filter((c) => c.applicationtiming === "before_tax");

  let beforeTaxRows = "";
  beforeTaxCharges.forEach((chg) => {
    const rawVal = chg.chargevalue ?? chg.val ?? chg.value;
    const valLabel =
      rawVal != null && rawVal !== ""
        ? chg.chargetype === "percentage"
          ? ` (${rawVal}%)`
          : chg.chargetype === "fixed"
            ? ` (${formatPrice(rawVal)})`
            : ` (${rawVal})`
        : "";
    beforeTaxRows += `
      <div class="summary-row">
        <span>${escapeHtml(chg.name || chg.chargename || chg.eventname || "Charge")}${valLabel}</span>
        <span>${formatPrice(chg.amount || 0)}</span>
      </div>
    `;
  });

  // Deduplicated Exclusive Taxes (parity with UserApp invoiceTemplate.js)
  const invoiceTaxes = (() => {
    let list;
    if (Array.isArray(orderData.taxes) && orderData.taxes.length > 0) {
      list = [...orderData.taxes];
    } else {
      const branch = Array.isArray(orderData.branchTaxes) ? orderData.branchTaxes : [];
      const orderType = Array.isArray(orderData.orderTypeTaxes) ? orderData.orderTypeTaxes : [];
      const itemLvl = Array.isArray(orderData.itemTaxes) ? orderData.itemTaxes : [];
      list = [...branch, ...orderType, ...itemLvl];
    }
    if (list.length === 0 && Array.isArray(orderData.items)) {
      const itemTaxMap = new Map();
      for (const item of orderData.items || []) {
        if (isItemCancelled(item)) continue;
        const itemTaxesList =
          item.appliedTaxes && item.appliedTaxes.length > 0 ? item.appliedTaxes : item.taxes || [];
        for (const t of itemTaxesList) {
          if (!t || !t.taxname) continue;
          const key = t.taxid ?? t.taxname;
          if (itemTaxMap.has(key)) {
            const existing = itemTaxMap.get(key);
            existing.calculatedAmount =
              (existing.calculatedAmount || 0) + (t.calculatedAmount || t.amount || 0);
          } else {
            itemTaxMap.set(key, { ...t });
          }
        }
      }
      list = Array.from(itemTaxMap.values());
    }
    const valid = list.filter(
      (t) =>
        t &&
        t.taxname &&
        String(t.taxname).trim() !== "" &&
        String(t.taxcomputation ?? "exclusive").toLowerCase() !== "inclusive"
    );
    return Array.from(new Map(valid.map((t) => [t.taxid ?? t.taxname, t])).values());
  })();

  let taxesRows = "";
  invoiceTaxes.forEach((tax) => {
    const taxAmount =
      tax.calculatedAmount != null && Number(tax.calculatedAmount) > 0
        ? Number(tax.calculatedAmount)
        : tax.amount != null
          ? Number(tax.amount)
          : Number(tax.price || 0);
    const rateLabel =
      tax.taxtype === "percentage"
        ? ` (${tax.price ?? tax.rate}%)`
        : tax.taxtype === "fixed"
          ? ` (${formatPrice(tax.price ?? tax.rate)})`
          : "";
    taxesRows += `
      <div class="summary-row">
        <span>${escapeHtml(tax.taxname)}${rateLabel}</span>
        <span>${formatPrice(taxAmount)}</span>
      </div>
    `;
  });

  // After-tax charges
  const afterTaxCharges = (orderData?.additionalCharges || [])
    .concat(orderData?.specialDayCharges || [])
    .filter((c) => c.applicationtiming === "after_tax");

  let afterTaxRows = "";
  afterTaxCharges.forEach((chg) => {
    const rawVal = chg.chargevalue ?? chg.val ?? chg.value;
    const valLabel =
      rawVal != null && rawVal !== ""
        ? chg.chargetype === "percentage"
          ? ` (${rawVal}%)`
          : chg.chargetype === "fixed"
            ? ` (${formatPrice(rawVal)})`
            : ` (${rawVal})`
        : "";
    afterTaxRows += `
      <div class="summary-row">
        <span>${escapeHtml(chg.name || chg.chargename || chg.eventname || "Charge")}${valLabel}</span>
        <span>${formatPrice(chg.amount || 0)}</span>
      </div>
    `;
  });

  // Round off
  const roundoffAmount = Number(orderData?.roundoff?.roundedAmount ?? orderData?.roundoffAmount ?? 0);
  let roundoffRow = "";
  if (orderData?.roundoff?.status || roundoffAmount !== 0) {
    const roundoffDisplay =
      roundoffAmount > 0
        ? `+${formatPrice(roundoffAmount)}`
        : roundoffAmount < 0
          ? `-${formatPrice(Math.abs(roundoffAmount))}`
          : formatPrice(0);
    roundoffRow = `
      <div class="summary-row">
        <span>${escapeHtml(getTranslation("roundoff") || "Round Off")}</span>
        <span>${roundoffDisplay}</span>
      </div>
    `;
  }

  const paymentStatus = String(orderData.paymentstatus || "paid").toLowerCase().replace(/\s+/g, "-");
  const paymentStatusLabel = getTranslation(orderData.paymentstatus) || orderData.paymentstatus || "Paid";

  return `
    <div class="invoice-wrapper">
      <!-- Header Card with UserApp parity -->
      <div class="header">
        ${invoiceLogoHtml}
        <div class="header-content${!invoiceLogoHtml ? " no-logo" : ""}">
          <h1>${escapeHtml(getTranslation("invoice") || "Invoice")}</h1>
          <h2>${escapeHtml(orderData.businessname || "SavoryOps Restaurant")}</h2>
          ${orderData.branchname ? `<p>${escapeHtml(orderData.branchname)}</p>` : ""}
        </div>
        <div class="header-date">
          <span>${formattedInvoiceGeneratedAt}</span>
        </div>
      </div>

      <!-- Customer Info Card -->
      <div class="customer-info info-card">
        <h3>${escapeHtml(getTranslation("customerinfo") || "Customer Information")}</h3>
        <div class="customer-info-row">
          <div class="info-item">
            <span class="info-label">${escapeHtml(getTranslation("customername") || "Customer Name")}:</span>
            <span class="info-value">${escapeHtml(formatCustomerField(orderData.customerName))}</span>
          </div>
          <div class="info-item">
            <span class="info-label">${escapeHtml(getTranslation("customerphone") || "Phone Number")}:</span>
            <span class="info-value">${escapeHtml(formatCustomerField(orderData.customerPhone))}</span>
          </div>
          ${hasCustomerEmail
      ? `<div class="info-item">
                  <span class="info-label">${escapeHtml(getTranslation("customeremail") || "Email")}:</span>
                  <span class="info-value">${escapeHtml(customerEmail)}</span>
                </div>`
      : ""
    }
        </div>
      </div>

      <!-- Business Info & Order Info Cards Side-by-Side -->
      <div class="info-row-wrapper">
        <div class="business-info info-card">
          <h3>${escapeHtml(getTranslation("businessinfo") || "Business Information")}</h3>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">${escapeHtml(getTranslation("branchphone") || getTranslation("phonenumber") || getTranslation("customerphone") || "Phone Number")}:</span>
              <span class="info-value">${escapeHtml(branchPhoneDisplay)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">${escapeHtml(getTranslation("branchaddress") || getTranslation("address") || "Address")}:</span>
              <span class="info-value">${escapeHtml(branchAddressDisplay)}</span>
            </div>
            ${tableDetailsHTML
      ? `<div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #eeeeee;">
                    <div class="info-item" style="margin-bottom: 6px;"><span class="info-label" style="font-weight: bold; color: #28a745;">${escapeHtml(getTranslation("tabledetails") || "Table Details")}</span></div>
                    ${tableDetailsHTML}
                  </div>`
      : ""
    }
          </div>
        </div>

        <div class="order-info info-card">
          <h3>${escapeHtml(getTranslation("orderinfo") || "Order Information")}</h3>
          <div class="info-list">
            <div class="info-item order-info-row">
              <div class="info-pair">
                <span class="info-label">${escapeHtml(getTranslation("orderno") || "Order No")}:</span>
                <span class="info-value">#${escapeHtml(orderData.orderno || "")}</span>
              </div>
              <div class="info-pair info-pair-right">
                <span class="info-label">${escapeHtml(getTranslation("ordertype") || "Order Type")}:</span>
                <span class="info-value">${escapeHtml(getTranslation(orderData.ordertype) || orderData.ordertype || "")}</span>
              </div>
            </div>
            <div class="info-item">
              <span class="info-label">${escapeHtml(getTranslation("orderdate") || "Order Date")}:</span>
              <span class="info-value">${formatOrderDateTime(orderData.createdAt, dateFormat, timeFormat, timeZone)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">${escapeHtml(getTranslation("payment") || "Payment")}:</span>
              <span class="status-badge status-${paymentStatus}">${escapeHtml(paymentStatusLabel)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Items Section -->
      <h3 class="items-section-title">${escapeHtml(getTranslation("itemordered", "Items Ordered") || "Items Ordered")}</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th>${escapeHtml(getTranslation("items", "Items") || "Items")}</th>
            <th style="text-align: center;">${escapeHtml(getTranslation("qty", "Qty") || "Qty")}</th>
            <th class="price-column">${escapeHtml(getTranslation("price", "Price") || "Price")}</th>
            <th class="amount-column">${escapeHtml(getTranslation("total", "Total") || "Total")}</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <!-- Bill Summary Card -->
      <div class="summary">
        <h3>${escapeHtml(getTranslation("billsummary") || "Bill Summary")}</h3>
        <div class="summary-row">
          <span>${escapeHtml(getTranslation("subtotal", "Subtotal") || "Subtotal")}</span>
          <span>${formatPrice(orderData.subtotalprice)}</span>
        </div>
        ${beforeTaxRows}
        ${taxesRows}
        ${afterTaxRows}
        ${roundoffRow}
        <div class="summary-row total-row">
          <span>${escapeHtml(getTranslation("grandtotal", "Grand Total") || "Grand Total")}</span>
          <span>${formatPrice(orderData.totalprice)}</span>
        </div>
      </div>

      <!-- Footer Card -->
      <div class="footer">
        <p><strong>${escapeHtml(getTranslation("thankyouforyourorder") || "Thank you for your order!")}</strong></p>
        <p>${escapeHtml(getTranslation("computerbasedgeneratedinvoice") || "This is a computer-generated invoice.")}</p>
      </div>
    </div>
  `;
};

/**
 * Generate full HTML document for preview or print.
 */
export const generateInvoiceHTML = (
  orderData,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "hh:mm A",
  timeZone = "Asia/Kolkata",
  translations = {},
  invoiceGeneratedAt = new Date().toISOString(),
  autoPrint = false,
  logoBase64Uri = null
) => {
  const resolvedLogo =
    (logoBase64Uri ? (normalizeBase64Image(logoBase64Uri) || logoBase64Uri) : null) ||
    getLogoBase64FromOrder(orderData) ||
    null;
  const styles = generateInvoiceStyles();
  const body = generateInvoiceBodyHTML(
    orderData,
    dateFormat,
    timeFormat,
    timeZone,
    translations,
    invoiceGeneratedAt,
    resolvedLogo
  );

  const printScript = autoPrint
    ? `<script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice - Order #${orderData.orderno || ""}</title>
  <style>
    html, body { margin: 0; padding: 0; background-color: #ffffff; }
    ${styles}
  </style>
</head>
<body>
  ${body}
  ${printScript}
</body>
</html>`;
};

/**
 * Directly downloads the Order Invoice matching UserApp design as a high-quality PDF in the browser.
 */
export const downloadOrderInvoicePDF = async (
  orderData,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "hh:mm A",
  timeZone = "Asia/Kolkata",
  translations = {}
) => {
  if (!orderData) {
    throw new Error("Order data is required to download invoice");
  }

  // 1. First priority: Use base64 logo provided directly by backend with orderData
  let logoBase64 = getLogoBase64FromOrder(orderData);

  // 2. Second priority: If backend didn't supply base64, attempt to load logourl as base64
  if (!logoBase64 && orderData?.logourl) {
    logoBase64 = await loadLogoAsBase64(orderData.logourl);
  }

  const styles = generateInvoiceStyles();
  const body = generateInvoiceBodyHTML(
    orderData,
    dateFormat,
    timeFormat,
    timeZone,
    translations,
    new Date().toISOString(),
    logoBase64
  );

  // Use a completely isolated off-screen iframe to prevent ANY style leakage into the Order Details page
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-9999px";
  iframe.style.top = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1200px";
  iframe.style.border = "none";
  iframe.style.opacity = "0";
  iframe.style.pointerEvents = "none";
  iframe.style.zIndex = "-99999";
  document.body.appendChild(iframe);

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            html, body {
              margin: 0;
              padding: 0;
              background-color: #ffffff;
            }
            ${styles}
          </style>
        </head>
        <body>
          ${body}
        </body>
      </html>
    `);
    iframeDoc.close();

    // Ensure all images (including base64 logo) are fully painted and decoded before html2canvas capture
    const images = Array.from(iframeDoc.images || []);
    if (images.length > 0) {
      await Promise.all(
        images.map((img) => {
          if (img.complete) {
            if (typeof img.decode === "function") {
              return img.decode().catch(() => { });
            }
            return Promise.resolve();
          }
          return new Promise((resolve) => {
            img.onload = () => {
              if (typeof img.decode === "function") {
                img.decode().catch(() => { }).then(resolve);
              } else {
                resolve();
              }
            };
            img.onerror = () => resolve();
          });
        })
      );
    }

    // Wait for layout, fonts, and images to paint inside the iframe
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    await new Promise((resolve) => setTimeout(resolve, 150));

    const targetElement = iframeDoc.querySelector(".invoice-wrapper") || iframeDoc.body;
    const captureHeight = targetElement.scrollHeight || targetElement.offsetHeight || 900;

    const canvas = await html2canvas(targetElement, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 794,
      height: captureHeight,
      windowWidth: 794,
      windowHeight: captureHeight,
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageW = doc.internal.pageSize.getWidth(); // 210
    const pageH = doc.internal.pageSize.getHeight(); // 297
    const margin = 8; // 8mm padding on top, bottom, left, right
    const contentW = pageW - margin * 2; // 194
    const contentH = pageH - margin * 2; // 281

    const imgW = contentW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= contentH) {
      // Single page: draw centered with top/left/right/bottom padding
      const imgData = canvas.toDataURL("image/png", 1.0);
      doc.addImage(imgData, "PNG", margin, margin, imgW, imgH, undefined, "FAST");
    } else {
      // Multi-page slice
      const pageHeightPx = Math.floor((contentH / imgW) * canvas.width);
      const totalPages = Math.ceil(canvas.height / pageHeightPx);

      for (let i = 0; i < totalPages; i++) {
        if (i > 0) {
          doc.addPage();
        }
        const sourceY = i * pageHeightPx;
        const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const pctx = pageCanvas.getContext("2d");
        pctx.fillStyle = "#ffffff";
        pctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );

        const pageImgData = pageCanvas.toDataURL("image/png", 1.0);
        const pageImgH = (sourceHeight * imgW) / canvas.width;
        doc.addImage(pageImgData, "PNG", margin, margin, imgW, pageImgH, undefined, "FAST");
      }
    }

    const orderIdentifier =
      orderData.orderno ||
      orderData.orderNo ||
      orderData.invoiceNo ||
      String(orderData._id || "order").slice(-6);
    const safeOrderNo = String(orderIdentifier).replace(/[^\w-]/g, "");
    const fileName = `Invoice_Order_${safeOrderNo || "Receipt"}.pdf`;

    doc.save(fileName);
    return true;
  } finally {
    if (document.body.contains(iframe)) {
      document.body.removeChild(iframe);
    }
  }
};

export const printOrderInvoice = (
  orderData,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "hh:mm A",
  timeZone = "Asia/Kolkata",
  translations = {}
) => {
  const logoBase64 = getLogoBase64FromOrder(orderData);
  const html = generateInvoiceHTML(
    orderData,
    dateFormat,
    timeFormat,
    timeZone,
    translations,
    new Date().toISOString(),
    true,
    logoBase64
  );
  const printWindow = window.open("", "_blank", "width=850,height=900");
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  } else {
    // If popup blocked, create hidden iframe to print
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow || iframe.contentDocument;
    if (doc.document) {
      doc.document.open();
      doc.document.write(html);
      doc.document.close();
    }
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 60000);
  }
};
