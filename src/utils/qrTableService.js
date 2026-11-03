import CryptoJS from "crypto-js";
import { isDineInOrderType } from "../Pages/Orders/orderHelpers.js";

const QR_ENCRYPTION_SECRET =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_QR_SECRET_KEY) ||
  "SavoryopsTableQR25";
const adminPanelBackendPath =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_BACKEND_URL) || "";

/**
 * Decrypt AES encrypted data string using the shared secret key.
 */
export const decryptQrData = (encryptedData, secret = QR_ENCRYPTION_SECRET) => {
  if (!encryptedData || typeof encryptedData !== "string") return null;
  try {
    const raw = encryptedData.trim();
    const bytes = CryptoJS.AES.decrypt(raw, secret);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) {
      return null;
    }
    return decryptedText;
  } catch {
    return null;
  }
};

/**
 * Resolves the dine-in order type name from the branch's enabled order types.
 */
export const resolveDineInOrderType = (orderTypes = []) => {
  if (Array.isArray(orderTypes)) {
    const enabled = orderTypes.filter((ot) => ot && ot.isEnabled !== false);
    const dine = enabled.find((ot) => isDineInOrderType(ot.ordertypename || ot.name));
    if (dine) return dine.ordertypename || dine.name;
    if (enabled.length > 0) return enabled[0].ordertypename || enabled[0].name;
  }
  return "Dine-in";
};

/**
 * Fetch table and branch details from the backend given ownerId, branchId, and tableId.
 */
export const fetchTableAndBranchDetails = async (ownerId, branchId, tableId) => {
  if (!adminPanelBackendPath || !ownerId || !branchId || !tableId) {
    return null;
  }

  try {
    const response = await fetch(
      `${adminPanelBackendPath}/Customer/Home/GetTableDetails/${ownerId}/${branchId}/${tableId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user": "admin",
        },
      }
    );

    if (!response.ok) {
      console.warn("GetTableDetails failed with status:", response.status);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching table details from backend:", error);
    return null;
  }
};

/**
 * Applies the table, branch, and dine-in settings to localStorage and dispatches
 * corresponding global custom events so Navbar, Cart, Menu, and other pages update immediately.
 */
export const applyTableAndBranchSettings = ({
  branchDetails,
  tableDetails,
  fallbackTableNo,
  fallbackBranchId,
}) => {
  const tableno =
    tableDetails?.tableno != null
      ? String(tableDetails.tableno)
      : fallbackTableNo
        ? String(fallbackTableNo)
        : null;

  const tableid = tableDetails?._id != null ? String(tableDetails._id) : null;

  // 1. Save Table Details
  if (tableno) {
    localStorage.setItem("selectedTableNo", tableno);
    localStorage.setItem("selectedTable", tableno);
  }
  if (tableid) {
    localStorage.setItem("selectedTableId", tableid);
  }

  // 2. Clear previous order references
  localStorage.removeItem("currentOrderId");
  localStorage.removeItem("currentOrderNo");
  localStorage.removeItem("orderType");

  // 3. Save Branch Details
  let resolvedBranch = branchDetails || null;
  if (resolvedBranch) {
    const branchId = resolvedBranch._id || resolvedBranch.branchid || fallbackBranchId;
    if (branchId) {
      localStorage.setItem("selectedBranchId", String(branchId));
    }
    if (resolvedBranch.branchname) {
      localStorage.setItem("selectedBranchName", resolvedBranch.branchname);
    }
    if (typeof window !== "undefined") {
      window.__selectedBranch = resolvedBranch;
      if (resolvedBranch.branchSetting) {
        window.__branchSetting = resolvedBranch.branchSetting;
      }
    }
  } else if (fallbackBranchId) {
    localStorage.setItem("selectedBranchId", String(fallbackBranchId));
  }

  // 4. Update Order Type to Dine-in
  const dineInType = resolveDineInOrderType(resolvedBranch?.ordertypes);
  localStorage.setItem("selectedOrderType", dineInType);

  // 5. Dispatch Custom Events for immediate reactivity across the app
  if (typeof window !== "undefined") {
    if (resolvedBranch) {
      window.dispatchEvent(
        new CustomEvent("branchChange", {
          detail: resolvedBranch,
        })
      );
      if (resolvedBranch.branchSetting) {
        window.dispatchEvent(
          new CustomEvent("branchSettingChange", {
            detail: resolvedBranch.branchSetting,
          })
        );
      }
    }

    window.dispatchEvent(
      new CustomEvent("orderTypeChange", {
        detail: { orderType: dineInType },
      })
    );

    if (tableno) {
      window.dispatchEvent(
        new CustomEvent("tableChange", {
          detail: {
            tableNo: tableno,
            tableId: tableid,
            tableno,
            tableid,
          },
        })
      );
    }
  }

  return {
    tableno,
    tableid,
    branch: resolvedBranch,
    orderType: dineInType,
  };
};

/**
 * Master parser and processor for any scanned QR code text or URL.
 * Handles:
 * 1. URLs containing ?data=... or ?qr=... (AES encrypted ownerId&branchId&tableId)
 * 2. Raw encrypted strings
 * 3. Raw 3-part strings: ownerId&branchId&tableId
 * 4. URLs with explicit ?table=... or ?tableno=... and optional ?branch=...
 * 5. Simple plain-text table names like "Table 14" or "14"
 */
export const processTableQrCode = async (scannedText) => {
  if (!scannedText || typeof scannedText !== "string") {
    return { success: false, message: "Invalid QR code" };
  }

  const trimmed = scannedText.trim();

  // Step A: Extract URL query parameters if it's a URL
  let encryptedPayload = null;
  let urlTableParam = null;
  let urlBranchParam = null;

  try {
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.includes("?")) {
      const parsedUrl = new URL(trimmed.startsWith("http") ? trimmed : `http://dummy.com/${trimmed}`);
      const dataParam = parsedUrl.searchParams.get("data") || parsedUrl.searchParams.get("qr");
      if (dataParam) {
        encryptedPayload = dataParam;
      }
      urlTableParam = parsedUrl.searchParams.get("table") || parsedUrl.searchParams.get("tableno");
      urlBranchParam =
        parsedUrl.searchParams.get("branch") ||
        parsedUrl.searchParams.get("branchid") ||
        parsedUrl.searchParams.get("branchId");
    }
  } catch {
    // Not a parseable URL, continue
  }

  // Step B: Attempt decryption of payload or raw string
  const candidateEncrypted = encryptedPayload || trimmed;
  let decryptedString = decryptQrData(candidateEncrypted);
  if (!decryptedString && candidateEncrypted !== trimmed) {
    decryptedString = decryptQrData(trimmed);
  }

  // Step C: Check if decrypted string (or candidate string) matches ownerId&branchId&tableId
  const candidatePayload = decryptedString || (trimmed.includes("&") ? trimmed : null);
  if (candidatePayload && candidatePayload.includes("&")) {
    const parts = candidatePayload.split("&").map((p) => p.trim());
    if (parts.length === 3) {
      const [ownerId, branchId, tableId] = parts;
      const apiData = await fetchTableAndBranchDetails(ownerId, branchId, tableId);

      if (apiData && apiData.tableDetails) {
        const applied = applyTableAndBranchSettings({
          branchDetails: apiData.branchDetails,
          tableDetails: apiData.tableDetails,
        });

        return {
          success: true,
          tableNo: applied.tableno,
          tableId: applied.tableid,
          branch: applied.branch,
          branchName: applied.branch?.branchname || "",
        };
      }
    }
  }

  // Step D: Handle explicit table param in URL (?table=14 or ?tableno=14)
  if (urlTableParam) {
    const cleanTable = urlTableParam.replace(/^(table|tbl)[\s:#\-_]*/i, "").trim() || urlTableParam.trim();
    const applied = applyTableAndBranchSettings({
      fallbackTableNo: cleanTable,
      fallbackBranchId: urlBranchParam,
    });

    return {
      success: true,
      tableNo: cleanTable,
      branch: applied.branch,
      branchName: applied.branch?.branchname || "",
    };
  }

  // Step E: Handle plain string like "Table 14" or "14"
  const cleanTable = trimmed.replace(/^(table|tbl)[\s:#\-_]*/i, "").trim();
  if (cleanTable && /^[a-zA-Z0-9_\-\s]{1,20}$/.test(cleanTable)) {
    const applied = applyTableAndBranchSettings({
      fallbackTableNo: cleanTable,
    });

    return {
      success: true,
      tableNo: cleanTable,
      branch: applied.branch,
      branchName: applied.branch?.branchname || "",
    };
  }

  return {
    success: false,
    message: "Unrecognized QR code format",
  };
};

export default processTableQrCode;