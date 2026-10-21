import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "../../Scss/Pages/Partials/pagenotfound.scss";

const PageNotFound = () => {
  return (
    <div className="page-not-found">
      <div className="pnf-content">
        <h1 className="pnf-code">404</h1>
        <h2 className="pnf-title">Page Not Found</h2>
        <p className="pnf-message">
          The culinary page you are looking for does not exist or may have been moved.
        </p>
        <Link to="/" className="pnf-btn">
          <ArrowBackIcon fontSize="small" />
          <span>Return to Home</span>
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
