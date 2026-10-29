import { useState, useEffect, useMemo } from "react";
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
import { useWebsiteStatus, getWebsiteSubdomain } from "../../Pages/Partials/UnderMaintenance.jsx";
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

const HomeFeatures = ({ hasBanner = false }) => {
  const { features: contextFeatures } = useWebsiteStatus();
  const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

  const [featuresList, setFeaturesList] = useState(() =>
    Array.isArray(contextFeatures) && contextFeatures.length > 0 ? contextFeatures : []
  );

  useEffect(() => {
    let isMounted = true;
    const fetchFeatures = async () => {
      const currentSubdomain = getWebsiteSubdomain();
      if (!currentSubdomain) return;

      try {
        const response = await fetch(`${adminPanelBackendPath}/Website/Home/GetFeatures`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
            "x-subdomain": currentSubdomain,
          },
        });

        const data = await response.json();
        if (isMounted && response.ok && data.success && Array.isArray(data.features) && data.features.length > 0) {
          setFeaturesList(data.features);
        }
      } catch (err) {
        console.error("Error fetching website features:", err);
      }
    };

    fetchFeatures();
    return () => {
      isMounted = false;
    };
  }, [adminPanelBackendPath]);

  useEffect(() => {
    if (Array.isArray(contextFeatures) && contextFeatures.length > 0) {
      setFeaturesList(contextFeatures);
    }
  }, [contextFeatures]);

  const displayFeatures = useMemo(() => {
    if (!Array.isArray(featuresList)) return [];
    return featuresList
      .filter((item) => (item?.title && item.title.trim()) || (item?.desc && item.desc.trim()))
      .map((item, idx) => ({
        _id: item._id,
        title: item.title || "",
        desc: item.desc || "",
        icon: renderFeatureIcon(item.icon),
        iconClass: item.iconClass || "feature-icon-green",
      }));
  }, [featuresList]);

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