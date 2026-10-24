import { Route, Routes, Navigate } from "react-router-dom";
import { useLanguage } from "../Context/useLanguage.js";
import HomePage from "../Pages/Home/HomePage.jsx";
import SigninPage from "../Pages/Partials/SigninPage.jsx";
import PolicyPage from "../Pages/Partials/PolicyPage.jsx";
import PageNotFound from "../Pages/Partials/PageNotFound.jsx";
import SubpagePlaceholder from "../Pages/Partials/SubpagePlaceholder.jsx";
import SettingsPage from "../Pages/Settings/SettingsPage.jsx";

const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem(customerTokenName);
  const customerId = localStorage.getItem(customerIdName);

  if (!token || !customerId) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const HomeRouter = () => {
  const { translations = {} } = useLanguage();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SigninPage />} />
      <Route path="/policy/:policyId" element={<PolicyPage />} />
      <Route path="/policy" element={<PolicyPage />} />
      <Route
        path="/menu"
        element={
          <SubpagePlaceholder
            icon="🍕"
            title={translations.fullculinarymenu}
            subtitle={translations.menusubtitle}
          />
        }
      />
      <Route
        path="/offers"
        element={
          <SubpagePlaceholder
            icon="🔥"
            title={translations.specialoffers}
            subtitle={translations.offerssubtitle}
          />
        }
      />
      <Route
        path="/reservation"
        element={
          <SubpagePlaceholder
            icon="🍷"
            title={translations.tablebooking}
            subtitle={translations.bookingsubtitle}
          />
        }
      />
      <Route
        path="/about"
        element={
          <SubpagePlaceholder
            icon="🌿"
            title={translations.aboutkitchen}
            subtitle={translations.aboutsubtitle}
          />
        }
      />
      <Route
        path="/contact"
        element={
          <SubpagePlaceholder
            icon="📞"
            title={translations.contactcatering}
            subtitle={translations.contactsubtitle}
          />
        }
      />
      <Route
        path="/orders"
        element={
          <SubpagePlaceholder
            icon="🧾"
            title={translations.orders}
            subtitle={translations.orderssubtitle}
          />
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-address"
        element={
          <SubpagePlaceholder
            icon="📍"
            title={translations.manageaddress}
            subtitle={translations.addresssubtitle}
          />
        }
      />
      <Route
        path="/my-reviews"
        element={
          <SubpagePlaceholder
            icon="⭐"
            title={translations.myreviews}
            subtitle={translations.reviewssubtitle}
          />
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default HomeRouter;
