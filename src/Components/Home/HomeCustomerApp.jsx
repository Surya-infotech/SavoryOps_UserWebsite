import { Link } from "react-router-dom";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import PaymentIcon from "@mui/icons-material/Payment";
import StarIcon from "@mui/icons-material/Star";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Components/Home/homecustomerapp.scss";

/**
 * Official Google Play Store Vector Icon
 */
const GooglePlayIcon = ({ className = "google-play-svg-icon" }) => (
  <svg
    className={className}
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="#4285F4"
      d="M32.53 18.08C23.63 27.67 18 42.15 18 60.1v391.8c0 17.95 5.63 32.43 14.53 42.02l2.36 2.36L254.7 276.49V235.5L34.89 15.72l-2.36 2.36z"
    />
    <path
      fill="#FBBC04"
      d="M328.05 349.85l-73.35-73.36v-40.98l73.35-73.36 1.74.99 86.88 49.36c24.8 14.09 24.8 37.16 0 51.25l-86.88 49.36-1.74 2.74z"
    />
    <path
      fill="#EA4335"
      d="M329.79 347.11L254.7 272.02 32.53 494.19c8.2 8.68 21.73 9.77 36.93 1.14l260.33-148.22z"
    />
    <path
      fill="#34A853"
      d="M329.79 164.89L69.46 16.67C54.26 8.04 40.73 9.13 32.53 17.81L254.7 239.98l75.09-75.09z"
    />
  </svg>
);

const HomeCustomerApp = () => {
  const { translations = {} } = useLanguage();
  const googlePlayUrl = "https://play.google.com/store/apps/details?id=com.savoryops";

  return (
    <section className="customer-app-section" id="customer-mobile-app">
      <div className="customer-app-card">
        {/* Ambient Glows */}
        <div className="app-glow app-glow-top" />
        <div className="app-glow app-glow-bottom" />

        <div className="customer-app-grid">
          {/* Left Column: Heading, Info, Feature Pills & Action Row */}
          <div className="customer-app-info-col">
            <div className="app-pill-badge">
              <span className="pulsing-green-dot" />
              <SmartphoneIcon fontSize="inherit" />
              <span>{translations.customerapptag}</span>
            </div>

            <h2 className="app-hero-title">
              {translations.customerapptitle}
            </h2>

            <p className="app-hero-desc">
              {translations.customerappdesc}
            </p>

            {/* Compact Highlight Pills */}
            <div className="app-highlights-strip">
              <span className="app-highlight-pill">
                <TableRestaurantIcon fontSize="inherit" />
                {translations.customerappfeature1title}
              </span>
              <span className="app-highlight-pill">
                <SoupKitchenIcon fontSize="inherit" />
                {translations.customerappfeature2title}
              </span>
              <span className="app-highlight-pill">
                <PaymentIcon fontSize="inherit" />
                {translations.customerappfeature4title}
              </span>
            </div>

            {/* Store Download & Web Order Actions */}
            <div className="app-download-action-row">
              <div className="app-stores-group">
                {/* Google Play Store Button */}
                <a
                  href={googlePlayUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-button google-play-btn"
                  title={translations.downloadgoogleplay}
                >
                  <GooglePlayIcon className="google-play-svg-icon" />
                  <div className="store-btn-text">
                    <span className="store-btn-sub">
                      {translations.getitongoogleplay}
                    </span>
                    <strong className="store-btn-main">
                      {translations.googleplay}
                    </strong>
                  </div>
                </a>

                {/* Direct Web Order Button */}
                <Link to="/menu" className="store-button web-order-btn">
                  <span>{translations.quickorderweb}</span>
                  <ArrowForwardIcon fontSize="small" />
                </Link>
              </div>

              {/* 100% Genuine Scannable QR Code Widget */}
              <a
                href={googlePlayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="app-qr-widget"
                title={translations.scanorclickgoogleplay}
              >
                <div className="qr-code-graphic-wrap">
                  <img
                    src="/customer-app-qr.png"
                    alt={translations.scanqrtodownloadapp}
                    className="qr-real-image"
                  />
                  <div className="qr-scan-laser-line" />
                </div>
                <div className="qr-widget-label">
                  <span className="qr-widget-title">
                    {translations.scantodownload}
                  </span>
                  <span className="qr-widget-hint">
                    {translations.scantodownloaddesc}
                  </span>
                </div>
              </a>
            </div>

            {/* Diner Trust Rating Strip */}
            <div className="app-trust-rating-strip">
              <div className="app-rating-stars">
                {[...Array(5)].map((_, i) => (
                  <StarIcon key={i} className="star-icon-filled" fontSize="inherit" />
                ))}
              </div>
              <span className="app-rating-text">
                {translations.appratingbadge}
              </span>
            </div>
          </div>

          {/* Right Column: Proper User App Screen Showcase */}
          <div className="customer-app-mockup-col">
            <div className="app-preview-frame">
              <img
                src="/customer-app-preview.jpg"
                alt="SavoryOps Customer Mobile App"
                className="app-preview-screen-img"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeCustomerApp;