import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import moment from "moment-timezone";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteForeverOutlinedIcon from "@mui/icons-material/DeleteForeverOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import PhonelinkLockOutlinedIcon from "@mui/icons-material/PhonelinkLockOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import "../../Scss/Pages/Settings/settings.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

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
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  // Update document title and restore on unmount
  useEffect(() => {
    if (businessDisplayName) {
      document.title = `${translations.settings || "Settings"} | ${businessDisplayName}`;
    }
  }, [translations, businessDisplayName]);

  // Active Vertical Tab State: "datetime" | "delete"
  const [activeTab, setActiveTab] = useState("datetime");

  // Date and Time Preferences
  const [timezone, setTimezone] = useState(() => localStorage.getItem("TimeZone") || "Asia/Kolkata");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("DateFormat") || "DD/MM/YYYY");
  const [timeFormat, setTimeFormat] = useState(() => localStorage.getItem("TimeFormat") || "hh:mm A");
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Delete Account State (Matching SavoryOps_UserApp OTP flow with modern 6-digit box UI)
  const OTP_LENGTH = 6;
  const RESEND_COOLDOWN_SECONDS = 30;
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(""));
  const otpInputRefs = useRef([]);
  const [deleteOtpError, setDeleteOtpError] = useState("");
  const [isSendingDeleteOtp, setIsSendingDeleteOtp] = useState(false);
  const [deleteOtpSent, setDeleteOtpSent] = useState(false);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [resendCountdown]);

  // Load registered customer phone for delete account display hint
  const loadCustomerPhone = async (customerId, token) => {
    if (!customerId || !token || !adminPanelBackendPath) return;
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/General/GetCustomerDetails/${customerId}`, {
        headers: { "Content-Type": "application/json", "x-user": "customer", Authorization: `Bearer ${token}`, },
      });
      if (response.ok) {
        const data = await response.json();
        if (data?.phone) {
          const str = String(data.phone).trim();
          if (str.length > 4) {
            const last4 = str.slice(-4);
            const masked = str.slice(0, -4).replace(/[^\s+]/g, "*") + last4;
            setMaskedPhone(masked);
          } else {
            setMaskedPhone(str);
          }
        }
      }
    } catch (err) {
      console.error("Error loading phone for delete account:", err);
    }
  };

  // Fetch saved settings from backend API
  const fetchDateTimeSettings = async (customerId, token) => {
    if (!customerId || !token || !adminPanelBackendPath) return;

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

  // Fetch saved settings & customer phone on mount only if customer account is logged in
  useEffect(() => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (customerId && token) {
      fetchDateTimeSettings(customerId, token);
      loadCustomerPhone(customerId, token);
    }
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

    if (!customerId || !token) {
      showSnackbar(translations.signinwithphone, "warning");
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

        showSnackbar(translations.datetimesettingsavedsuccesfully || data?.message || "Date & time settings saved successfully.", "success");
      } else {
        showSnackbar(translations.servererror || data?.message || "Server error", "error");
      }
    } catch (error) {
      console.error("Error saving datetime settings:", error);
      showSnackbar(translations.servererror, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Handlers: 6-Digit OTP Box interaction
  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newValues = [...otpValues];

    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, OTP_LENGTH).split("");
      for (let i = 0; i < OTP_LENGTH; i++) {
        newValues[i] = pastedDigits[i] || "";
      }
      setOtpValues(newValues);
      setDeleteOtpError("");
      const nextFocus = Math.min(pastedDigits.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newValues[index] = cleanVal;
    setOtpValues(newValues);
    setDeleteOtpError("");

    if (cleanVal && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newValues = [...otpValues];
    pasted.split("").forEach((char, i) => {
      newValues[i] = char;
    });
    setOtpValues(newValues);
    setDeleteOtpError("");

    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpInputRefs.current[nextIndex]?.focus();
  };

  // Step 1: Send Delete Account OTP
  const handleSendDeleteOtp = async () => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId || !token) {
      showSnackbar(translations.signinwithphone, "warning");
      return;
    }

    setDeleteOtpError("");
    setIsSendingDeleteOtp(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/General/DeleteAccountSendOtp/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user": "customer", Authorization: `Bearer ${token}`, },
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        setDeleteOtpSent(true);
        setResendCountdown(RESEND_COOLDOWN_SECONDS);
        setOtpValues(Array(OTP_LENGTH).fill(""));
        setDeleteOtpError("");
        if (data?.maskedPhone) {
          setMaskedPhone(data?.maskedPhone);
        }
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
        showSnackbar(translations.deleteaccountotpsent || translations.otpsentsuccessnotice || "Verification code sent to your registered phone number.", "success");
      } else {
        const errorMsg = translations.failedtosendotp || data?.message;
        setDeleteOtpError(errorMsg);
        showSnackbar(errorMsg, "error");
      }
    } catch (error) {
      console.error("Error sending delete account OTP:", error);
      setDeleteOtpError(translations.servererror);
      showSnackbar(translations.servererror, "error");
    } finally {
      setIsSendingDeleteOtp(false);
    }
  };

  // Step 2: Open Confirmation Modal if OTP is valid
  const handleOpenDeleteConfirmModal = () => {
    setDeleteOtpError("");
    const cleanOtp = otpValues.join("").trim();
    if (!cleanOtp || cleanOtp.length !== OTP_LENGTH || !/^\d{6}$/.test(cleanOtp)) {
      setDeleteOtpError(translations.enterallotpdigits);
      return;
    }
    setIsDeleteModalOpen(true);
  };

  // Step 3: Verify OTP and Execute Account Deletion
  const handleConfirmDeleteAccount = async () => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId || !token) {
      showSnackbar(translations.signinwithphone, "warning");
      return;
    }

    const cleanOtp = otpValues.join("").trim();
    if (!cleanOtp || cleanOtp.length !== OTP_LENGTH) {
      setDeleteOtpError(translations.enterallotpdigits);
      setIsDeleteModalOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/General/DeleteAccountVerifyAndDelete/${customerId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-user": "customer", Authorization: `Bearer ${token}`, },
        body: JSON.stringify({ otp: cleanOtp }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        // Clear authentication and preferences from localStorage
        localStorage.removeItem(customerTokenName);
        localStorage.removeItem(customerIdName);
        localStorage.removeItem("DateFormat");
        localStorage.removeItem("TimeFormat");
        localStorage.removeItem("TimeZone");

        // Notify application state
        window.dispatchEvent(
          new CustomEvent("customerAuthChange", {
            detail: { isLoggedIn: false, customerId: null },
          })
        );

        setIsDeleteModalOpen(false);
        showSnackbar(translations.youraccountdeletedsuccessfully || "Account deleted successfully. You have been logged out.", "info");
        navigate("/", { replace: true });
      } else {
        const errorMsg = translations.invalidotp || data?.message;
        setDeleteOtpError(errorMsg);
        showSnackbar(errorMsg, "error");
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      showSnackbar(translations.failedtodeleteaccount, "error");
      setIsDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="settings-page-wrapper">
      <div className="settings-container">
        {/* Page Top Header */}
        <header className="settings-page-header">
          <div className="settings-page-header-meta">
            <h1 className="settings-page-title">
              {translations.settings || "Settings"}
            </h1>
            <p className="settings-page-subtitle">
              {translations.settingssubtitle ||
                "Manage your regional preferences, date & time format, and account settings."}
            </p>
          </div>
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
                <span className="tab-title">{translations.datetime}</span>
                <span className="tab-subtitle">{translations.formattimezone}</span>
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
                <span className="tab-title">{translations.deleteAccount}</span>
                <span className="tab-subtitle">{translations.permanentremoval}</span>
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
                    <span className="preview-label">{translations.preview}</span>
                    <span className="preview-timezone-note">{timezone}</span>
                  </div>
                </div>
                <div className="preview-value-text">{formattedPreview}</div>
              </div>

              {/* Settings Form Controls (Matching SavoryOps_OwnerWeb Dropdown) */}
              <div className="settings-form-grid">
                {/* 1. Timezone Select */}
                <div className="form-group">
                  <Dropdown
                    id="settings-timezone-select"
                    label={translations.timezone || "Time Zone"}
                    selectedValue={timezone}
                    onValueChange={(val) => setTimezone(val)}
                    options={TIMEZONE_OPTIONS}
                    labelKey="label"
                    valueKey="value"
                    placeholder={translations.selectoption || "Select Time Zone"}
                    showSearch={true}
                  />
                </div>

                {/* 2. Date Format & Time Format in One Row */}
                <div className="settings-form-row-2col">
                  <div className="form-group">
                    <Dropdown
                      id="settings-dateformat-select"
                      label={translations.dateformat || "Date Format"}
                      selectedValue={dateFormat}
                      onValueChange={(val) => setDateFormat(val)}
                      options={DATE_FORMAT_OPTIONS}
                      labelKey="label"
                      valueKey="value"
                      placeholder={translations.selectoption || "Select Date Format"}
                      showSearch={false}
                    />
                  </div>

                  <div className="form-group">
                    <Dropdown
                      id="settings-timeformat-select"
                      label={translations.timeformat || "Time Format"}
                      selectedValue={timeFormat}
                      onValueChange={(val) => setTimeFormat(val)}
                      options={TIME_FORMAT_OPTIONS}
                      labelKey="label"
                      valueKey="value"
                      placeholder={translations.selectoption || "Select Time Format"}
                      showSearch={false}
                    />
                  </div>
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
                      <span>{translations.saving}</span>
                    </>
                  ) : (
                    <>
                      <SaveOutlinedIcon fontSize="small" />
                      <span>{translations.savechanges}</span>
                    </>
                  )}
                </button>
              </div>
            </main>
          )}

          {/* Tab 2: Delete Account Panel */}
          {activeTab === "delete" && (
            <main className="settings-content-panel delete-account-panel" id="panel-delete-account">
              {/* Danger Warning Box */}
              <div className="danger-warning-box">
                <div className="danger-icon-pill">
                  <WarningAmberOutlinedIcon />
                </div>
                <div className="danger-content">
                  <h4>{translations.warningirreversible}</h4>
                  <p>
                    {translations.warningpermanentdeletehint}
                  </p>
                </div>
              </div>

              {/* Consequences Checklist */}
              <div className="consequences-card">
                <h5>{translations.whathappensondeletion}</h5>
                <ul>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>{translations.bulletcancelreservations}</span>
                  </li>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>{translations.bulletreceiptsdeleted}</span>
                  </li>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>{translations.bulletrewardsforfeited}</span>
                  </li>
                  <li>
                    <span className="bullet-cross">✕</span>
                    <span>{translations.bulletloggedoutdevices}</span>
                  </li>
                </ul>
              </div>

              {/* Phone Lock Info Card (Matching SavoryOps_UserApp) */}
              <div className="delete-phone-info-card">
                <div className="phone-icon-pill">
                  <PhonelinkLockOutlinedIcon />
                </div>
                <div className="phone-info-text">
                  {deleteOtpSent
                    ? (maskedPhone
                      ? `${translations.deleteaccountenterotphint} (${maskedPhone})`
                      : translations.deleteaccountenterotphint)
                    : (maskedPhone
                      ? `${translations.deleteaccountotpscreenhint} (${maskedPhone})`
                      : translations.deleteaccountotpscreenhint)
                  }
                </div>
              </div>

              {/* Step 1: Send OTP / Step 2: Enter OTP */}
              {!deleteOtpSent ? (
                <div className="delete-actions-row">
                  <button
                    type="button"
                    className="delete-send-otp-btn"
                    onClick={handleSendDeleteOtp}
                    disabled={isSendingDeleteOtp}
                    id="trigger-send-delete-otp-btn"
                  >
                    {isSendingDeleteOtp ? (
                      <>
                        <CircularProgress size={16} color="inherit" />
                        <span>{translations.sendingcode}</span>
                      </>
                    ) : (
                      <>
                        <ShieldOutlinedIcon fontSize="small" />
                        <span>{translations.sendverificationcode}</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="delete-otp-card">
                  <div className="otp-card-header">
                    <div className="otp-shield-pill">
                      <ShieldOutlinedIcon />
                    </div>
                    <div className="otp-header-info">
                      <h4 className="otp-card-title">{translations.verificationcode}</h4>
                      <p className="otp-card-subtitle">
                        {translations.deleteaccountenterotphint}
                      </p>
                    </div>
                  </div>

                  <div className="otp-card-body">
                    <div className="otp-boxes-grid" onPaste={handleOtpPaste}>
                      {otpValues.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => (otpInputRefs.current[index] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          className={`otp-digit-box ${digit ? "filled" : ""} ${deleteOtpError ? "error" : ""}`}
                          id={`delete-otp-box-${index}`}
                          autoComplete="one-time-code"
                        />
                      ))}
                    </div>

                    {deleteOtpError && (
                      <span className="delete-otp-error-text" role="alert">
                        {deleteOtpError}
                      </span>
                    )}

                    <div className="delete-resend-row">
                      {resendCountdown > 0 ? (
                        <span className="resend-countdown-label">
                          {translations.resendin} <strong>0:{resendCountdown.toString().padStart(2, "0")}</strong>
                        </span>
                      ) : (
                        <button
                          type="button"
                          className="delete-resend-btn"
                          onClick={handleSendDeleteOtp}
                          disabled={isSendingDeleteOtp}
                        >
                          <RefreshIcon fontSize="small" />
                          <span>{isSendingDeleteOtp ? translations.sendingcode : translations.resendotp}</span>
                        </button>
                      )}
                    </div>

                    <div className="delete-card-actions">
                      <button
                        type="button"
                        className="delete-cancel-btn"
                        onClick={() => {
                          setDeleteOtpSent(false);
                          setOtpValues(Array(OTP_LENGTH).fill(""));
                          setDeleteOtpError("");
                        }}
                        disabled={isDeleting}
                      >
                        {translations.cancel}
                      </button>

                      <button
                        type="button"
                        className="delete-danger-btn"
                        disabled={otpValues.join("").length !== OTP_LENGTH || isDeleting}
                        onClick={handleOpenDeleteConfirmModal}
                        id="trigger-delete-modal-btn"
                      >
                        <DeleteForeverOutlinedIcon fontSize="small" />
                        <span>{translations.deletemyaccount}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
              <h3>{translations.confirmaccountdeletion}</h3>
            </div>

            <p className="modal-body-text">
              {translations.confirmaccountdeletionsure}
            </p>

            <div className="modal-actions-row">
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                {translations.cancel}
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
                    <span>{translations.deleting}</span>
                  </>
                ) : (
                  <>
                    <DeleteForeverOutlinedIcon fontSize="small" />
                    <span>{translations.permanentlydelete}</span>
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