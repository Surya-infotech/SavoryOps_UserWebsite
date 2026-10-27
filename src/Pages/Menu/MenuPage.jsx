import { useEffect } from "react";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import HomeDishes from "../../Components/Home/HomeDishes.jsx";
import "../../Scss/Pages/Menu/menupage.scss";

const MenuPage = () => {
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  useEffect(() => {
    if (businessDisplayName) {
      document.title = `${translations.menu || "Menu"} | ${businessDisplayName}`;
    }
  }, [businessDisplayName, translations]);

  return (
    <div className="menu-page-wrapper">
      <div className="menu-page-top-bar">
        <div className="menu-page-container">
          <Breadcrumbs currentPage={translations.menu || "Menu"} />
        </div>
      </div>
      <HomeDishes />
    </div>
  );
};

export default MenuPage;