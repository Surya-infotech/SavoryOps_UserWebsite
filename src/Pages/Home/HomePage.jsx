import { useEffect } from "react";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import HomeBanner from "../../Components/Home/HomeBanner.jsx";
import HomeFeatures from "../../Components/Home/HomeFeatures.jsx";
import HomeDishes from "../../Components/Home/HomeDishes.jsx";
import HomePromo from "../../Components/Home/HomePromo.jsx";
import "../../Scss/Pages/Home/homepage.scss";

const HomePage = () => {
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  useEffect(() => {
    if (businessDisplayName) {
      document.title = businessDisplayName;
    }
  }, [businessDisplayName]);

  return (
    <div className="home-page-container">
      {/* 1. Hero Banner Carousel Section */}
      <HomeBanner />

      {/* 2. Value Proposition / Feature Strip Section */}
      <HomeFeatures />

      {/* 3. Popular Menu Showcase / Dishes Section */}
      <HomeDishes />

      {/* 4. Promotional Callout Strip Section */}
      <HomePromo />
    </div>
  );
};

export default HomePage;