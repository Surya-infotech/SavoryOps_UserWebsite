import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import "react-phone-number-input/style.css";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import EditIcon from "@mui/icons-material/Edit";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "./UnderMaintenance.jsx";
import "../../Scss/Pages/Partials/signin.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;
const logoUrl = "/logo.png";
const OTP_LENGTH = 6;
const RESEND_COOLDOWN_SECONDS = 30;

const DEMO_PHONE = "+12125550101";

const maskPhone = (phoneStr) => {
  if (!phoneStr) return "";
  const cleaned = phoneStr.trim();
  if (cleaned.length <= 6) return cleaned;
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-3);
  return `${start} •••• ${end}`;
};

const SigninPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showSnackbar } = useSnackbar();
  const { translations = {}, isRtl } = useLanguage();
  const { business, policies = [] } = useWebsiteStatus();
  const [logoError, setLogoError] = useState(false);

  // Active general-type policies for this business
  const generalPolicies = useMemo(() => {
    return (policies || []).filter(
      (p) => p.policyType === "general" && p.status !== false
    );
  }, [policies]);

  const brandDisplayName = business?.businessname;
  const brandLogoUrl = business?.imageUrl;

  // Update document title for signin and restore on unmount
  useEffect(() => {
    if (brandDisplayName) {
      document.title = `${translations.signinwithphone} | ${brandDisplayName}`;
    }
  }, [brandDisplayName, translations]);

  // Auth flow step: "phone" | "otp" | "success"
  const [step, setStep] = useState("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // OTP inputs (6 digits)
  const [otpValues, setOtpValues] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const otpInputRefs = useRef([]);

  // Loading & status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  // Return destination
  const fromDestination = location.state?.from || "/";

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (step === "otp" && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendTimer]);

  // Focus the first OTP input when moving to the OTP step
  useEffect(() => {
    if (step === "otp" && otpInputRefs.current[0]) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [step]);

  /* ==========================================================================
     Handlers: Step 1 (Send OTP)
     ========================================================================== */
  const handlePhoneSubmit = async (e) => {
    if (e) e.preventDefault();
    setPhoneError("");

    if (!phoneNumber) {
      setPhoneError(translations.enterphoneerror);
      return;
    }

    if (!isValidPhoneNumber(phoneNumber)) {
      setPhoneError(translations.validphoneerror);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${adminPanelBackendPath}/Website/General/SigninPhoneSendOtp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "customer",
        },
        body: JSON.stringify({ phone: phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        setStep("otp");
        setResendTimer(RESEND_COOLDOWN_SECONDS);
        setOtpValues(Array(OTP_LENGTH).fill(""));
        setOtpError("");
      } else {
        setPhoneError(translations.failedtosendotp);
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setPhoneError(translations.servererror);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setPhoneNumber(DEMO_PHONE);
    setPhoneError("");
  };

  /* ==========================================================================
     Handlers: Step 2 (Verify OTP)
     ========================================================================== */
  const handleOtpChange = (index, value) => {
    // Only accept numeric inputs
    const cleanVal = value.replace(/\D/g, "");
    if (!cleanVal && value !== "") return;

    const newValues = [...otpValues];

    if (cleanVal.length > 1) {
      // User pasted multiple digits into one box
      const pastedDigits = cleanVal.slice(0, OTP_LENGTH).split("");
      for (let i = 0; i < OTP_LENGTH; i++) {
        newValues[i] = pastedDigits[i] || "";
      }
      setOtpValues(newValues);
      const nextFocus = Math.min(pastedDigits.length, OTP_LENGTH - 1);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    newValues[index] = cleanVal;
    setOtpValues(newValues);
    setOtpError("");

    // Move focus to next input if filled
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

    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpInputRefs.current[nextIndex]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setOtpError("");

    const fullOtp = otpValues.join("");
    if (fullOtp.length !== OTP_LENGTH) {
      setOtpError(translations.enterallotpdigits);
      return;
    }

    setIsSubmitting(true);
    let verifySuccessData = null;

    try {
      const response = await fetch(`${adminPanelBackendPath}/Website/General/VerifySignInPhoneOtp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "customer",
        },
        body: JSON.stringify({
          phone: phoneNumber,
          otp: fullOtp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.token) {
        verifySuccessData = data;
      } else {
        setOtpError(data.message || translations.invalidotp);
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setOtpError(translations.servererror);
    } finally {
      setIsSubmitting(false);
    }

    if (verifySuccessData) {
      completeLogin(verifySuccessData);
    }
  };

  const completeLogin = (data) => {
    const customer = data.customer || {};
    const customerId = data.id || customer._id || customer.customerid || "";
    const customerToken = data.token || "";

    // Only store CUSTOMER_ID and savoryopscustomer_token in localStorage
    localStorage.setItem(customerTokenName, customerToken);
    localStorage.setItem(customerIdName, String(customerId));

    showSnackbar(translations.signedinsuccessfully, "success");

    // Dispatch custom event to notify Navbar and other components immediately
    window.dispatchEvent(
      new CustomEvent("customerAuthChange", {
        detail: {
          isLoggedIn: true,
          customerId: String(customerId),
        },
      })
    );

    setAuthenticatedUser({ phone: customer.phone || phoneNumber });
    setStep("success");

    // Redirect to previous destination after 1.8 seconds
    setTimeout(() => {
      navigate(fromDestination, { replace: true });
    }, 1800);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || isSubmitting) return;
    setOtpValues(Array(OTP_LENGTH).fill(""));
    setOtpError("");
    await handlePhoneSubmit();
  };

  const handleBackToPhone = () => {
    setStep("phone");
    setOtpError("");
  };

  return (
    <div className="signin-page-wrapper">
      {/* Background Ambient Glows */}
      <div className="signin-bg-glow glow-1" />
      <div className="signin-bg-glow glow-2" />

      <div className="signin-container">
        {/* Auth Modal/Card */}
        <div className="signin-card">
          {/* Card Header */}
          <div className="signin-card-header">
            {/* Brand Identity: Business Image & Name */}
            <div className="brand-header-section">
              <Link to="/" className="brand-identity-link" title={`${brandDisplayName} Home`}>
                <div className="brand-avatar-wrapper">
                  {brandLogoUrl && !logoError ? (
                    <img
                      src={brandLogoUrl}
                      className="brand-avatar-img"
                      alt={brandDisplayName}
                      onError={() => setLogoError(true)}
                    />
                  ) : (
                    <div className="brand-avatar-fallback">
                      <RestaurantIcon className="fallback-icon" />
                    </div>
                  )}
                </div>

                <div className="brand-meta">
                  <h2 className="brand-name">{brandDisplayName}</h2>
                </div>
              </Link>
            </div>

            {step === "success" && (
              <div className="auth-icon-badge success">
                <CheckCircleOutlinedIcon fontSize="medium" />
              </div>
            )}

            {step === "phone" && (
              <p className="auth-subtitle">
                {translations.signinsubtitle}
              </p>
            )}

            {step === "otp" && (
              <>
                <h1 className="auth-title">{translations.verifyphonenumber}</h1>
                <p className="auth-subtitle">
                  {translations.sentcodesubtitle}{" "}
                  <strong className="phone-highlight">{maskPhone(phoneNumber)}</strong>
                  <button
                    type="button"
                    onClick={handleBackToPhone}
                    className="edit-phone-btn"
                    title={translations.edit}
                  >
                    <EditIcon />
                    <span>{translations.edit}</span>
                  </button>
                </p>
              </>
            )}

            {step === "success" && (
              <>
                <h1 className="auth-title">{translations.welcomeback}</h1>
                <p className="auth-subtitle">
                  {translations.redirectingkitchen}
                </p>
              </>
            )}
          </div>

          {/* Card Body */}
          <div className="signin-card-body">
            {/* STEP 1: Phone Input Form */}
            {step === "phone" && (
              <form onSubmit={handlePhoneSubmit} className="auth-form" noValidate autoComplete="off">
                <div className="form-field-group">
                  <label htmlFor="customer-phone-input" className="form-label">
                    {translations.mobilephonenumber}
                  </label>
                  <div
                    className={`phone-input-container ${phoneError ? "has-error" : ""} ${isRtl ? "is-rtl" : ""}`}
                    dir={isRtl ? "rtl" : "ltr"}
                  >
                    <PhoneInput
                      id="customer-phone-input"
                      international
                      defaultCountry="US"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      placeholder={translations.entermobilenumber}
                      className="custom-phone-input"
                      autoFocus
                      autoComplete="off"
                      dir={isRtl ? "rtl" : "ltr"}
                      numberInputProps={{
                        autoComplete: "off",
                        dir: "ltr",
                      }}
                    />
                  </div>
                  {phoneError && (
                    <span className="field-error-text" role="alert">
                      {phoneError}
                    </span>
                  )}
                </div>

                {/* Quick Demo Fill Helper */}
                <div className="demo-fill-strip">
                  <span className="demo-label">{translations.testingdemo}</span>
                  <button
                    type="button"
                    className="demo-chip-btn"
                    onClick={handleFillDemo}
                    id="signin-demo-phone-chip"
                  >
                    <span>{translations.usedemo}</span>
                  </button>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={isSubmitting}
                  id="signin-send-otp-btn"
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" />
                      <span>{translations.sendingcode}</span>
                    </>
                  ) : (
                    <span>{translations.sendverificationcode}</span>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="auth-trust-strip">
                  <div className="trust-item">
                    <VerifiedUserOutlinedIcon fontSize="small" />
                    <span>{translations.encryptedsecure}</span>
                  </div>
                  <div className="trust-dot">•</div>
                  <div className="trust-item">
                    <span>{translations.nopasswordneeded}</span>
                  </div>
                </div>
              </form>
            )}

            {/* STEP 2: OTP Verification Form */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOtp} className="auth-form" noValidate autoComplete="off">
                <div className="form-field-group">
                  <label className="form-label">{translations.enter6digitcode}</label>
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
                        className={`otp-digit-box ${digit ? "filled" : ""} ${otpError ? "error" : ""}`}
                        id={`otp-box-${index}`}
                        autoComplete="one-time-code"
                      />
                    ))}
                  </div>

                  {otpError && (
                    <span className="field-error-text centered" role="alert">
                      {otpError}
                    </span>
                  )}
                </div>

                {/* Resend Strip */}
                <div className="resend-strip">
                  {resendTimer > 0 ? (
                    <span className="resend-timer-text">
                      {translations.resendcodein}{" "}
                      <strong>0:{resendTimer.toString().padStart(2, "0")}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="resend-action-btn"
                      onClick={handleResendOtp}
                      disabled={isSubmitting}
                      id="signin-resend-otp-btn"
                    >
                      <RefreshIcon fontSize="small" />
                      <span>{translations.resendverificationcode}</span>
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <button
                  type="submit"
                  className="auth-primary-btn"
                  disabled={isSubmitting || otpValues.join("").length !== OTP_LENGTH}
                  id="signin-verify-otp-btn"
                >
                  {isSubmitting ? (
                    <>
                      <CircularProgress size={20} color="inherit" />
                      <span>{translations.verifyingcode}</span>
                    </>
                  ) : (
                    <span>{translations.verifyandcontinue}</span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 3: Success Animation */}
            {step === "success" && (
              <div className="auth-success-box">
                <div className="success-pulse-ring" />
                <p className="success-msg">
                  {translations.signedinas} <strong>{authenticatedUser?.phone}</strong>
                </p>
                <div className="success-redirect-loader">
                  <CircularProgress size={24} />
                  <span>{translations.loadingdiningmenu}</span>
                </div>
              </div>
            )}
          </div>

          {/* Card Footer / Terms (only displayed when general policy is found) */}
          {generalPolicies.length > 0 && (
            <div className="signin-card-footer">
              <p className="terms-disclaimer">
                {translations.bycontinuingagree}{" "}
                {generalPolicies.map((policy, idx) => (
                  <span key={policy._id || policy.policyid || idx}>
                    {idx > 0 && (
                      <span>
                        {idx === generalPolicies.length - 1
                          ? ` ${translations.and} `
                          : ", "}
                      </span>
                    )}
                    <Link
                      to={`/policy/${encodeURIComponent(policy.title.toLowerCase())}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="policy-link"
                    >
                      {policy.title}
                    </Link>
                  </span>
                ))}
                .
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SigninPage;