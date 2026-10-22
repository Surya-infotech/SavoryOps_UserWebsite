import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Pages/Partials/pagenotfound.scss";

const PageNotFound = () => {
  const { translations = {} } = useLanguage();

  return (
    <div className="page-not-found">
      <div className="pnf-content">
        <h1 className="pnf-code">404</h1>
        <h2 className="pnf-title">{translations.pagenotfound}</h2>
        <p className="pnf-message">
          {translations.pagenotfoundmsg}
        </p>
        <Link to="/" className="pnf-btn">
          <ArrowBackIcon fontSize="small" />
          <span>{translations.returntohome}</span>
        </Link>
      </div>
    </div>
  );
};

export default PageNotFound;
