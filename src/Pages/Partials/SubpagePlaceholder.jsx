import { useEffect } from "react";
import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "./UnderMaintenance.jsx";

const SubpagePlaceholder = ({ title, subtitle, icon }) => {
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  useEffect(() => {
    if (title && businessDisplayName) {
      document.title = `${title} | ${businessDisplayName}`;
    }
  }, [title, businessDisplayName]);

  return (
    <div className="subpage-wrapper">
      <Breadcrumbs currentPage={title} />
      <div className="subpage-container">
        <div className="subpage-hero">
          <div className="subpage-icon">{icon}</div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          <Link to="/" className="subpage-back-btn">
            <ArrowBackIcon fontSize="small" />
            <span>{translations.returntohome}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubpagePlaceholder;