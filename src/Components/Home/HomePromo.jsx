import React from "react";
import { Link } from "react-router-dom";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import "../../Scss/Components/Home/homepromo.scss";

const HomePromo = ({ userdomain }) => {
  const brandDisplayName = userdomain
    ? userdomain.charAt(0).toUpperCase() + userdomain.slice(1)
    : "SavoryOps Dining";

  return (
    <section className="promo-strip-section">
      <div className="promo-banner-card">
        <div className="promo-card-content">
          <span className="promo-pill">
            <LocalOfferIcon fontSize="inherit" />
            Special Tenant Promotion
          </span>
          <h3 className="promo-title">
            Experience Exquisite Dining at {brandDisplayName}
          </h3>
          <p className="promo-desc">
            Whether you are craving a cozy dinner night at home or a candle-lit table reservation, enjoy our chef-special feasts with flat 20% savings.
          </p>
          <div className="promo-cta-row">
            <div className="promo-code-box">
              Use Code: <strong>FEAST20</strong>
            </div>
            <Link to="/menu" className="hero-btn-primary promo-cta-btn">
              <span>Order Now</span>
              <ArrowForwardIcon fontSize="inherit" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePromo;
