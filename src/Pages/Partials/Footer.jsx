import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "./UnderMaintenance.jsx";
import "../../Scss/Pages/Partials/footer.scss";

const Footer = () => {
  const { translations = {} } = useLanguage();
  const { business, policies = [] } = useWebsiteStatus();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Active policies belonging to general type
  const generalPolicies = useMemo(() => {
    return (policies || []).filter(
      (p) => p.status !== false && p.policyType === "general"
    );
  }, [policies]);

  const brandDisplayName = business?.businessname;
  const brandLogoUrl = business?.imageUrl;

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
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
              <div className="footer-contact-item">
                <LocationOnIcon fontSize="small" />
                <span>{translations.addressdistrict}</span>
              </div>
              <div className="footer-contact-item">
                <PhoneIcon fontSize="small" />
                <span>+1 (800) 555-FOOD (3663)</span>
              </div>
              {business?.email && (
                <div className="footer-contact-item">
                  <EmailOutlinedIcon fontSize="small" />
                  <a href={`mailto:${business.email}`} style={{ color: "inherit", textDecoration: "none" }}>
                    {business.email}
                  </a>
                </div>
              )}
            </div>
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
              <li><Link to="/contact" className="footer-nav-link">{translations.cateringevents}</Link></li>
              <li><Link to="/contact" className="footer-nav-link">{translations.customersupport}</Link></li>
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="footer-newsletter-btn">
                {translations.join}
              </button>
            </form>
            {subscribed && (
              <span className="footer-subscribed-msg">
                {translations.thankyousubscribing}
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
