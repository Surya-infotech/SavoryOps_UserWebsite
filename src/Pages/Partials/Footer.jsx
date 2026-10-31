import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PinterestIcon from "@mui/icons-material/Pinterest";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LanguageIcon from "@mui/icons-material/Language";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "./UnderMaintenance.jsx";
import "../../Scss/Pages/Partials/footer.scss";

const getSocialIcon = (platform = "") => {
  const p = platform.toLowerCase();
  if (p.includes("insta")) return <InstagramIcon fontSize="inherit" />;
  if (p.includes("face")) return <FacebookIcon fontSize="inherit" />;
  if (p.includes("twit") || p === "x") return <TwitterIcon fontSize="inherit" />;
  if (p.includes("you")) return <YouTubeIcon fontSize="inherit" />;
  if (p.includes("link")) return <LinkedInIcon fontSize="inherit" />;
  if (p.includes("pin")) return <PinterestIcon fontSize="inherit" />;
  if (p.includes("what")) return <WhatsAppIcon fontSize="inherit" />;
  return <LanguageIcon fontSize="inherit" />;
};

const Footer = () => {
  const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
  const { translations = {} } = useLanguage();
  const { business, policies = [] } = useWebsiteStatus();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (typeof window !== "undefined" && window.__selectedBranch) {
      return window.__selectedBranch;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.__selectedBranch) {
      setSelectedBranch(window.__selectedBranch);
    }

    const handleBranchChange = (e) => {
      if (e?.detail) {
        setSelectedBranch(e.detail);
      }
    };

    window.addEventListener("branchChange", handleBranchChange);

    // Request current branch from Navbar if already loaded
    window.dispatchEvent(new CustomEvent("requestBranch"));

    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, []);

  const displayAddress = useMemo(() => {
    if (!selectedBranch) return "";
    const parts = [
      selectedBranch.address,
      selectedBranch.cityname,
      selectedBranch.statename,
      selectedBranch.postalcode,
      selectedBranch.countryname,
    ].filter(Boolean);
    return parts.join(", ") || selectedBranch.address || "";
  }, [selectedBranch]);

  const displayPhone = selectedBranch?.phone || "";

  // Active policies belonging to general type
  const generalPolicies = useMemo(() => {
    return (policies || []).filter(
      (p) => p.status !== false && p.policyType === "general"
    );
  }, [policies]);

  const brandDisplayName = business?.businessname;
  const brandLogoUrl = business?.imageUrl;

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || subscribing) return;

    const currentSubdomain = getWebsiteSubdomain();
    if (!currentSubdomain) return;

    setSubscribing(true);
    setSubscribeMessage("");

    try {
      const response = await fetch(`${adminPanelBackendPath}/Website/General/SubscribeNewsletter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user": "admin",
          "x-subdomain": currentSubdomain,
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setSubscribed(true);
        setIsSuccess(true);
        setSubscribeMessage(data.message || translations.thankyousubscribing);
        setEmail("");
        setTimeout(() => {
          setSubscribed(false);
          setSubscribeMessage("");
        }, 5000);
      } else {
        setSubscribed(true);
        setIsSuccess(false);
        setSubscribeMessage(data.message || "Failed to subscribe. Please try again.");
        setTimeout(() => {
          setSubscribed(false);
          setSubscribeMessage("");
        }, 5000);
      }
    } catch (err) {
      console.error("Error subscribing to newsletter:", err);
      setSubscribed(true);
      setIsSuccess(false);
      setSubscribeMessage("Network error. Please try again.");
      setTimeout(() => {
        setSubscribed(false);
        setSubscribeMessage("");
      }, 5000);
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="savory-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo-row">
              <img
                src={brandLogoUrl}
                alt={brandDisplayName}
                className="footer-logo"
              />
              <span className="footer-brand-title">{brandDisplayName}</span>
            </div>
            <p className="footer-brand-text">
              {business?.aboutus || translations.footerbrandtext}
            </p>
            <div className="footer-contact-items">
              {displayAddress && (
                <div className="footer-contact-item">
                  <LocationOnIcon fontSize="small" />
                  <span>{displayAddress}</span>
                </div>
              )}
              {displayPhone && (
                <div className="footer-contact-item">
                  <PhoneIcon fontSize="small" />
                  <a href={`tel:${displayPhone}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {displayPhone}
                  </a>
                </div>
              )}
              {business?.email && (
                <div className="footer-contact-item">
                  <EmailOutlinedIcon fontSize="small" />
                  <a href={`mailto:${business.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {business.email}
                  </a>
                </div>
              )}
            </div>

            {Array.isArray(business?.socialmedia) && business.socialmedia.length > 0 && (
              <div className="footer-socials-row">
                {business.socialmedia.map((item, idx) => {
                  const url = item.url
                    ? item.url.startsWith("http")
                      ? item.url
                      : `https://${item.url}`
                    : "#";
                  return (
                    <a
                      key={item._id || idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="footer-social-btn"
                      title={item.platform || "Social Profile"}
                      aria-label={item.platform || "Social Profile"}
                    >
                      {getSocialIcon(item.platform)}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">{translations.exploremenu}</h4>
            <ul className="footer-nav-list">
              <li><Link to="/menu" className="footer-nav-link">🍕 {translations.artisanpizzas}</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍔 {translations.smashburgers}</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍜 {translations.ramenbowls}</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍰 {translations.dessertsgelato}</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍹 {translations.handcraftedmocktails}</Link></li>
            </ul>
          </div>

          {/* Service Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">{translations.services}</h4>
            <ul className="footer-nav-list">
              <li><Link to="/reservation" className="footer-nav-link">{translations.tablereservation}</Link></li>
              <li><Link to="/offers" className="footer-nav-link">{translations.specialoffers}</Link></li>
              <li><Link to="/about" className="footer-nav-link">{translations.aboutourkitchen}</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="footer-col footer-newsletter-box">
            <h4 className="footer-col-title">{translations.stayinspired}</h4>
            <p className="footer-newsletter-text">
              {translations.subscribetext}
            </p>
            <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="footer-newsletter-input"
                placeholder={translations.enteryouremail}
                required
                disabled={subscribing}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="footer-newsletter-btn" disabled={subscribing}>
                {subscribing ? "..." : translations.join}
              </button>
            </form>
            {subscribed && (
              <span className={`footer-subscribed-msg ${isSuccess ? "success" : "error"}`}>
                {subscribeMessage}
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © {new Date().getFullYear()} {brandDisplayName}. {translations.allrightsreserved} {translations.poweredby}{" "}
            <strong className="footer-brand-highlight">SavoryOps</strong> {translations.saasrestaurantsuite}.
          </div>
          <div className="footer-bottom-links">
            {generalPolicies.map((policy) => {
              const target = policy.title
                ? `/policy/${encodeURIComponent(policy.title.toLowerCase().trim())}`
                : `/policy/${policy.policyid || policy._id}`;
              return (
                <Link
                  key={policy._id || policy.policyid || policy.title}
                  to={target}
                >
                  {policy.title}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
