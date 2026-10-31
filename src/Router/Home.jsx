import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import { useLanguage } from "../Context/useLanguage.js";
import HomePage from "../Pages/Home/HomePage.jsx";
import SigninPage from "../Pages/Partials/SigninPage.jsx";
import PolicyPage from "../Pages/Partials/PolicyPage.jsx";
import PageNotFound from "../Pages/Partials/PageNotFound.jsx";
import SubpagePlaceholder from "../Pages/Partials/SubpagePlaceholder.jsx";
import SettingsPage from "../Pages/Settings/SettingsPage.jsx";
import ProfilePage from "../Pages/Profile/ProfilePage.jsx";
import ManageAddressPage from "../Pages/Profile/ManageAddressPage.jsx";
import AboutPage from "../Pages/About/AboutPage.jsx";
import MenuPage from "../Pages/Menu/MenuPage.jsx";
import CartPage from "../Pages/Cart/CartPage.jsx";
import CheckoutPage from "../Pages/Cart/CheckoutPage.jsx";
import OrdersPage from "../Pages/Orders/OrdersPage.jsx";

const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const token = localStorage.getItem(customerTokenName);
  const customerId = localStorage.getItem(customerIdName);

  if (!token || !customerId) {
    return <Navigate to="/signin" state={{ from: location.pathname }} replace />;
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
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route
        path="/checkout"
        element={
          <ProtectedRoute>
            <CheckoutPage />
          </ProtectedRoute>
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
      <Route path="/about" element={<AboutPage />} />
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
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
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
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-address"
        element={
          <ProtectedRoute>
            <ManageAddressPage />
          </ProtectedRoute>
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
