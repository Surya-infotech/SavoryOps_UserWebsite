import { useState, useEffect, useCallback } from "react";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import HomeBanner from "../../Components/Home/HomeBanner.jsx";
import HomeFeatures from "../../Components/Home/HomeFeatures.jsx";
import HomeMenuShowcase from "../../Components/Home/HomeMenuShowcase.jsx";
import HomeCustomerApp from "../../Components/Home/HomeCustomerApp.jsx";
import HomeReviews from "../../Components/Home/HomeReviews.jsx";
import "../../Scss/Pages/Home/homepage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

const HomePage = () => {
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;
  const [hasHeroBanner, setHasHeroBanner] = useState(false);
  const [branchSetting, setBranchSetting] = useState(() => {
    return typeof window !== "undefined" ? window.__branchSetting : null;
  });
  const [branchHours, setBranchHours] = useState(() => {
    return typeof window !== "undefined" ? window.__branchHours : null;
  });

  // Get branchSetting & operating hours from Navbar.jsx
  useEffect(() => {
    const handleBranchSettingChange = (e) => {
      if (e?.detail) {
        setBranchSetting(e.detail);
      }
    };

    const handleBranchSettingsLoaded = (e) => {
      if (e?.detail) {
        if (e.detail.branchSetting) setBranchSetting(e.detail.branchSetting);
        if (e.detail.branchHours) setBranchHours(e.detail.branchHours);
      }
    };

    window.addEventListener("branchSettingChange", handleBranchSettingChange);
    window.addEventListener("branchSettingsLoaded", handleBranchSettingsLoaded);

    // Request branch settings from Navbar
    window.dispatchEvent(new CustomEvent("requestBranchSetting"));

    return () => {
      window.removeEventListener("branchSettingChange", handleBranchSettingChange);
      window.removeEventListener("branchSettingsLoaded", handleBranchSettingsLoaded);
    };
  }, []);

  useEffect(() => {
    if (businessDisplayName) {
      document.title = businessDisplayName;
    }
  }, [businessDisplayName]);

  return (
    <div className={`home-page-container ${hasHeroBanner ? "has-hero-banner" : "no-hero-banner"}`}>
      {/* 1. Hero Banner Carousel Section */}
      <HomeBanner onBannerChange={setHasHeroBanner} />

      {/* 2. Value Proposition / Feature Strip Section */}
      <HomeFeatures hasBanner={hasHeroBanner} />

      {/* 3. Section-Wise Menu Showcase (Curated Horizontal Carousels) */}
      <HomeMenuShowcase
        branchSetting={branchSetting}
        branchHours={branchHours}
      />

      {/* 4. Customer Mobile App Showcase & Tableside Ordering Section */}
      <HomeCustomerApp />

      {/* 5. Customer Dining Reviews & Testimonials Section */}
      <HomeReviews />
    </div>
  );
};

export default HomePage;