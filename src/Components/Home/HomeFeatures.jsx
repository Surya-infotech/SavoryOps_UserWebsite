import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import SpaIcon from "@mui/icons-material/Spa";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Components/Home/homefeatures.scss";

const HomeFeatures = () => {
  const { translations = {} } = useLanguage();

  const featuresData = [
    {
      id: 1,
      icon: <DeliveryDiningIcon fontSize="inherit" />,
      iconClass: "feature-icon-green",
      title: translations.fastdeliverytitle || "Fast 30-Min Delivery",
      desc: translations.fastdeliverydesc || "Hot, fresh & sealed packaging right to your door",
    },
    {
      id: 2,
      icon: <SpaIcon fontSize="inherit" />,
      iconClass: "feature-icon-amber",
      title: translations.organicfreshtitle || "100% Organic & Fresh",
      desc: translations.organicfreshdesc || "Handpicked farm-to-table seasonal produce daily",
    },
    {
      id: 3,
      icon: <RestaurantMenuIcon fontSize="inherit" />,
      iconClass: "feature-icon-purple",
      title: translations.mastercheftitle || "Master Chef Recipes",
      desc: translations.masterchefdesc || "Authentic recipes made with passion & precision",
    },
    {
      id: 4,
      icon: <TableRestaurantIcon fontSize="inherit" />,
      iconClass: "feature-icon-rose",
      title: translations.instantbookingtitle || "Instant Table Booking",
      desc: translations.instantbookingdesc || "Zero waiting line with contactless digital reservation",
    },
  ];

  return (
    <section className="features-strip">
      <div className="features-grid">
        {featuresData.map((item) => (
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
