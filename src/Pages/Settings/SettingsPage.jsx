import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import "../../Scss/Pages/Settings/settings.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;
const softwareName = import.meta.env.VITE_SOFTWARE_NAME || "SavoryOps";

const TIMEZONE_OPTIONS = moment.tz.names().map((tz) => ({
  value: tz,
  label: tz,
}));

const DATE_FORMAT_OPTIONS = [
  { label: "MM/DD/YYYY", value: "MM/DD/YYYY" },
  { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
  { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
  { label: "MMM DD, YYYY", value: "MMM DD, YYYY" },
];

const TIME_FORMAT_OPTIONS = [
  { label: "hh:mm:ss A", value: "hh:mm:ss A" },
  { label: "HH:mm:ss", value: "HH:mm:ss" },
  { label: "hh:mm A", value: "hh:mm A" },
  { label: "HH:mm", value: "HH:mm" },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();

  // Update document title
  useEffect(() => {
    document.title = `Settings | ${softwareName}`;
  }, []);

  // Active Vertical Tab State: "datetime" | "delete"
  const [activeTab, setActiveTab] = useState("datetime");

  // Date and Time Preferences
  const [timezone, setTimezone] = useState(() => localStorage.getItem("TimeZone") || "Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("DateFormat") || "DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem("TimeFormat") || "hh:mm A");
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Account State
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch saved settings from backend API
  const fetchDateTimeSettings = async (customerId, token) => {
    if (!customerId || !adminPanelBackendPath) return;

    setIsLoadingSettings(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/General/GetDateTime/${customerId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-user": "customer", Authorization: `Bearer ${token}`, },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const loadedTimezone = data.timezone || data.timeZone;
        const loadedDateFormat = data.dateformat || data.dateFormat;
        const loadedTimeFormat = data.timeformat || data.timeFormat;

        if (loadedTimezone) {
          setTimezone(loadedTimezone);
          localStorage.setItem("TimeZone", loadedTimezone);
        }
        if (loadedDateFormat) {
          setDateFormat(loadedDateFormat);
          localStorage.setItem("DateFormat", loadedDateFormat);
        }
        if (loadedTimeFormat) {
          setTimeFormat(loadedTimeFormat);
          localStorage.setItem("TimeFormat", loadedTimeFormat);
        }
      }
    } catch (error) {
      console.error("Error fetching datetime settings:", error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Fetch saved settings on mount if customer is logged in, and listen to auth changes
  useEffect(() => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (customerId) {
      fetchDateTimeSettings(customerId, token);
    }

    const handleAuthChange = (event) => {
      const detail = event?.detail;
      if (detail?.isLoggedIn && detail?.customerId) {
        const currentToken = localStorage.getItem(customerTokenName);
        fetchDateTimeSettings(detail.customerId, currentToken);
      }
    };

    window.addEventListener("customerAuthChange", handleAuthChange);
    return () => {
      window.removeEventListener("customerAuthChange", handleAuthChange);
    };
  }, []);

  // Formatted preview string
  const formattedPreview = useMemo(() => {
    try {
      const combinedFormat = `${dateFormat} ${timeFormat}`;
      return moment().tz(timezone).format(combinedFormat);
    } catch {
      return moment().format(`${dateFormat} ${timeFormat}`);
    }
  }, [timezone, dateFormat, timeFormat]);

  // Handle Save Date & Time Settings
  const handleSaveDateTime = async () => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId) {
      showSnackbar("Please sign in to save your settings.", "warning");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        dateformat: dateFormat,
        timeformat: timeFormat,
        timezone,
      };

      const response = await fetch(
        `${adminPanelBackendPath}/Website/General/EditDateTime/${customerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", "x-user": "customer", Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // Persist to local storage
        localStorage.setItem("DateFormat", dateFormat);
        localStorage.setItem("TimeFormat", timeFormat);
        localStorage.setItem("TimeZone", timezone);

        // Notify application components of updated date & time settings
        window.dispatchEvent(
          new CustomEvent("dateTimeSettingsChange", {
            detail: { dateFormat, timeFormat, timezone },
          })
        );

        showSnackbar(data?.message || "Date & Time settings saved successfully!", "success");
      } else {
        showSnackbar(data?.message || "Failed to update Date & Time settings.", "error");
      }
    } catch (error) {
      console.error("Error saving datetime settings:", error);
      showSnackbar("Server error. Please try again later.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Delete Account Execution
  const handleConfirmDeleteAccount = async () => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    setIsDeleting(true);
    try {
      if (customerId && adminPanelBackendPath) {
        try {
          let deleteRes = await fetch(
            `${adminPanelBackendPath}/Website/General/DeleteAccount/${customerId}`,
            {
              method: "DELETE",
              headers: { "Content-Type": "application/json", "x-user": "customer", Authorization: `Bearer ${token}`, },
            }
          );
        } catch (apiError) {
          console.warn("Backend delete account notice:", apiError);
        }
      }

      // Clear authentication storage
      localStorage.removeItem(customerTokenName);
      localStorage.removeItem(customerIdName);

      // Notify application state
      window.dispatchEvent(
        new CustomEvent("customerAuthChange", {
          detail: { isLoggedIn: false, customerId: null },
        })
      );

      setIsDeleteModalOpen(false);
      showSnackbar("Your account has been deleted successfully.", "info");
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      showSnackbar("Error processing account deletion.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container">
        {/* Page Top Header */}
        <header className="settings-page-header">
          <h1 className="settings-page-title">Settings</h1>
        </header>

        {/* Vertical Tabs & Content Layout */}
        <div className="settings-layout">
          {/* Vertical Tabs Sidebar */}
          <aside className="settings-sidebar" aria-label="Settings navigation">
            <button
              type="button"
              className={`settings-tab-btn ${activeTab === "datetime" ? "active" : ""}`}
              onClick={() => setActiveTab("datetime")}
              id="tab-btn-datetime"
            >
              <div className="tab-icon-wrapper">
                <CalendarMonthOutlinedIcon />
              </div>
              <div className="tab-text-group">
                <span className="tab-title">Date and Time</span>
                <span className="tab-subtitle">Format & timezone</span>
              </div>
            </button>

            <button
              type="button"
              className={`settings-tab-btn tab-danger ${activeTab === "delete" ? "active" : ""}`}
              onClick={() => setActiveTab("delete")}
              id="tab-btn-delete-account"
            >
              <div className="tab-icon-wrapper">
                <DeleteForeverOutlinedIcon />
              </div>
              <div className="tab-text-group">
                <span className="tab-title">Delete Account</span>
                <span className="tab-subtitle">Permanent removal</span>
              </div>
            </button>
          </aside>

          {/* Tab 1: Date and Time Panel */}
          {activeTab === "datetime" && (
            <main className="settings-content-panel" id="panel-datetime">
              {/* Preview Box */}
              <div className="preview-banner">
                <div className="preview-left">
                  <div className="preview-label-group">
                    <span className="preview-label">Preview</span>
                    <span className="preview-timezone-note">{timezone}</span>
                  </div>
                </div>
                <div className="preview-value-text">{formattedPreview}</div>
              </div>

              {/* Settings Form Controls (Matching SavoryOps_OwnerWeb Dropdown) */}
              <div className="settings-form-grid">
                {/* 1. Timezone Select */}
                <Dropdown
                  id="settings-timezone-select"
                  label="Timezone"
                  selectedValue={timezone}
                  onValueChange={(val) => setTimezone(val)}
                  options={TIMEZONE_OPTIONS}
                  labelKey="label"
                  valueKey="value"
                  placeholder="Select Timezone"
                  showSearch={true}
                />

                {/* 2. Date Format & Time Format in One Row */}
                <div className="settings-form-row-2col">
                  <Dropdown
                    id="settings-dateformat-select"
                    label="Date Format"
                    selectedValue={dateFormat}
                    onValueChange={(val) => setDateFormat(val)}
                    options={DATE_FORMAT_OPTIONS}
                    labelKey="label"
                    valueKey="value"
                    placeholder="Select Date Format"
                    showSearch={false}
                  />

                  <Dropdown
                    id="settings-timeformat-select"
                    label="Time Format"
                    selectedValue={timeFormat}
                    onValueChange={(val) => setTimeFormat(val)}
                    options={TIME_FORMAT_OPTIONS}
                    labelKey="label"
                    valueKey="value"
                    placeholder="Select Time Format"
                    showSearch={false}
                  />
                </div>
              </div>

              {/* Action Footer */}
              <div className="settings-save-footer">
                <button
                  type="button"
                  className="save-primary-btn"
                  onClick={handleSaveDateTime}
                  disabled={isSaving || isLoadingSettings}
                  id="settings-save-datetime-btn"
                >
                  {isSaving ? (
                    <>
                      <CircularProgress size={18} color="inherit" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <SaveOutlinedIcon fontSize="small" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </main>
          )}

          {/* Tab 2: Delete Account Panel */}
          {activeTab === "delete" && (
            <main className="settings-content-panel delete-account-panel" id="panel-delete-account">
              <div className="panel-header-section">
                <h2 className="panel-title">Delete Account</h2>
                <p className="panel-subtitle">
                  Permanently remove your account, saved preferences, past reservations, and dining records.
                </p>
              </div>

              {/* Danger Warning Box */}
              <div className="danger-warning-box">
                <div className="danger-icon-pill">
                  <WarningAmberOutlinedIcon />
                </div>
                <div className="danger-content">
                  <h4>Warning: This Action is Irreversible</h4>
                  <p>
                    Once your account is deleted, all past order histories, table reservations, saved addresses, and loyalty rewards will be permanently wiped from our records.
                  </p>
                </div>
              </div>

              {/* Consequences Checklist */}
              <div className="consequences-card">
                <h5>What happens when you delete your account:</h5>
                <ul>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>All active table reservations and bookings will be immediately cancelled.</span>
                  </li>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>Past culinary receipts, favorite dishes, and dining reviews will be permanently deleted.</span>
                  </li>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>Any active promo discount coupons or reward points will be forfeited.</span>
                  </li>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>You will be immediately logged out of all active devices.</span>
                  </li>
                </ul>
              </div>

              {/* Confirmation Checkbox & Delete Trigger */}
              <div className="delete-actions-row">
                <label className="confirmation-checkbox-label">
                  <input
                    type="checkbox"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.value ? e.target.checked : false)}
                    id="confirm-delete-checkbox"
                  />
                  <span>I understand that this action is permanent and cannot be undone.</span>
                </label>

                <button
                  type="button"
                  className="delete-danger-btn"
                  disabled={!deleteConfirmed}
                  onClick={() => setIsDeleteModalOpen(true)}
                  id="trigger-delete-modal-btn"
                >
                  <DeleteForeverOutlinedIcon fontSize="small" />
                  <span>Delete My Account</span>
                </button>
              </div>
            </main>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {isDeleteModalOpen && (
        <div className="delete-modal-overlay" role="dialog" aria-modal="true">
          <div className="delete-modal-box">
            <div className="modal-danger-header">
              <div className="modal-warning-icon">
                <WarningAmberOutlinedIcon />
              </div>
              <h3>Confirm Account Deletion</h3>
            </div>

            <p className="modal-body-text">
              Are you absolutely sure you want to delete your SavoryOps account? This will permanently delete your customer profile, orders, and booking records.
            </p>

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="modal-confirm-delete-btn"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting}
                id="modal-confirm-delete-btn"
              >
                {isDeleting ? (
                  <>
                    <CircularProgress size={16} color="inherit" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <DeleteForeverOutlinedIcon fontSize="small" />
                    <span>Permanently Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;