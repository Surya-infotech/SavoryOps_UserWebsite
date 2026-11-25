import { useEffect, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import LoadingSpinner from "../Custom/LoadingSpinner.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import "../../Scss/Pages/Orders/orderspage.scss";

const OrderList = lazy(() => import("./OrderList.jsx"));
const OrderDetails = lazy(() => import("./OrderDetails.jsx"));

const OrdersPage = () => {
  const { orderId: paramOrderId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname || "";

  // Selected Order ID from URL parameter or query search
  const selectedOrderId = paramOrderId || searchParams.get("id") || null;

  useEffect(() => {
    const pageTitle = selectedOrderId
      ? translations.orderdetails
      : translations.orders;
    if (businessDisplayName) {
      document.title = `${pageTitle} | ${businessDisplayName}`;
    } else {
      document.title = pageTitle;
    }
  }, [selectedOrderId, translations, businessDisplayName]);

  const handleSelectOrder = (id) => {
    navigate(`/orderdetails/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    navigate("/orders");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const breadcrumbItems = selectedOrderId
    ? [
        { label: translations.home, path: "/" },
        { label: translations.orders, path: "/orders" },
        { label: translations.orderdetails },
      ]
    : [
        { label: translations.home, path: "/" },
        { label: translations.orders },
      ];

  return (
    <div className={`orders-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs - Exact design and position as Profile & ManageAddress */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="orders-page-container">
        <div className="orders-page-content">
          <Suspense fallback={<LoadingSpinner type="detail" />}>
            {selectedOrderId ? (
              <OrderDetails
                orderId={selectedOrderId}
                onBack={handleBackToList}
              />
            ) : (
              <OrderList onSelectOrder={handleSelectOrder} />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;