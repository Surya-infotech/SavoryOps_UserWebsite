import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const SubpagePlaceholder = ({ title, subtitle, icon }) => (
  <div className="subpage-container">
    <div className="subpage-hero">
      <div className="subpage-icon">{icon}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <Link to="/" className="subpage-back-btn">
        <ArrowBackIcon fontSize="small" />
        <span>Return to Home</span>
      </Link>
    </div>
  </div>
);

export default SubpagePlaceholder;