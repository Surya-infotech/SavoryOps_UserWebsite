import { useState, useEffect, useRef } from "react";
import { useWebsiteStatus, getWebsiteSubdomain } from "../Partials/UnderMaintenance.jsx";
import LoadingSpinner from "../Custom/LoadingSpinner.jsx";
import HomeBanner from "../../Components/Home/HomeBanner.jsx";
import HomeFeatures from "../../Components/Home/HomeFeatures.jsx";
import HomeMenuShowcase from "../../Components/Home/HomeMenuShowcase.jsx";
import HomeCustomerApp from "../../Components/Home/HomeCustomerApp.jsx";
import HomeReviews from "../../Components/Home/HomeReviews.jsx";
import "../../Scss/Pages/Home/homepage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

const fetchHomeJson = async (url, subdomain) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-user": "admin",
        "x-subdomain": subdomain,
      },
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, data };
  } catch (err) {
    console.error(`Error fetching ${url}:`, err);
    return { ok: false, data: null };
  }
};

const getActiveBranchId = () => {
  if (typeof window === "undefined") return "";
  return (
    localStorage.getItem("selectedBranchId") ||
    window.__selectedBranch?._id ||
    ""
  );
};

const HomePage = () => {
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  const [banners, setBanners] = useState([]);
  const [features, setFeatures] = useState([]);
  const [showcases, setShowcases] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const loadedBranchIdRef = useRef("");

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
    window.dispatchEvent(new CustomEvent("requestBranchSetting"));

    return () => {
      window.removeEventListener("branchSettingChange", handleBranchSettingChange);
      window.removeEventListener("branchSettingsLoaded", handleBranchSettingsLoaded);
    };
  }, []);

  // Load all initial Home page sections in parallel before revealing the page
  useEffect(() => {
    let cancelled = false;
    let cleanupBranchWaiter = null;
    const subdomain = getWebsiteSubdomain();

    const fetchBranchSections = async (branchId) => {
      if (!branchId) {
        return { banners: [], showcases: [], branchSetting: null };
      }

      const [bannersRes, showcasesRes] = await Promise.all([
        fetchHomeJson(
          `${adminPanelBackendPath}/Website/Home/GetHomeBanners/${branchId}`,
          subdomain
        ),
        fetchHomeJson(
          `${adminPanelBackendPath}/Website/Home/GetShowcases/${branchId}`,
          subdomain
        ),
      ]);

      return {
        banners:
          bannersRes.ok &&
          bannersRes.data?.success &&
          Array.isArray(bannersRes.data.banners)
            ? bannersRes.data.banners
            : [],
        showcases:
          showcasesRes.ok &&
          showcasesRes.data?.success &&
          Array.isArray(showcasesRes.data.showcases)
            ? showcasesRes.data.showcases
            : [],
        branchSetting: showcasesRes.ok ? showcasesRes.data?.branchSetting || null : null,
      };
    };

    const initHomeData = async () => {
      if (!subdomain) {
        await Promise.resolve();
        if (!cancelled) setLoading(false);
        return;
      }

      const featuresPromise = fetchHomeJson(
        `${adminPanelBackendPath}/Website/Home/GetFeatures`,
        subdomain
      ).then((res) =>
        res.ok && res.data?.success && Array.isArray(res.data.features)
          ? res.data.features
          : []
      );

      const reviewsPromise = fetchHomeJson(
        `${adminPanelBackendPath}/Website/Home/GetReviews`,
        subdomain
      ).then((res) =>
        res.ok && res.data?.success && Array.isArray(res.data.reviews)
          ? res.data.reviews
          : []
      );

      const initialBranchId = getActiveBranchId();
      let branchPromise;

      if (initialBranchId) {
        loadedBranchIdRef.current = String(initialBranchId);
        branchPromise = fetchBranchSections(initialBranchId);
      } else if (typeof window !== "undefined" && window.__branchesLoaded) {
        branchPromise = Promise.resolve({ banners: [], showcases: [], branchSetting: null });
      } else {
        branchPromise = new Promise((resolve) => {
          let settled = false;
          const finish = (branchObj) => {
            if (settled) return;
            settled = true;
            window.removeEventListener("branchesLoaded", onBranchesLoaded);
            window.removeEventListener("branchChange", onBranchEvent);
            const resolvedId = branchObj?._id || getActiveBranchId();
            if (resolvedId) {
              loadedBranchIdRef.current = String(resolvedId);
              fetchBranchSections(resolvedId).then(resolve);
            } else {
              resolve({ banners: [], showcases: [], branchSetting: null });
            }
          };

          const onBranchesLoaded = (e) => finish(e?.detail?.branch);
          const onBranchEvent = (e) => {
            if (e?.detail?._id) finish(e.detail);
          };

          cleanupBranchWaiter = () => {
            if (settled) return;
            settled = true;
            window.removeEventListener("branchesLoaded", onBranchesLoaded);
            window.removeEventListener("branchChange", onBranchEvent);
            resolve({ banners: [], showcases: [], branchSetting: null });
          };

          window.addEventListener("branchesLoaded", onBranchesLoaded);
          window.addEventListener("branchChange", onBranchEvent);
          window.dispatchEvent(new CustomEvent("requestBranch"));
        });
      }

      const [nextFeatures, nextReviews, branchData] = await Promise.all([
        featuresPromise,
        reviewsPromise,
        branchPromise,
      ]);

      if (!cancelled) {
        setFeatures(nextFeatures);
        setReviews(nextReviews);
        setBanners(branchData.banners);
        setShowcases(branchData.showcases);
        if (branchData.branchSetting) {
          setBranchSetting(branchData.branchSetting);
          if (typeof window !== "undefined") {
            window.__branchSetting = branchData.branchSetting;
          }
        }
        setLoading(false);
      }
    };

    const handleBranchChange = async (e) => {
      if (!subdomain) return;
      const nextBranchId = e?.detail?._id || getActiveBranchId();
      if (!nextBranchId || String(nextBranchId) === String(loadedBranchIdRef.current)) {
        return;
      }

      loadedBranchIdRef.current = String(nextBranchId);
      const branchData = await fetchBranchSections(nextBranchId);
      if (!cancelled) {
        setBanners(branchData.banners);
        setShowcases(branchData.showcases);
        if (branchData.branchSetting) {
          setBranchSetting(branchData.branchSetting);
          if (typeof window !== "undefined") {
            window.__branchSetting = branchData.branchSetting;
          }
        }
      }
    };

    initHomeData();
    window.addEventListener("branchChange", handleBranchChange);

    return () => {
      cancelled = true;
      if (cleanupBranchWaiter) cleanupBranchWaiter();
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, []);

  useEffect(() => {
    if (businessDisplayName) {
      document.title = businessDisplayName;
    }
  }, [businessDisplayName]);

  if (loading) {
    return <LoadingSpinner type="home" />;
  }

  const hasHeroBanner = banners.length > 0;

  return (
    <div className={`home-page-container ${hasHeroBanner ? "has-hero-banner" : "no-hero-banner"}`}>
      {/* 1. Hero Banner Carousel Section */}
      <HomeBanner banners={banners} />

      {/* 2. Value Proposition / Feature Strip Section */}
      <HomeFeatures features={features} hasBanner={hasHeroBanner} />

      {/* 3. Section-Wise Menu Showcase (Curated Horizontal Carousels) */}
      <HomeMenuShowcase
        showcases={showcases}
        branchSetting={branchSetting}
        branchHours={branchHours}
      />

      {/* 4. Customer Mobile App Showcase & Tableside Ordering Section */}
      <HomeCustomerApp />

      {/* 5. Customer Dining Reviews & Testimonials Section */}
      <HomeReviews reviews={reviews} />
    </div>
  );
};

export default HomePage;