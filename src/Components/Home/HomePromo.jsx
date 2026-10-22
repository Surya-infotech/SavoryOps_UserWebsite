import { Link } from "react-router-dom";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Components/Home/homepromo.scss";

const HomePromo = () => {
  const { translations = {} } = useLanguage();
  const brandDisplayName = "SavoryOps Dining";

  return (
    <section className="promo-strip-section">
      <div className="promo-banner-card">
        <div className="promo-card-content">
          <span className="promo-pill">
            <LocalOfferIcon fontSize="inherit" />
            {translations.specialtenantpromotion}
          </span>
          <h3 className="promo-title">
            {translations.experiencediningat} {brandDisplayName}
          </h3>
          <p className="promo-desc">
            {translations.promodesc}
          </p>
          <div className="promo-cta-row">
            <div className="promo-code-box">
              {translations.usecode} <strong>FEAST20</strong>
            </div>
            <Link to="/menu" className="hero-btn-primary promo-cta-btn">
              <span>{translations.ordernow}</span>
              <ArrowForwardIcon fontSize="inherit" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomePromo;