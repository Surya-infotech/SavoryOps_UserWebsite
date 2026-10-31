import React, { useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import OrderList from "./OrderList.jsx";
import OrderDetails from "./OrderDetails.jsx";
import "../../Scss/Pages/Orders/orderspage.scss";

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
    const pageTitle = translations.orders || "Orders";
    if (businessDisplayName) {
      document.title = `${pageTitle} | ${businessDisplayName}`;
    } else {
      document.title = pageTitle;
    }
  }, [translations, businessDisplayName]);

  const handleSelectOrder = (id) => {
    navigate(`/orders/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    navigate("/orders");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const breadcrumbItems = selectedOrderId
    ? [
        { label: translations.home || "Home", path: "/" },
        { label: translations.orders || "Orders", path: "/orders" },
        { label: `${translations.order || "Order"} Details` },
      ]
    : [
        { label: translations.home || "Home", path: "/" },
        { label: translations.orders || "Orders" },
      ];

  return (
    <div className={`orders-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs - Exact design and position as Profile & ManageAddress */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="orders-page-container">
        {!selectedOrderId && (
          <header className="orders-page-header">
            <div className="orders-header-meta">
              <h1 className="orders-main-title">
                {translations.orders || "Orders"}
              </h1>
              <p className="orders-main-subtitle">
                {translations.orderssubtitle ||
                  "View, reorder, and track your active delivery orders and dining receipts."}
              </p>
            </div>
          </header>
        )}

        <div className="orders-page-content">
          {selectedOrderId ? (
            <OrderDetails
              orderId={selectedOrderId}
              onBack={handleBackToList}
            />
          ) : (
            <OrderList onSelectOrder={handleSelectOrder} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
