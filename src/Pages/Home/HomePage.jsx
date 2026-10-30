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
  const [branchSetting, setBranchSetting] = useState(null);
  const [branchHours, setBranchHours] = useState(null);
  const [, setLoadingBranchSettings] = useState(true);

  // Fetch branch settings & operating hours from owner database via website API
  const fetchBranchSettings = useCallback(async () => {
    const currentSubdomain = getWebsiteSubdomain();
    if (!currentSubdomain) {
      setLoadingBranchSettings(false);
      return;
    }

    const branchId =
      localStorage.getItem("selectedBranchId") ||
      (typeof window !== "undefined" && window.__selectedBranch?._id);

    // Without branchid, do not call the API
    if (!branchId) {
      setLoadingBranchSettings(false);
      return;
    }

    try {
      const response = await fetch(`${adminPanelBackendPath}/Website/Home/GetBranchSettings/${branchId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user": "admin",
          "x-subdomain": currentSubdomain,
        },
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setBranchSetting(data.branchSetting || null);
        setBranchHours(data.branchHours || null);

        // Cache globally for child components or global listeners
        if (typeof window !== "undefined") {
          window.__branchSetting = data.branchSetting;
          window.__branchHours = data.branchHours;
          window.dispatchEvent(
            new CustomEvent("branchSettingsLoaded", {
              detail: {
                branchSetting: data.branchSetting,
                branchHours: data.branchHours,
              },
            })
          );
        }
      } else {
        setBranchSetting(null);
        setBranchHours(null);
      }
    } catch (err) {
      console.error("Error fetching branch settings & hours:", err);
      setBranchSetting(null);
      setBranchHours(null);
    } finally {
      setLoadingBranchSettings(false);
    }
  }, []);

  useEffect(() => {
    fetchBranchSettings();

    const handleStorageChange = (e) => {
      if (e.key === "selectedBranchId") {
        fetchBranchSettings();
      }
    };
    const handleBranchChange = () => {
      fetchBranchSettings();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("branchChange", handleBranchChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, [fetchBranchSettings]);

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