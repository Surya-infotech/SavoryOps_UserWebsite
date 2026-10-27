import { useState, useEffect } from "react";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import HomeBanner from "../../Components/Home/HomeBanner.jsx";
import HomeFeatures from "../../Components/Home/HomeFeatures.jsx";
import HomeCustomerApp from "../../Components/Home/HomeCustomerApp.jsx";
import HomeReviews from "../../Components/Home/HomeReviews.jsx";
import "../../Scss/Pages/Home/homepage.scss";

const HomePage = () => {
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;
  const [hasHeroBanner, setHasHeroBanner] = useState(false);

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

      {/* 3. Customer Mobile App Showcase & Tableside Ordering Section */}
      <HomeCustomerApp />

      {/* 4. Customer Dining Reviews & Testimonials Section */}
      <HomeReviews />
    </div>
  );
};

export default HomePage;