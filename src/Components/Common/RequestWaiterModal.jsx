import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CleaningServicesIcon from "@mui/icons-material/CleaningServices";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import CircularProgress from "@mui/material/CircularProgress";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import "../../Scss/Components/General/requestwaitermodal.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const COOLDOWN_SECONDS = 60;

const ASSISTANCE_OPTIONS = [
  { key: "generalassistance", Icon: RoomServiceIcon, reasonValue: "General Assistance" },
  { key: "waterrefill", Icon: WaterDropIcon, reasonValue: "Water Refill" },
  { key: "bringbill", Icon: ReceiptLongIcon, reasonValue: "Bring Bill" },
  { key: "cutlerynapkins", Icon: RestaurantIcon, reasonValue: "Cutlery & Napkins" },
  { key: "cleantable", Icon: CleaningServicesIcon, reasonValue: "Clean Table" },
];

const getWaiterCooldownKey = (branchId, tableNo) =>
  `waiter_cooldown_${branchId || ""}_${tableNo || ""}`;

const getRemainingCooldown = (branchId, tableNo) => {
  if (typeof localStorage === "undefined" || !tableNo) return 0;
  try {
    const storedTime = localStorage.getItem(getWaiterCooldownKey(branchId, tableNo));
    if (!storedTime) return 0;
    const elapsed = Math.floor((Date.now() - parseInt(storedTime, 10)) / 1000);
    return elapsed >= 0 && elapsed < COOLDOWN_SECONDS ? COOLDOWN_SECONDS - elapsed : 0;
  } catch {
    return 0;
  }
};

const resolveStoredBranchId = (branchId) =>
  branchId ||
  (typeof localStorage !== "undefined"
    ? localStorage.getItem("selectedBranchid") || localStorage.getItem("selectedBranchId")
    : "") ||
  "";

const resolveStoredTableNo = (tableNo) =>
  tableNo ||
  (typeof localStorage !== "undefined"
    ? localStorage.getItem("selectedTableNo") || localStorage.getItem("selectedTable")
    : "") ||
  "";

const RequestWaiterDialog = ({
  onClose,
  tableNo,
  tableId,
  branchId,
  ownerId,
}) => {
  const { translations = {}, isRtl } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const resolvedBranchId = resolveStoredBranchId(branchId);
  const resolvedTableNo = resolveStoredTableNo(tableNo);

  const [selectedOption, setSelectedOption] = useState(ASSISTANCE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(() =>
    getRemainingCooldown(resolvedBranchId, resolvedTableNo)
  );

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, onClose]);

  const handleSendRequest = useCallback(async () => {
    if (cooldown > 0 || loading) return;

    let activeOwnerId = ownerId;
    let activeBranchId = branchId;
    let activeTableNo = tableNo;
    let activeTableId = tableId;

    if (typeof localStorage !== "undefined") {
      const storedOwnerId = localStorage.getItem("owner_id") || localStorage.getItem("ownerId");
      const storedNumericOwnerId = localStorage.getItem("ownerid");

      if (
        storedOwnerId &&
        (!activeOwnerId ||
          (storedNumericOwnerId && String(activeOwnerId) === String(storedNumericOwnerId)))
      ) {
        activeOwnerId = storedOwnerId;
      } else if (!activeOwnerId) {
        activeOwnerId = storedNumericOwnerId;
      }

      activeBranchId =
        activeBranchId ||
        localStorage.getItem("selectedBranchid") ||
        localStorage.getItem("selectedBranchId");
      activeTableNo =
        activeTableNo ||
        localStorage.getItem("selectedTableNo") ||
        localStorage.getItem("selectedTable");
      activeTableId = activeTableId || localStorage.getItem("selectedTableId");
    }

    if (!activeOwnerId || !activeBranchId || !activeTableNo) {
      showSnackbar(translations.tablenotfound || "Table details not found", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${adminPanelBackendPath}/Customer/Home/RequestWaiter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "admin",
        },
        body: JSON.stringify({
          ownerId: activeOwnerId,
          branchId: activeBranchId,
          tableId: activeTableId || "",
          tableno: String(activeTableNo),
          reason: selectedOption?.reasonValue || "General Assistance",
        }),
      });

      const data = await res.json().catch(() => null);
      if (res.ok && data?.success) {
        const now = Date.now();
        localStorage.setItem(
          getWaiterCooldownKey(activeBranchId, activeTableNo),
          String(now)
        );
        setCooldown(COOLDOWN_SECONDS);
        window.dispatchEvent(
          new CustomEvent("waiterCooldownStarted", {
            detail: { branchId: activeBranchId, tableNo: activeTableNo, timestamp: now },
          })
        );

        if (data.alreadyNotified) {
          showSnackbar(
            translations.waiteralreadynotified ||
              "Waiter has already been notified for your table. Please wait a moment.",
            "info"
          );
        } else {
          showSnackbar(
            translations.waiternotified ||
              "Waiter has been notified! A staff member is on the way.",
            "success"
          );
        }
        onClose();
      } else {
        showSnackbar(
          data?.message || translations.somethingWentWrong || "Something went wrong.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error requesting waiter:", error);
      showSnackbar(translations.somethingWentWrong || "Something went wrong.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    branchId,
    cooldown,
    loading,
    onClose,
    ownerId,
    selectedOption,
    showSnackbar,
    tableId,
    tableNo,
    translations,
  ]);

  return createPortal(
    <div
      className={`waiter-modal-overlay ${isRtl ? "is-rtl" : ""}`}
      onClick={() => !loading && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-waiter-title"
    >
      <div className="waiter-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="waiter-modal-header">
          <div className="waiter-header-left">
            <div className="waiter-bell-icon-wrap">
              <RoomServiceIcon className="waiter-bell-icon" />
            </div>
            <div className="waiter-title-group">
              <h3 id="request-waiter-title" className="waiter-modal-title">
                {translations.callwaiter || "Call Waiter"}
              </h3>
              <p className="waiter-modal-subtitle">
                {translations.tablelabel || "Table"} {resolvedTableNo}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="waiter-close-btn"
            onClick={onClose}
            disabled={loading}
            aria-label={translations.close || "Close"}
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Body */}
        <div className="waiter-modal-body">
          <p className="waiter-select-label">
            {translations.selectassistance || "Select Assistance"}
          </p>

          <div className="waiter-options-list" role="radiogroup">
            {ASSISTANCE_OPTIONS.map((opt) => {
              const isSelected = selectedOption.key === opt.key;
              const OptionIcon = opt.Icon;
              return (
                <button
                  key={opt.key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`waiter-option-card ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedOption(opt)}
                >
                  <div className={`waiter-option-icon-box ${isSelected ? "selected" : ""}`}>
                    <OptionIcon fontSize="small" />
                  </div>
                  <span className="waiter-option-text">
                    {translations[opt.key] || opt.reasonValue}
                  </span>
                  {isSelected ? (
                    <RadioButtonCheckedIcon className="waiter-radio-icon checked" fontSize="small" />
                  ) : (
                    <RadioButtonUncheckedIcon className="waiter-radio-icon" fontSize="small" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="waiter-action-row">
            <button
              type="button"
              className="waiter-submit-btn"
              onClick={handleSendRequest}
              disabled={cooldown > 0 || loading}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <>
                  <NotificationsActiveIcon fontSize="small" />
                  <span>
                    {cooldown > 0
                      ? `${translations.waitercooldown || "Wait to recall"} (${cooldown}s)`
                      : translations.requestwaiter || "Request Waiter"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export const RequestWaiterModal = ({ isOpen, ...props }) => {
  if (!isOpen || typeof document === "undefined") return null;
  return <RequestWaiterDialog {...props} />;
};

const CallWaiterFabInner = ({ onPress, tableNo, branchId }) => {
  const { translations = {}, isRtl } = useLanguage();
  const [cooldown, setCooldown] = useState(() => getRemainingCooldown(branchId, tableNo));

  useEffect(() => {
    const handleCooldownStarted = () => {
      setCooldown(getRemainingCooldown(branchId, tableNo));
    };

    window.addEventListener("waiterCooldownStarted", handleCooldownStarted);
    window.addEventListener("storage", handleCooldownStarted);
    return () => {
      window.removeEventListener("waiterCooldownStarted", handleCooldownStarted);
      window.removeEventListener("storage", handleCooldownStarted);
    };
  }, [branchId, tableNo]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <button
      type="button"
      className={`call-waiter-fab ${isRtl ? "is-rtl" : ""}`}
      onClick={onPress}
      aria-label={translations.callwaiter || "Call Waiter"}
      title={translations.callwaiter || "Call Waiter"}
    >
      <div className="call-waiter-fab-inner">
        <div className="call-waiter-fab-icon-wrap">
          <RoomServiceIcon fontSize="small" />
        </div>
        <div className="call-waiter-fab-text-wrap">
          <span className="call-waiter-fab-title">
            {cooldown > 0 ? `${cooldown}s` : translations.callwaiter || "Call Waiter"}
          </span>
          <span className="call-waiter-fab-subtitle">
            {translations.tablelabel || "Table"} {tableNo}
          </span>
        </div>
      </div>
    </button>
  );
};

export const CallWaiterFab = ({ onPress, tableNo, branchId }) => {
  if (!tableNo) return null;
  return (
    <CallWaiterFabInner
      key={`${branchId || ""}_${tableNo}`}
      onPress={onPress}
      tableNo={tableNo}
      branchId={branchId}
    />
  );
};

export default RequestWaiterModal;
