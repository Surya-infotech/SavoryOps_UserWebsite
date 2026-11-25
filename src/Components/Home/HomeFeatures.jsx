import { useMemo } from "react";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import SpaIcon from "@mui/icons-material/Spa";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import StarIcon from "@mui/icons-material/Star";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import "../../Scss/Components/Home/homefeatures.scss";

const ICON_MAP = {
  delivery: DeliveryDiningIcon,
  organic: SpaIcon,
  chef: RestaurantMenuIcon,
  table: TableRestaurantIcon,
  star: StarIcon,
  clock: AccessTimeIcon,
  shield: VerifiedIcon,
  discount: LocalOfferIcon,
  coffee: LocalCafeIcon,
  sparkles: AutoAwesomeIcon,
};

const renderFeatureIcon = (iconKey) => {
  const IconComp = ICON_MAP[iconKey] || DeliveryDiningIcon;
  return <IconComp fontSize="inherit" />;
};

const HomeFeatures = ({ features = [], hasBanner = false }) => {
  const displayFeatures = useMemo(() => {
    if (!Array.isArray(features)) return [];
    return features
      .filter((item) => (item?.title && item.title.trim()) || (item?.desc && item.desc.trim()))
      .map((item) => ({
        _id: item._id,
        title: item.title || "",
        desc: item.desc || "",
        icon: renderFeatureIcon(item.icon),
        iconClass: item.iconClass || "feature-icon-green",
      }));
  }, [features]);

  if (displayFeatures.length === 0) {
    return null;
  }

  return (
    <section className={`features-strip ${hasBanner ? "has-banner" : "no-banner"}`}>
      <div className="features-grid">
        {displayFeatures.map((item) => (
          <div key={item._id} className="feature-card">
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