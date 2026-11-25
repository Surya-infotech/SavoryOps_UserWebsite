import { lazy, Suspense } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../Pages/Custom/LoadingSpinner.jsx";

// Lazy-loaded route pages
const HomePage = lazy(() => import("../Pages/Home/HomePage.jsx"));
const SigninPage = lazy(() => import("../Pages/Partials/SigninPage.jsx"));
const PolicyPage = lazy(() => import("../Pages/Partials/PolicyPage.jsx"));
const PageNotFound = lazy(() => import("../Pages/Partials/PageNotFound.jsx"));
const SettingsPage = lazy(() => import("../Pages/Settings/SettingsPage.jsx"));
const ProfilePage = lazy(() => import("../Pages/Profile/ProfilePage.jsx"));
const ManageAddressPage = lazy(() => import("../Pages/Profile/ManageAddressPage.jsx"));
const MyReviewsPage = lazy(() => import("../Pages/Profile/MyReviewsPage.jsx"));
const AboutPage = lazy(() => import("../Pages/About/AboutPage.jsx"));
const MenuPage = lazy(() => import("../Pages/Menu/MenuPage.jsx"));
const OffersPage = lazy(() => import("../Pages/Offers/OffersPage.jsx"));
const CartPage = lazy(() => import("../Pages/Cart/CartPage.jsx"));
const CheckoutPage = lazy(() => import("../Pages/Cart/CheckoutPage.jsx"));
const OrdersPage = lazy(() => import("../Pages/Orders/OrdersPage.jsx"));
const ReservationPage = lazy(() => import("../Pages/Reservation/ReservationPage.jsx"));
const NotificationsPage = lazy(() => import("../Pages/Notifications/NotificationsPage.jsx"));

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
  return (
    <Suspense fallback={<LoadingSpinner type="page" />}>
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
        <Route path="/offers" element={<OffersPage />} />
        <Route
          path="/reservation"
          element={
            <ProtectedRoute>
              <ReservationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservation/:reservationId"
          element={
            <ProtectedRoute>
              <ReservationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservationdetails/:reservationId"
          element={
            <ProtectedRoute>
              <ReservationPage />
            </ProtectedRoute>
          }
        />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orderdetails/:orderId"
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
            <ProtectedRoute>
              <MyReviewsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Suspense>
  );
};

export default HomeRouter;
