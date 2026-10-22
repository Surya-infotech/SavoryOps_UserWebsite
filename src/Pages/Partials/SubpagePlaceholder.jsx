import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLanguage } from "../../Context/useLanguage.js";

const SubpagePlaceholder = ({ title, subtitle, icon }) => {
  const { translations = {} } = useLanguage();

  return (
    <div className="subpage-container">
      <div className="subpage-hero">
        <div className="subpage-icon">{icon}</div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <Link to="/" className="subpage-back-btn">
          <ArrowBackIcon fontSize="small" />
          <span>{translations.returntohome || "Return to Home"}</span>
        </Link>
      </div>
    </div>
  );
};

export default SubpagePlaceholder;