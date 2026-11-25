import { lazy, Suspense } from "react";
import { Route, Routes, Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../Pages/Custom/LoadingSpinner.jsx";
import { getSkeletonTypeForPath } from "../utils/routeSkeleton.js";

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

const withRouteSkeleton = (element, type, isProtected = false) => {
  const suspended = (
    <Suspense fallback={<LoadingSpinner type={type} />}>{element}</Suspense>
  );
  return isProtected ? <ProtectedRoute>{suspended}</ProtectedRoute> : suspended;
};

const HomeRouter = () => {
  const location = useLocation();
  const routeSkeletonType = getSkeletonTypeForPath(location.pathname, location.search);
  const reservationSkeletonType =
    routeSkeletonType === "reservation-detail" ? "reservation-detail" : "reservation";
  const ordersSkeletonType =
    routeSkeletonType === "order-detail" ? "order-detail" : "orders";

  return (
    <Suspense fallback={<LoadingSpinner type={routeSkeletonType} />}>
      <Routes>
        <Route path="/" element={withRouteSkeleton(<HomePage />, "home")} />
        <Route path="/signin" element={withRouteSkeleton(<SigninPage />, "signin")} />
        <Route path="/policy/:policyId" element={withRouteSkeleton(<PolicyPage />, "policy")} />
        <Route path="/policy" element={withRouteSkeleton(<PolicyPage />, "policy")} />
        <Route path="/menu" element={withRouteSkeleton(<MenuPage />, "menu")} />
        <Route path="/cart" element={withRouteSkeleton(<CartPage />, "cart")} />
        <Route path="/checkout" element={withRouteSkeleton(<CheckoutPage />, "checkout", true)} />
        <Route path="/offers" element={withRouteSkeleton(<OffersPage />, "offers")} />
        <Route
          path="/reservation"
          element={withRouteSkeleton(<ReservationPage />, reservationSkeletonType, true)}
        />
        <Route
          path="/reservation/:reservationId"
          element={withRouteSkeleton(<ReservationPage />, "reservation-detail", true)}
        />
        <Route
          path="/reservationdetails/:reservationId"
          element={withRouteSkeleton(<ReservationPage />, "reservation-detail", true)}
        />
        <Route path="/about" element={withRouteSkeleton(<AboutPage />, "about")} />
        <Route
          path="/orders"
          element={withRouteSkeleton(<OrdersPage />, ordersSkeletonType, true)}
        />
        <Route
          path="/orderdetails/:orderId"
          element={withRouteSkeleton(<OrdersPage />, "order-detail", true)}
        />
        <Route
          path="/orders/:orderId"
          element={withRouteSkeleton(<OrdersPage />, "order-detail", true)}
        />
        <Route path="/settings" element={withRouteSkeleton(<SettingsPage />, "settings", true)} />
        <Route path="/profile" element={withRouteSkeleton(<ProfilePage />, "profile", true)} />
        <Route
          path="/manage-address"
          element={withRouteSkeleton(<ManageAddressPage />, "addresses", true)}
        />
        <Route path="/my-reviews" element={withRouteSkeleton(<MyReviewsPage />, "reviews", true)} />
        <Route
          path="/notifications"
          element={withRouteSkeleton(<NotificationsPage />, "notifications")}
        />
        <Route path="*" element={withRouteSkeleton(<PageNotFound />, "page")} />
      </Routes>
    </Suspense>
  );
};

export default HomeRouter;