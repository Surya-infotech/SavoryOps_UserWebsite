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
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import "../../Scss/Pages/About/aboutpage.scss";

const DEFAULT_PILLARS = [
  {
    id: 1,
    title: "Seasonal Fresh Ingredients",
    text: "We partner with responsible growers, organic orchards, and daily fisheries to guarantee pristine freshness and vibrant flavors in every bite.",
    icon: "organic",
    colorClass: "green",
  },
  {
    id: 2,
    title: "Master Chef Craftsmanship",
    text: "Our culinary team combines time-honored artisanal recipes with progressive cooking techniques to deliver unforgettable dining experiences.",
    icon: "chef",
    colorClass: "purple",
  },
  {
    id: 3,
    title: "Uncompromising Quality",
    text: "From hygiene and safety standards to flawless plating, we adhere to stringent standards to ensure pure dining satisfaction.",
    icon: "shield",
    colorClass: "amber",
  },
  {
    id: 4,
    title: "Seamless Hospitality",
    text: "Enjoy contactless online reservations, fast tableside dining, and attentive guest service tailored to every celebration.",
    icon: "table",
    colorClass: "rose",
  },
];

const getPillarIcon = (iconKey) => {
  switch (iconKey) {
    case "organic":
      return <SpaIcon fontSize="inherit" />;
    case "chef":
      return <RestaurantIcon fontSize="inherit" />;
    case "shield":
      return <VerifiedIcon fontSize="inherit" />;
    case "table":
      return <TableRestaurantIcon fontSize="inherit" />;
    case "clock":
      return <AccessTimeIcon fontSize="inherit" />;
    default:
      return <SpaIcon fontSize="inherit" />;
  }
};

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
  const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
  const { translations = {} } = useLanguage();
  const { business: contextBusiness, subdomain: contextSubdomain } = useWebsiteStatus();

  const [aboutUsSetting, setAboutUsSetting] = useState(null);
  const [apiBusiness, setApiBusiness] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch about us setting directly from the backend API for this page
  useEffect(() => {
    let isMounted = true;
    const fetchAboutData = async () => {
      const currentSubdomain = getWebsiteSubdomain() || contextSubdomain;
      if (!currentSubdomain) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`${adminPanelBackendPath}/Website/General/GetAboutUsSetting`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
            "x-subdomain": currentSubdomain,
          },
        });

        const data = await response.json();
        if (isMounted && response.ok && data.success) {
          if (data.aboutus) {
            setAboutUsSetting(data.aboutus);
          }
          if (data.business) {
            setApiBusiness(data.business);
          }
        }
      } catch (err) {
        console.error("Error fetching about us data:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAboutData();
    return () => {
      isMounted = false;
    };
  }, [adminPanelBackendPath, contextSubdomain]);

  const business = apiBusiness || contextBusiness;
  const subdomain = contextSubdomain || getWebsiteSubdomain();

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

  // Dynamic About Us Data with graceful fallbacks
  const heroBadge = aboutUsSetting?.heroBadge || translations.aboutourkitchen || "Culinary Story & Heritage";
  const heroTitle = aboutUsSetting?.heroTitle || translations.experiencediningat || "Experience Dining at";
  const heroHighlight = aboutUsSetting?.heroHighlight || businessName;
  const heroLead =
    aboutUsSetting?.heroLead ||
    businessAbout ||
    translations.aboutsubtitle ||
    "Passionate chefs, farm-fresh local produce, and centuries-old culinary traditions reimagined for modern gastronomy.";

  const heroBadges = useMemo(() => {
    if (Array.isArray(aboutUsSetting?.heroBadges) && aboutUsSetting.heroBadges.some(Boolean)) {
      return aboutUsSetting.heroBadges.filter(Boolean);
    }
    return [
      "Farm-to-Table Fresh",
      "100% Handcrafted",
      "Express Tableside Service",
    ];
  }, [aboutUsSetting]);

  const valuesSubtitle = aboutUsSetting?.valuesSubtitle || "OUR VALUES";
  const valuesTitle = aboutUsSetting?.valuesTitle || "Why Dine With Us";
  const valuesDesc =
    aboutUsSetting?.valuesDesc ||
    "Every dish is thoughtfully designed with premium ingredients, masterful culinary craft, and an unwavering commitment to hospitality.";

  const pillarsList = useMemo(() => {
    if (Array.isArray(aboutUsSetting?.pillars) && aboutUsSetting.pillars.some((p) => p.title || p.text)) {
      return aboutUsSetting.pillars.map((p, idx) => ({
        id: p.id || idx + 1,
        title: p.title || DEFAULT_PILLARS[idx]?.title || "Culinary Craft",
        text: p.text || DEFAULT_PILLARS[idx]?.text || "",
        icon: p.icon || DEFAULT_PILLARS[idx]?.icon || "organic",
        colorClass: p.colorClass || DEFAULT_PILLARS[idx]?.colorClass || "green",
      }));
    }
    return DEFAULT_PILLARS;
  }, [aboutUsSetting]);

  const storyQuote = aboutUsSetting?.storyQuote || businessAbout;
  const storyAuthor = aboutUsSetting?.storyAuthor || (businessName ? `— Culinary Team, ${businessName}` : "");

  const ctaTitle = aboutUsSetting?.ctaTitle || "Ready to Taste the Craft?";
  const ctaDesc =
    aboutUsSetting?.ctaDesc ||
    "Explore our full culinary menu or reserve a table for an unforgettable dining experience today.";
  const ctaMenuBtnText = aboutUsSetting?.ctaMenuBtnText || "Explore Menu";
  const ctaBookingBtnText = aboutUsSetting?.ctaBookingBtnText || "Book A Table";

  return (
    <div className="about-page-wrapper">
      {/* 1. Hero Banner Section */}
      <section className="about-hero-section">
        <div className="about-hero-inner">
          <Breadcrumbs
            currentPage={translations.aboutus || "About Us"}
            className="about-breadcrumbs-wrapper"
          />

          <div className="about-hero-grid">
            <div className="about-hero-text">
              <div className="about-brand-tag">
                <RestaurantIcon className="tag-icon" />
                <span>{heroBadge}</span>
              </div>

              <h1 className="about-title">
                {heroTitle}
                <span className="about-title-highlight"> {heroHighlight}</span>
              </h1>

              <p className="about-lead">
                {heroLead}
              </p>

              <div className="about-hero-badges">
                {heroBadges.map((badge, bIdx) => (
                  <div key={bIdx} className="hero-badge-pill">
                    {bIdx === 0 ? (
                      <VerifiedIcon className="badge-pill-icon" />
                    ) : bIdx === 1 ? (
                      <SpaIcon className="badge-pill-icon" />
                    ) : (
                      <AccessTimeIcon className="badge-pill-icon" />
                    )}
                    <span>{badge}</span>
                  </div>
                ))}
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
            <span className="section-subtitle">{valuesSubtitle}</span>
            <h2 className="section-title">{valuesTitle}</h2>
            <p className="section-desc">{valuesDesc}</p>
          </div>

          <div className="pillars-grid">
            {pillarsList.map((pillar) => (
              <div key={pillar.id} className="pillar-card">
                <div className={`pillar-icon-box ${pillar.colorClass || "green"}`}>
                  {getPillarIcon(pillar.icon)}
                </div>
                <h3 className="pillar-title">{pillar.title}</h3>
                <p className="pillar-text">{pillar.text}</p>
              </div>
            ))}
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

              {storyQuote && (
                <div className="story-quote-card">
                  <p className="story-quote-text">
                    "{storyQuote}"
                  </p>
                  {storyAuthor && (
                    <span className="story-quote-author">
                      {storyAuthor.startsWith("—") ? storyAuthor : `— ${storyAuthor}`}
                    </span>
                  )}
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
              <h2 className="cta-title">{ctaTitle}</h2>
              <p className="cta-desc">
                {ctaDesc}
              </p>
              <div className="cta-buttons">
                <Link to="/menu" className="btn btn-primary cta-btn">
                  <MenuBookIcon fontSize="small" />
                  <span>{ctaMenuBtnText}</span>
                  <ArrowForwardIcon fontSize="small" />
                </Link>
                <Link to="/reservation" className="btn btn-outline cta-btn">
                  <TableRestaurantIcon fontSize="small" />
                  <span>{ctaBookingBtnText}</span>
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