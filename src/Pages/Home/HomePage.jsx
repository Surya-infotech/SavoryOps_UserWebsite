import React from "react";
import HomeBanner from "../../Components/Home/HomeBanner.jsx";
import HomeFeatures from "../../Components/Home/HomeFeatures.jsx";
import HomeDishes from "../../Components/Home/HomeDishes.jsx";
import HomePromo from "../../Components/Home/HomePromo.jsx";
import "../../Scss/Pages/Home/homepage.scss";

const HomePage = ({ userdomain }) => {
  return (
    <div className="home-page-container">
      {/* 1. Hero Banner Carousel Section */}
      <HomeBanner userdomain={userdomain} />

      {/* 2. Value Proposition / Feature Strip Section */}
      <HomeFeatures />

      {/* 3. Popular Menu Showcase / Dishes Section */}
      <HomeDishes />

      {/* 4. Promotional Callout Strip Section */}
      <HomePromo userdomain={userdomain} />
    </div>
  );
};

export default HomePage;