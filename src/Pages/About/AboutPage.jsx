import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import VerifiedIcon from "@mui/icons-material/Verified";
import SpaIcon from "@mui/icons-material/Spa";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import PinterestIcon from "@mui/icons-material/Pinterest";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import LanguageIcon from "@mui/icons-material/Language";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import "../../Scss/Pages/About/aboutpage.scss";

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

const AboutPage = () => {
  const { translations = {} } = useLanguage();
  const { business, subdomain } = useWebsiteStatus();

  const businessName = business?.businessname || "Our Restaurant";
  const businessLogo = business?.imageUrl;
  const businessEmail = business?.email;
  const businessAbout = business?.aboutus || "";
  const socialMedia = business?.socialmedia || [];

  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (typeof window !== "undefined" && window.__selectedBranch) {
      return window.__selectedBranch;
    }
    return null;
  });

  useEffect(() => {
    if (businessName) {
      document.title = `${translations.aboutus || "About Us"} | ${businessName}`;
    }
  }, [businessName, translations]);

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
    window.dispatchEvent(new CustomEvent("requestBranch"));

    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, []);

  const fullAddress = useMemo(() => {
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

  const branchPhone = selectedBranch?.phone || "";

  return (
    <div className="about-page-wrapper">
      {/* 1. Hero Banner Section */}
      <section className="about-hero-section">
        <div className="about-hero-inner">
          <div className="about-breadcrumbs">
            <Link to="/" className="breadcrumb-link">
              {translations.returntohome || "Home"}
            </Link>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-current">
              {translations.aboutus || "About Us"}
            </span>
          </div>

          <div className="about-hero-grid">
            <div className="about-hero-text">
              <div className="about-brand-tag">
                <RestaurantIcon className="tag-icon" />
                <span>{translations.aboutourkitchen || "Culinary Story & Heritage"}</span>
              </div>

              <h1 className="about-title">
                {translations.experiencediningat || "Experience Dining at"}
                <span className="about-title-highlight"> {businessName}</span>
              </h1>

              <p className="about-lead">
                {businessAbout ||
                  translations.aboutsubtitle ||
                  "Passionate chefs, farm-fresh local produce, and centuries-old culinary traditions reimagined for modern gastronomy."}
              </p>

              <div className="about-hero-badges">
                <div className="hero-badge-pill">
                  <VerifiedIcon className="badge-pill-icon" />
                  <span>Farm-to-Table Fresh</span>
                </div>
                <div className="hero-badge-pill">
                  <SpaIcon className="badge-pill-icon" />
                  <span>100% Handcrafted</span>
                </div>
                <div className="hero-badge-pill">
                  <AccessTimeIcon className="badge-pill-icon" />
                  <span>Express Tableside Service</span>
                </div>
              </div>
            </div>

            {/* Hero Image Showcase */}
            <div className="about-hero-media">
              <div className="media-frame">
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt={businessName}
                    className="about-hero-image"
                  />
                ) : (
                  <div className="about-hero-image-placeholder">
                    <RestaurantIcon className="placeholder-icon" />
                  </div>
                )}
                <div className="media-overlay-card">
                  <div className="overlay-pill">
                    <span className="pulse-dot" />
                    <span>{subdomain ? `${subdomain}.savoryops.website` : "Online Kitchen"}</span>
                  </div>
                  <h4 className="overlay-heading">{businessName}</h4>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Philosophy & Core Pillars */}
      <section className="about-pillars-section">
        <div className="section-container">
          <div className="section-header">
            <span className="section-subtitle">OUR VALUES</span>
            <h2 className="section-title">Why Dine With Us</h2>
            <p className="section-desc">
              Every dish is thoughtfully designed with premium ingredients, masterful culinary craft, and an unwavering commitment to hospitality.
            </p>
          </div>

          <div className="pillars-grid">
            <div className="pillar-card">
              <div className="pillar-icon-box green">
                <SpaIcon fontSize="inherit" />
              </div>
              <h3 className="pillar-title">Seasonal Fresh Ingredients</h3>
              <p className="pillar-text">
                We partner with responsible growers, organic orchards, and daily fisheries to guarantee pristine freshness and vibrant flavors in every bite.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box purple">
                <RestaurantIcon fontSize="inherit" />
              </div>
              <h3 className="pillar-title">Master Chef Craftsmanship</h3>
              <p className="pillar-text">
                Our culinary team combines time-honored artisanal recipes with progressive cooking techniques to deliver unforgettable dining experiences.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box amber">
                <VerifiedIcon fontSize="inherit" />
              </div>
              <h3 className="pillar-title">Uncompromising Quality</h3>
              <p className="pillar-text">
                From hygiene and safety standards to flawless plating, we adhere to stringent standards to ensure pure dining satisfaction.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon-box rose">
                <TableRestaurantIcon fontSize="inherit" />
              </div>
              <h3 className="pillar-title">Seamless Hospitality</h3>
              <p className="pillar-text">
                Enjoy contactless online reservations, fast tableside dining, and attentive guest service tailored to every celebration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Detailed Business Information & Active Branch */}
      <section className="about-details-section">
        <div className="section-container">
          <div className="details-card-container">
            <div className="details-left-col">
              <div className="brand-overview-box">
                {businessLogo && (
                  <img
                    src={businessLogo}
                    alt={businessName}
                    className="brand-avatar"
                  />
                )}
                <div>
                  <h3 className="brand-name">{businessName}</h3>
                  <span className="brand-badge">Official Restaurant Details</span>
                </div>
              </div>

              {businessAbout && (
                <div className="story-quote-card">
                  <p className="story-quote-text">
                    "{businessAbout}"
                  </p>
                  <span className="story-quote-author">
                    — Culinary Team, {businessName}
                  </span>
                </div>
              )}

              {/* Social Media Row */}
              {Array.isArray(socialMedia) && socialMedia.length > 0 && (
                <div className="about-social-block">
                  <h4 className="social-block-title">Follow Our Culinary Journey</h4>
                  <div className="social-links-list">
                    {socialMedia.map((social, idx) => {
                      const url = social.url
                        ? social.url.startsWith("http")
                          ? social.url
                          : `https://${social.url}`
                        : "#";
                      return (
                        <a
                          key={social._id || idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="about-social-chip"
                          title={social.platform || "Social Profile"}
                        >
                          <span className="chip-icon-wrap">
                            {getSocialIcon(social.platform)}
                          </span>
                          <span className="chip-label">{social.platform || "Connect"}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Selected Branch Location & Contact Info */}
            <div className="details-right-col">
              <div className="contact-info-card">
                <div className="contact-card-header">
                  <span className="contact-kicker">CURRENT BRANCH LOCATION</span>
                  <h3 className="contact-branch-name">
                    {selectedBranch?.branchname || "Selected Branch"}
                  </h3>
                </div>

                <div className="contact-details-list">
                  {fullAddress && (
                    <div className="contact-detail-row">
                      <div className="row-icon-box">
                        <LocationOnIcon fontSize="small" />
                      </div>
                      <div className="row-content">
                        <span className="row-label">Address</span>
                        <span className="row-value">{fullAddress}</span>
                      </div>
                    </div>
                  )}

                  {branchPhone && (
                    <div className="contact-detail-row">
                      <div className="row-icon-box">
                        <PhoneIcon fontSize="small" />
                      </div>
                      <div className="row-content">
                        <span className="row-label">Phone & Helpline</span>
                        <a href={`tel:${branchPhone}`} className="row-link">
                          {branchPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {businessEmail && (
                    <div className="contact-detail-row">
                      <div className="row-icon-box">
                        <EmailOutlinedIcon fontSize="small" />
                      </div>
                      <div className="row-content">
                        <span className="row-label">Email Support</span>
                        <a href={`mailto:${businessEmail}`} className="row-link">
                          {businessEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="branch-helper-note">
                  <CheckCircleOutlinedIcon className="helper-icon" />
                  <span>
                    To switch dining branches, use the branch location selector in the top navigation bar.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Action CTA Strip */}
      <section className="about-cta-section">
        <div className="section-container">
          <div className="about-cta-banner">
            <div className="cta-content">
              <h2 className="cta-title">Ready to Taste the Craft?</h2>
              <p className="cta-desc">
                Explore our full culinary menu or reserve a table for an unforgettable dining experience today.
              </p>
              <div className="cta-buttons">
                <Link to="/menu" className="btn btn-primary cta-btn">
                  <MenuBookIcon fontSize="small" />
                  <span>Explore Menu</span>
                  <ArrowForwardIcon fontSize="small" />
                </Link>
                <Link to="/reservation" className="btn btn-outline cta-btn">
                  <TableRestaurantIcon fontSize="small" />
                  <span>Book A Table</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;