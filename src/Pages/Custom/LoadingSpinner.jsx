import CircularProgress from "@mui/material/CircularProgress";
import {
  HomeSkeleton,
  ReservationListSkeleton,
  ReservationDetailSkeleton,
  CatalogSkeleton,
  OrderListSkeleton,
  OrderDetailSkeleton,
  CartSkeleton,
  CheckoutSkeleton,
  AddressListSkeleton,
  ReviewsListSkeleton,
  NotificationsListSkeleton,
  ProfileSkeleton,
  SettingsSkeleton,
  AboutSkeleton,
  PolicySkeleton,
  SigninSkeleton,
  DetailSkeleton,
  DefaultPageSkeleton,
} from "./RoutePageSkeletons.jsx";

/**
 * Universal loading fallback component for Suspense route-level transitions,
 * dispatching to the skeleton layout matching each route or view.
 */
const LoadingSpinner = ({ type = "page", size = 36, showBreadcrumb = true }) => {
  if (type === "spinner") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "3rem 1.5rem",
          width: "100%",
          minHeight: "220px",
        }}
      >
        <CircularProgress
          size={size}
          sx={{ color: "var(--primary-color, #028802)" }}
        />
      </div>
    );
  }

  switch (type) {
    case "home":
      return <HomeSkeleton />;
    case "reservation":
      return <ReservationListSkeleton showBreadcrumb={showBreadcrumb} />;
    case "reservation-detail":
      return <ReservationDetailSkeleton showBreadcrumb={showBreadcrumb} />;
    case "menu":
    case "offers":
      return <CatalogSkeleton variant={type} />;
    case "orders":
      return <OrderListSkeleton showBreadcrumb={showBreadcrumb} />;
    case "order-detail":
      return <OrderDetailSkeleton showBreadcrumb={showBreadcrumb} />;
    case "cart":
      return <CartSkeleton />;
    case "checkout":
      return <CheckoutSkeleton />;
    case "addresses":
      return <AddressListSkeleton />;
    case "reviews":
      return <ReviewsListSkeleton />;
    case "notifications":
      return <NotificationsListSkeleton />;
    case "profile":
      return <ProfileSkeleton showBreadcrumb={showBreadcrumb} />;
    case "settings":
      return <SettingsSkeleton />;
    case "about":
      return <AboutSkeleton />;
    case "policy":
      return <PolicySkeleton showBreadcrumb={showBreadcrumb} />;
    case "signin":
      return <SigninSkeleton />;
    case "detail":
      return <DetailSkeleton />;
    default:
      return <DefaultPageSkeleton />;
  }
};

export default LoadingSpinner;
