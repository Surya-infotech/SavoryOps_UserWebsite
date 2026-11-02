import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { formatOrderDateTime, formatOrderPrice } from "./orderHelpers.js";

const escapeHtmlAttr = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export const generateInvoiceStyles = () => `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    margin: 0;
    padding: 24px;
    background-color: #f8fafc;
    color: #1e293b;
    font-size: 13px;
    line-height: 1.45;
  }
  .invoice-container {
    max-width: 800px;
    margin: 0 auto;
    background: #ffffff;
    padding: 32px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    box-sizing: border-box;
    color: #1e293b;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.45;
  }
  .header {
    border-bottom: 2px solid #028802;
    padding-bottom: 16px;
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .header-left h1 {
    color: #028802;
    margin: 0 0 6px 0;
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }
  .header-left h2 {
    color: #0f172a;
    margin: 0 0 4px 0;
    font-size: 18px;
    font-weight: 600;
  }
  .header-left p {
    margin: 0;
    color: #64748b;
    font-size: 12px;
  }
  .header-right {
    text-align: right;
  }
  .order-pill {
    display: inline-block;
    background: #e8f5e9;
    color: #028802;
    padding: 6px 14px;
    border-radius: 20px;
    font-weight: 700;
    font-size: 14px;
    margin-bottom: 6px;
  }
  .invoice-date {
    font-size: 12px;
    color: #64748b;
  }
  .info-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 24px;
  }
  .info-card {
    flex: 1;
    min-width: 220px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px 16px;
    box-sizing: border-box;
  }
  .info-card h3 {
    color: #028802;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin: 0 0 10px 0;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .info-item {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 12px;
  }
  .info-label {
    font-weight: 600;
    color: #64748b;
  }
  .info-value {
    font-weight: 500;
    color: #0f172a;
    text-align: right;
  }
  .status-badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
  }
  .status-paid { background-color: #4caf50; }
  .status-unpaid { background-color: #f44336; }
  .status-completed { background-color: #2e7d32; }
  .status-delivered { background-color: #028802; }
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 24px;
    font-size: 12px;
  }
  .items-table th {
    background-color: #028802;
    color: #ffffff;
    padding: 10px 12px;
    text-align: left;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
  }
  .items-table td {
    border-bottom: 1px solid #e2e8f0;
    padding: 10px 12px;
    vertical-align: top;
  }
  .items-table tr:nth-child(even) td {
    background-color: #f8fafc;
  }
  .price-column, .amount-column {
    text-align: right;
  }
  .addon-item {
    color: #64748b;
    font-size: 11px;
    margin-top: 3px;
    padding-left: 8px;
    border-left: 2px solid #cbd5e1;
  }
  .special-instructions {
    color: #dc2626;
    font-size: 11px;
    margin-top: 4px;
    font-style: italic;
  }
  .bill-summary {
    max-width: 380px;
    margin-left: auto;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 24px;
    box-sizing: border-box;
  }
  .bill-summary h3 {
    color: #028802;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
    margin: 0 0 10px 0;
    font-size: 13px;
    text-transform: uppercase;
  }
  .summary-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 12px;
    color: #475569;
  }
  .grand-total-row {
    display: flex;
    justify-content: space-between;
    border-top: 2px solid #028802;
    padding-top: 8px;
    margin-top: 8px;
    font-size: 15px;
    font-weight: 800;
    color: #028802;
  }
  .footer {
    border-top: 1px dashed #cbd5e1;
    padding-top: 16px;
    text-align: center;
    color: #94a3b8;
    font-size: 11px;
  }
  @media print {
    body {
      background: #fff;
      padding: 0;
    }
    .invoice-container {
      box-shadow: none;
      padding: 0;
    }
    .no-print {
      display: none !important;
    }
  }
`;

export const generateInvoiceBodyHTML = (
  orderData,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "hh:mm A",
  timeZone = "Asia/Kolkata",
  translations = {},
  invoiceGeneratedAt = new Date().toISOString()
) => {
  const getTranslation = (key) => translations[key] || key;
  const formatPrice = (price) => formatOrderPrice(price, orderData);

  const formatCustomerField = (value) => {
    if (value === undefined || value === null) return "N/A";
    const normalized = typeof value === "string" ? value.trim() : value.toString();
    return normalized === "" ? "N/A" : normalized;
  };

  // Build table details HTML
  const getTableDetailsHTML = () => {
    const areaDetails = orderData.areatabledetails;
    if (Array.isArray(areaDetails) && areaDetails.length > 0) {
      return areaDetails
        .map((area) => {
          const tableNos =
            area.tables && area.tables.length
              ? area.tables.map((t) => t.tableno).join(", ")
              : "";
          return `<div class="info-item"><span class="info-label">${escapeHtmlAttr(area.areaname || "")}:</span><span class="info-value">${escapeHtmlAttr(tableNos || "-")}</span></div>`;
        })
        .join("");
    }
    if (orderData.tableno || orderData.areaname) {
      return `<div class="info-item"><span class="info-label">${escapeHtmlAttr(getTranslation("tableno"))}:</span><span class="info-value">${escapeHtmlAttr(orderData.tableno || "")} ${orderData.areaname ? `(${escapeHtmlAttr(orderData.areaname)})` : ""}</span></div>`;
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
      : orderData.items || []
  ).filter((product) => !isItemCancelled(product));

  let itemsRows = "";
  activeProducts.forEach((product) => {
    const productName = product.productname || product.itemname || product.name || "Item";
    const quantity = product.quantity || product.qty || 1;
    const price = product.price || 0;
    const amount = product.amount !== undefined ? product.amount : price * quantity;
    const specialInstructions = product.specialInstructions || "";
    const hasAddons = Array.isArray(product.addons) && product.addons.length > 0;

    let addonsHTML = "";
    if (hasAddons) {
      addonsHTML = product.addons
        .map(
          (addon) =>
            `<div class="addon-item">+ ${escapeHtmlAttr(addon.addonname || addon.name)} (${formatPrice(addon.addonprice || addon.price || 0)} x ${quantity}) = ${formatPrice((addon.addonprice || addon.price || 0) * quantity)}</div>`
        )
        .join("");
    }

    let specialInstructionsHTML = "";
    if (specialInstructions && specialInstructions.trim()) {
      specialInstructionsHTML = `<div class="special-instructions"><strong>${escapeHtmlAttr(getTranslation("specialinstructions"))}:</strong> ${escapeHtmlAttr(specialInstructions)}</div>`;
    }

    itemsRows += `
      <tr>
        <td>
          <div style="font-weight: 600;">${escapeHtmlAttr(productName)}</div>
          ${addonsHTML}
          ${specialInstructionsHTML}
        </td>
        <td style="text-align: center;">${quantity}</td>
        <td class="price-column">${formatPrice(price)}</td>
        <td class="amount-column">${formatPrice(amount)}</td>
      </tr>
    `;
  });

  // Calculate bill breakdown
  const effectiveSubtotal = Number(orderData.subtotalprice ?? orderData.subtotalPrice ?? 0);
  const beforeTaxCharges = (orderData.additionalCharges || [])
    .concat(orderData.specialDayCharges || [])
    .filter((c) => c.applicationtiming === "before_tax");
  const afterTaxCharges = (orderData.additionalCharges || [])
    .concat(orderData.specialDayCharges || [])
    .filter((c) => c.applicationtiming === "after_tax");

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
        <span>${escapeHtmlAttr(chg.name || chg.chargename || chg.eventname || "Charge")}${valLabel}:</span>
        <span>${formatPrice(chg.amount || 0)}</span>
      </div>
    `;
  });

  let taxesRows = "";
  const taxesList = Array.isArray(orderData.taxes) ? orderData.taxes : [];
  taxesList.forEach((tax) => {
    const taxName = tax.taxname || "Tax";
    const taxAmount = tax.calculatedAmount ?? tax.amount ?? 0;
    const rateLabel =
      tax.taxtype === "percentage"
        ? ` (${tax.price ?? tax.rate}%)`
        : tax.taxtype === "fixed"
        ? ` (${formatPrice(tax.price ?? tax.rate)})`
        : "";
    taxesRows += `
      <div class="summary-row">
        <span>${escapeHtmlAttr(taxName)}${rateLabel}:</span>
        <span>${formatPrice(taxAmount)}</span>
      </div>
    `;
  });

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
        <span>${escapeHtmlAttr(chg.name || chg.chargename || chg.eventname || "Charge")}${valLabel}:</span>
        <span>${formatPrice(chg.amount || 0)}</span>
      </div>
    `;
  });

  const roundoffAmount = Number(orderData?.roundoff?.roundedAmount ?? orderData?.roundoffAmount ?? 0);
  const showRoundoff = orderData?.roundoff?.status || roundoffAmount !== 0;
  const grandTotal = Number(orderData.totalprice ?? 0);

  return `
  <div class="invoice-container">
    <div class="header">
      <div class="header-left">
        <h1>${escapeHtmlAttr(getTranslation("invoice") || "INVOICE")}</h1>
        <h2>${escapeHtmlAttr(orderData.businessname || "SavoryOps Restaurant")}</h2>
        <p>${escapeHtmlAttr(orderData.branchname || "")}</p>
      </div>
      <div class="header-right">
        <div class="order-pill">Order #${escapeHtmlAttr(orderData.orderno || "")}</div>
        <div class="invoice-date">${formattedInvoiceGeneratedAt}</div>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <h3>${escapeHtmlAttr(getTranslation("customerinfo") || "Customer Details")}</h3>
        <div class="info-item">
          <span class="info-label">${escapeHtmlAttr(getTranslation("customername") || "Name")}:</span>
          <span class="info-value">${escapeHtmlAttr(formatCustomerField(orderData.customerName))}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${escapeHtmlAttr(getTranslation("customerphone") || "Phone")}:</span>
          <span class="info-value">${escapeHtmlAttr(formatCustomerField(orderData.customerPhone))}</span>
        </div>
        ${
          hasCustomerEmail
            ? `<div class="info-item"><span class="info-label">${escapeHtmlAttr(getTranslation("customeremail") || "Email")}:</span><span class="info-value">${escapeHtmlAttr(customerEmail)}</span></div>`
            : ""
        }
      </div>

      <div class="info-card">
        <h3>${escapeHtmlAttr(getTranslation("orderinfo") || "Order Details")}</h3>
        <div class="info-item">
          <span class="info-label">${escapeHtmlAttr(getTranslation("ordertype") || "Type")}:</span>
          <span class="info-value">${escapeHtmlAttr(getTranslation(orderData.ordertype) || orderData.ordertype)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${escapeHtmlAttr(getTranslation("orderdate") || "Date")}:</span>
          <span class="info-value">${formatOrderDateTime(orderData.createdAt, dateFormat, timeFormat, timeZone)}</span>
        </div>
        <div class="info-item">
          <span class="info-label">${escapeHtmlAttr(getTranslation("orderstatus") || "Status")}:</span>
          <span class="info-value">
            <span class="status-badge status-${String(orderData.orderstatus || "").toLowerCase().replace(/\s+/g, "-")}">${escapeHtmlAttr(getTranslation(orderData.orderstatus) || orderData.orderstatus)}</span>
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">${escapeHtmlAttr(getTranslation("payment") || "Payment")}:</span>
          <span class="info-value">
            <span class="status-badge status-${String(orderData.paymentstatus || "").toLowerCase().replace(/\s+/g, "-")}">${escapeHtmlAttr(getTranslation(orderData.paymentstatus) || orderData.paymentstatus)}</span>
          </span>
        </div>
      </div>

      ${
        tableDetailsHTML
          ? `<div class="info-card">
              <h3>${escapeHtmlAttr(getTranslation("tabledetails") || "Table Details")}</h3>
              ${tableDetailsHTML}
            </div>`
          : ""
      }
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th>${escapeHtmlAttr(getTranslation("items") || "Items")}</th>
          <th style="text-align: center;">${escapeHtmlAttr(getTranslation("qty") || "Qty")}</th>
          <th class="price-column">${escapeHtmlAttr(getTranslation("price") || "Price")}</th>
          <th class="amount-column">${escapeHtmlAttr(getTranslation("total") || "Total")}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <div class="bill-summary">
      <h3>${escapeHtmlAttr(getTranslation("billsummary") || "Bill Summary")}</h3>
      <div class="summary-row">
        <span>${escapeHtmlAttr(getTranslation("subtotal") || "Subtotal")}:</span>
        <span>${formatPrice(effectiveSubtotal)}</span>
      </div>
      ${beforeTaxRows}
      ${taxesRows}
      ${afterTaxRows}
      ${
        showRoundoff
          ? `<div class="summary-row"><span>${escapeHtmlAttr(getTranslation("roundoff") || "Round Off")}:</span><span>${roundoffAmount > 0 ? "+" : ""}${formatPrice(roundoffAmount)}</span></div>`
          : ""
      }
      <div class="grand-total-row">
        <span>${escapeHtmlAttr(getTranslation("grandtotal") || "Grand Total")}:</span>
        <span>${formatPrice(grandTotal)}</span>
      </div>
    </div>

    <div class="footer">
      <p><strong>${escapeHtmlAttr(getTranslation("thankyouforyourorder") || "Thank you for your order!")}</strong></p>
      <p>${escapeHtmlAttr(getTranslation("computerbasedgeneratedinvoice") || "This is a computer-generated invoice.")}</p>
    </div>
  </div>`;
};

export const generateInvoiceHTML = (
  orderData,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "hh:mm A",
  timeZone = "Asia/Kolkata",
  translations = {},
  invoiceGeneratedAt = new Date().toISOString(),
  autoPrint = false
) => {
  const styles = generateInvoiceStyles();
  const body = generateInvoiceBodyHTML(
    orderData,
    dateFormat,
    timeFormat,
    timeZone,
    translations,
    invoiceGeneratedAt
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
 * Directly downloads the Order Invoice as a crisp, formatted PDF file in the browser.
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

  // Create an off-screen render container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "800px";
  container.style.backgroundColor = "#ffffff";
  container.style.zIndex = "-9999";
  container.style.boxSizing = "border-box";

  const styles = generateInvoiceStyles();
  const body = generateInvoiceBodyHTML(
    orderData,
    dateFormat,
    timeFormat,
    timeZone,
    translations
  );

  container.innerHTML = `
    <style>${styles}</style>
    <div style="background: #ffffff; padding: 24px; box-sizing: border-box; width: 800px;">
      ${body}
    </div>
  `;

  document.body.appendChild(container);

  try {
    // Wait for DOM painting
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))
    );
    await new Promise((resolve) => setTimeout(resolve, 80));

    const captureHeight = container.scrollHeight || container.offsetHeight || 900;
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      width: 800,
      height: captureHeight,
      windowWidth: 800,
      windowHeight: captureHeight,
    });

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
      compress: true,
    });

    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentW = pageW - margin * 2;
    const contentH = pageH - margin * 2;

    const imgW = contentW;
    const imgH = (canvas.height * imgW) / canvas.width;

    if (imgH <= contentH) {
      // Single page
      const imgData = canvas.toDataURL("image/png", 1.0);
      doc.addImage(imgData, "PNG", margin, margin, imgW, imgH);
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
        doc.addImage(pageImgData, "PNG", margin, margin, imgW, pageImgH);
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
    if (document.body.contains(container)) {
      document.body.removeChild(container);
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
  const html = generateInvoiceHTML(
    orderData,
    dateFormat,
    timeFormat,
    timeZone,
    translations,
    new Date().toISOString(),
    true
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
