import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "./useLanguage.js";
import { LanguageDropdown } from "../Pages/Partials/Navbar.jsx";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import BuildCircleIcon from "@mui/icons-material/BuildCircle";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LanguageIcon from "@mui/icons-material/Language";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import "../Scss/Components/Status/undermaintenance.scss";

const WebsiteStatusContext = createContext(null);

export const useWebsiteStatus = () => {
  const context = useContext(WebsiteStatusContext);
  if (!context) {
    throw new Error("useWebsiteStatus must be used within a WebsiteStatusProvider");
  }
  return context;
};

/**
 * Extracts subdomain from current website host (e.g. "restaurant" from "restaurant.savoryops.website")
 */
export const getWebsiteSubdomain = () => {
  if (typeof window === "undefined") return "";

  const host = window.location.hostname;
  const parts = host.split(".");
  if (parts.length > 1) {
    return parts[0].toLowerCase().trim();
  }
};

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const POLL_INTERVAL_MS = 30000;

export const WebsiteStatusProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [isWebsiteEnabled, setIsWebsiteEnabled] = useState(true);
  const [business, setBusiness] = useState(null);
  const [subdomain, setSubdomain] = useState(() => getWebsiteSubdomain());
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);
  const pollTimerRef = useRef(null);

  // Sync document title and favicon dynamically whenever business details update
  useEffect(() => {
    if (business?.businessname) {
      document.title = business.businessname;
    }

    if (business?.imageUrl) {
      const iconLinks = document.querySelectorAll(
        "link[rel*='icon'], link[rel='apple-touch-icon']"
      );
      if (iconLinks.length > 0) {
        iconLinks.forEach((link) => {
          link.href = business.imageUrl;
        });
      } else {
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = "image/png";
        link.href = business.imageUrl;
        document.head.appendChild(link);
      }
    }
  }, [business]);

  const checkStatus = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setChecking(true);
    const currentSubdomain = getWebsiteSubdomain();
    setSubdomain(currentSubdomain);

    if (!currentSubdomain) {
      setIsWebsiteEnabled(false);
      setLoading(false);
      if (isManualRefresh) setChecking(false);
      return;
    }

    try {
      const url = `${adminPanelBackendPath}/Website/General/CheckWebsiteStatus`;

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json", "x-user": "admin", "x-subdomain": currentSubdomain },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsWebsiteEnabled(Boolean(data.isWebsiteEnabled));
        if (data.business) {
          setBusiness(data.business);
        }
        setError(null);
      } else {
        setIsWebsiteEnabled(false);
        setError(data?.message || "Website is currently unavailable.");
      }
    } catch (err) {
      console.error("Error checking website status:", err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (isManualRefresh) setChecking(false);
      setLastChecked(new Date());
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    if (!isWebsiteEnabled) {
      pollTimerRef.current = setInterval(() => {
        checkStatus(false);
      }, POLL_INTERVAL_MS);
    } else {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    }

    return () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
      }
    };
  }, [isWebsiteEnabled, checkStatus]);

  const value = {
    loading,
    checking,
    isWebsiteEnabled,
    business,
    subdomain,
    error,
    lastChecked,
    recheckWebsiteStatus: () => checkStatus(true),
  };

  return (
    <WebsiteStatusContext.Provider value={value}>
      {children}
    </WebsiteStatusContext.Provider>
  );
};

/* ==========================================================================
   Under Maintenance Screen Component
   ========================================================================== */
export const UnderMaintenance = () => {
  const { business, subdomain, checking, recheckWebsiteStatus, lastChecked } = useWebsiteStatus();
  const { translations = {} } = useLanguage();

  const businessName = business?.businessname || "SavoryOps Culinary";
  const logoUrl = business?.imageUrl;
  const email = business?.email;
  const socialMedia = business?.socialmedia || [];

  const handleManualCheck = async () => {
    if (checking) return;
    await recheckWebsiteStatus();
  };

  const formatTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const domainDisplay = subdomain ? `${subdomain}.savoryops.website` : (typeof window !== "undefined" ? window.location.hostname : "savoryops.website");

  return (
    <div className="maintenance-screen-wrapper">
      {/* Dynamic Ambient Background Elements */}
      <div className="maintenance-ambient-glow glow-top-left" />
      <div className="maintenance-ambient-glow glow-bottom-right" />
      <div className="maintenance-grid-overlay" />

      {/* Header bar */}
      <header className="maintenance-header">
        <div className="maintenance-brand-pill">
          {logoUrl ? (
            <img src={logoUrl} alt={businessName} className="brand-logo-img" />
          ) : (
            <div className="brand-logo-placeholder">
              <RestaurantIcon />
            </div>
          )}
          <span className="brand-name">{businessName}</span>
        </div>

        <div className="maintenance-header-actions">
          <LanguageDropdown className="maintenance-lang-dropdown" />
        </div>
      </header>

      {/* Center Main Stage Card */}
      <main className="maintenance-main-container">
        <div className="maintenance-card">
          {/* Status Badge */}
          <div className="status-badge-container">
            <span className="pulsing-beacon" />
            <span className="status-badge-text">
              {translations.systemmaintenancemode || "Scheduled Maintenance Mode"}
            </span>
          </div>

          {/* Animated Culinary & Gear Centerpiece */}
          <div className="maintenance-graphic-stage">
            <div className="graphic-orbit orbit-outer">
              <span className="orbiting-star star-1">✨</span>
              <span className="orbiting-star star-2">🍕</span>
              <span className="orbiting-star star-3">🍷</span>
            </div>
            <div className="graphic-glow-circle">
              <div className="graphic-icon-wrap">
                <RestaurantIcon className="icon-main-cutlery" />
                <div className="graphic-mini-badge">
                  <BuildCircleIcon className="icon-mini-gear" />
                </div>
              </div>
            </div>
          </div>

          {/* Website Domain Subtitle Pill */}
          <div className="maintenance-domain-pill">
            <LanguageIcon className="domain-globe-icon" />
            <span className="domain-text">{domainDisplay}</span>
            <span className="domain-status-dot" title="Maintenance Active" />
          </div>

          {/* Main Headings */}
          <h1 className="maintenance-title">
            {translations.undermaintenancetitle || "We're Brewing Something Exceptional"}
          </h1>

          <p className="maintenance-description">
            {translations.undermaintenancedesc ||
              "Our restaurant website is temporarily offline for scheduled system updates, menu enhancements, and cloud optimizations. We apologize for the inconvenience and will be back online shortly!"}
          </p>

          {/* Action Trigger Area */}
          <div className="maintenance-action-strip">
            <button
              type="button"
              className={`maintenance-refresh-btn ${checking ? "loading" : ""}`}
              onClick={handleManualCheck}
              disabled={checking}
              id="check-maintenance-status-btn"
            >
              <RefreshIcon className={`refresh-btn-icon ${checking ? "spinning" : ""}`} />
              <span>
                {checking
                  ? (translations.checkingstatus || "Checking Status...")
                  : (translations.checkstatusagain || "Check Availability")}
              </span>
            </button>
          </div>

          {/* Auto Reconnect & Timestamp indicator */}
          <div className="maintenance-meta-info">
            <span className="meta-item">
              <AccessTimeIcon className="meta-icon" />
              <span>{translations.autocheckin || "Auto-reconnecting every 30s"}</span>
            </span>
            {lastChecked && (
              <span className="meta-item">
                <CheckCircleIcon className="meta-icon" />
                <span>
                  {translations.lastchecked || "Last checked"}: {formatTime(lastChecked)}
                </span>
              </span>
            )}
          </div>

          {/* Direct Support & Social Links */}
          {(email || (socialMedia && socialMedia.length > 0)) && (
            <div className="maintenance-contact-section">
              <div className="contact-divider">
                <span>{translations.contactus || "Need Direct Assistance?"}</span>
              </div>

              <div className="contact-buttons-row">
                {email && (
                  <a href={`mailto:${email}`} className="contact-action-chip" title="Email restaurant">
                    <EmailOutlinedIcon className="chip-icon" />
                    <span>{email}</span>
                  </a>
                )}
                {business?.phone && (
                  <a href={`tel:${business.phone}`} className="contact-action-chip" title="Call helpline">
                    <PhoneOutlinedIcon className="chip-icon" />
                    <span>{business.phone}</span>
                  </a>
                )}
              </div>

              {socialMedia && socialMedia.length > 0 && (
                <div className="maintenance-socials-row">
                  {socialMedia.map((item, idx) => {
                    const platform = (item.platform || "").toLowerCase();
                    let IconComponent = LanguageIcon;
                    if (platform.includes("insta")) IconComponent = InstagramIcon;
                    else if (platform.includes("face")) IconComponent = FacebookIcon;
                    else if (platform.includes("twit") || platform.includes("x")) IconComponent = TwitterIcon;

                    return (
                      <a
                        key={idx}
                        href={item.url || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="social-icon-btn"
                        title={item.platform || "Social Profile"}
                      >
                        <IconComponent />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer Copyright */}
      <footer className="maintenance-footer">
        <p className="footer-text">
          © {new Date().getFullYear()} {businessName}.{" "}
          <span className="platform-tag">
            {translations.savoryopsplatform || "Powered by SavoryOps Hospitality Cloud"}
          </span>
        </p>
      </footer>
    </div>
  );
};

export default UnderMaintenance;