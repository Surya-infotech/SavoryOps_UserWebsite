import React from "react";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import SpaIcon from "@mui/icons-material/Spa";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import "../../Scss/Components/Home/homefeatures.scss";

const FEATURES_DATA = [
  {
    id: 1,
    icon: <DeliveryDiningIcon fontSize="inherit" />,
    iconClass: "feature-icon-green",
    title: "Fast 30-Min Delivery",
    desc: "Hot, fresh & sealed packaging right to your door",
  },
  {
    id: 2,
    icon: <SpaIcon fontSize="inherit" />,
    iconClass: "feature-icon-amber",
    title: "100% Organic & Fresh",
    desc: "Handpicked farm-to-table seasonal produce daily",
  },
  {
    id: 3,
    icon: <RestaurantMenuIcon fontSize="inherit" />,
    iconClass: "feature-icon-purple",
    title: "Master Chef Recipes",
    desc: "Authentic recipes made with passion & precision",
  },
  {
    id: 4,
    icon: <TableRestaurantIcon fontSize="inherit" />,
    iconClass: "feature-icon-rose",
    title: "Instant Table Booking",
    desc: "Zero waiting line with contactless digital reservation",
  },
];

const HomeFeatures = () => {
  return (
    <section className="features-strip">
      <div className="features-grid">
        {FEATURES_DATA.map((item) => (
          <div key={item.id} className="feature-card">
            <div className={`feature-icon-wrapper ${item.iconClass}`}>
              {item.icon}
            </div>
            <div className="feature-text">
              <span className="feature-title">{item.title}</span>
              <span className="feature-desc">{item.desc}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeFeatures;
