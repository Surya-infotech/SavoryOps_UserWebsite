import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import TakeoutDiningIcon from "@mui/icons-material/TakeoutDining";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";

import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
  getOrderTypeBackgroundColor,
  formatOrderDateTime,
  formatOrderPrice,
} from "./orderHelpers.js";
import OrderStatusIcon from "./OrderStatusIcon.jsx";
import "../../Scss/Pages/Orders/orderspage.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const getOrderTypeComponentIcon = (orderType) => {
  const norm = String(orderType || "").toLowerCase().replace(/[-\s_]/g, "");
  switch (norm) {
    case "dinein":
      return <TableRestaurantIcon fontSize="inherit" />;
    case "pickup":
      return <TakeoutDiningIcon fontSize="inherit" />;
    case "delivery":
      return <DeliveryDiningIcon fontSize="inherit" />;
    case "takeaway":
      return <ShoppingBagOutlinedIcon fontSize="inherit" />;
    case "quickorder":
    case "quick":
      return <BoltIcon fontSize="inherit" />;
    default:
      return <RestaurantIcon fontSize="inherit" />;
  }
};

const ShimmerCard = () => (
  <div className="order-card-tile order-shimmer-card">
    <div className="shimmer-box top-accent" />
    <div className="order-card-main">
      <div className="shimmer-header">
        <div className="shimmer-box title" />
        <div className="shimmer-box badge" />
      </div>
      <div className="shimmer-restaurant-row">
        <div className="shimmer-box avatar" />
        <div className="shimmer-col">
          <div className="shimmer-box line title-line" />
          <div className="shimmer-box line sub-line" />
        </div>
      </div>
      <div className="shimmer-box preview-line" />
      <div className="shimmer-divider" />
      <div className="shimmer-footer">
        <div className="shimmer-box price" />
        <div className="shimmer-box circle-btn" />
      </div>
    </div>
  </div>
);

const OrderList = ({ onSelectOrder }) => {
  const { translations = {}, isRtl } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const customerId = localStorage.getItem(customerIdName);
  const dateFormat = localStorage.getItem("DateFormat") || "DD/MM/YYYY";
  const timeFormat = localStorage.getItem("TimeFormat") || "hh:mm A";
  const timeZone = localStorage.getItem("TimeZone") || "Asia/Kolkata";

  const fetchOrders = useCallback(async () => {
    if (!customerId) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Order/GetOrder/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
          },
        }
      );

      const data = await response.json();
      if (response.ok && Array.isArray(data)) {
        setOrders(data);
        setFilteredOrders(data);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (err) {
      console.error("Error fetching customer orders:", err);
      showSnackbar(
        translations.somethingWentWrong,
        "error"
      );
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, [customerId, showSnackbar, translations]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const q = search.trim().toLowerCase();
    const filtered = orders.filter((item) => {
      const orderNo = String(item.orderno || "").toLowerCase();
      const businessName = String(item.businessname || "").toLowerCase();
      const branchName = String(item.branchname || "").toLowerCase();
      return (
        orderNo.includes(q) ||
        businessName.includes(q) ||
        branchName.includes(q)
      );
    });

    setFilteredOrders(filtered);
  }, [orders, search]);

  return (
    <div className={`orders-list-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Search Toolbar - Parity with UserApp */}
      {!loading && orders.length > 0 && (
        <div className="orders-toolbar">
          <div className="orders-search-box">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                translations.searchorders
              }
            />
            {search && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <CloseIcon fontSize="small" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area - Parity with Offers Page & Manage Address */}
      {loading ? (
        <div className="orders-grid">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <ShimmerCard key={k} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        /* Empty State (No Orders Placed) - Exact parity with Offers Page */
        <div className="address-empty-card orders-empty-state">
          <div className="empty-icon-wrap">
            <ReceiptLongOutlinedIcon className="empty-icon" />
          </div>
          <h2 className="empty-title">
            {translations.noorderfound}
          </h2>
          <p className="empty-subtitle">
            {translations.noorderdescription}
          </p>
          <Link to="/menu" className="empty-add-btn">
            <RestaurantMenuIcon fontSize="small" />
            <span>{translations.exploremenu}</span>
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        /* Search Empty State */
        <div className="address-empty-card orders-empty-state search-empty">
          <div className="empty-icon-wrap search">
            <SearchOffIcon className="empty-icon" />
          </div>
          <h2 className="empty-title">
            {translations.nosearchresultsfound}
          </h2>
          <p className="empty-subtitle">
            {translations.noordersmatchsearch}
          </p>
          <button
            type="button"
            className="empty-add-btn secondary"
            onClick={() => setSearch("")}
          >
            <CloseIcon fontSize="small" />
            <span>{translations.clearsearch}</span>
          </button>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map((order) => {
            const statusColor = getOrderStatusColor(order.orderstatus);
            const paymentColor = getPaymentStatusColor(order.paymentstatus);
            const orderTypeBg = getOrderTypeBackgroundColor(order.ordertype);

            return (
              <div
                key={order._id}
                className="order-card-tile"
                onClick={() => onSelectOrder(order._id)}
              >
                {/* Top accent bar */}
                <div className="card-accent-bar" />

                <div className="order-card-main">
                  {/* Card Header: Order #, Order Type, and Status */}
                  <div className="order-tile-header">
                    <div className="header-tags-left">
                      <div className="order-no-badge">
                        <ReceiptLongIcon className="order-no-icon" />
                        <span>#{order.orderno}</span>
                      </div>

                      {order.ordertype && (
                        <span
                          className="order-type-chip"
                          style={{
                            backgroundColor: `${orderTypeBg}14`,
                            color: orderTypeBg,
                            borderColor: `${orderTypeBg}30`,
                          }}
                        >
                          {getOrderTypeComponentIcon(order.ordertype)}
                          <span>{translations[order.ordertype] || order.ordertype}</span>
                        </span>
                      )}
                    </div>

                    <span
                      className="order-status-pill"
                      style={{
                        backgroundColor: `${statusColor}14`,
                        color: statusColor,
                        borderColor: `${statusColor}30`,
                      }}
                    >
                      <OrderStatusIcon status={order.orderstatus} fontSize="inherit" />
                      <span>{translations[order.orderstatus] || order.orderstatus}</span>
                    </span>
                  </div>

                  {/* Restaurant & Branch Info */}
                  <div className="order-restaurant-row">
                    <div className="restaurant-avatar-box">
                      <StorefrontIcon />
                    </div>
                    <div className="restaurant-meta-col">
                      <h4 className="restaurant-brand-name" title={order.businessname}>
                        {order.businessname}
                      </h4>
                      <div className="restaurant-branch-subline" title={order.branchname}>
                        <LocationOnOutlinedIcon className="branch-pin-icon" />
                        <span>{order.branchname}</span>
                      </div>
                    </div>
                  </div>

                  {/* Items Summary Preview (if available) */}
                  {Array.isArray(order.products) && order.products.length > 0 && (
                    <div className="order-items-preview">
                      <span className="items-count-badge">
                        {order.products.length}{" "}
                        {order.products.length === 1
                          ? translations.item
                          : translations.items}
                      </span>
                      <span className="items-preview-names">
                        {order.products
                          .map((p) => p.name || p.itemname)
                          .filter(Boolean)
                          .slice(0, 2)
                          .join(", ")}
                        {order.products.length > 2 ? "..." : ""}
                      </span>
                    </div>
                  )}

                  {/* Payment & Date Row */}
                  <div className="order-tile-meta-row">
                    <span
                      className="payment-badge-pill"
                      style={{
                        backgroundColor: `${paymentColor}14`,
                        color: paymentColor,
                        borderColor: `${paymentColor}28`,
                      }}
                    >
                      <PaymentsOutlinedIcon fontSize="inherit" />
                      <span>{translations[order.paymentstatus] || order.paymentstatus}</span>
                    </span>

                    <div className="order-date-pill">
                      <CalendarMonthOutlinedIcon fontSize="inherit" />
                      <span>
                        {formatOrderDateTime(
                          order.createdAt,
                          dateFormat,
                          timeFormat,
                          timeZone
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="order-tile-footer">
                  <div className="order-amount-display">
                    <span className="total-val">
                      {formatOrderPrice(order.totalprice, order)}
                    </span>
                  </div>

                  <div className="order-action-circle" title={translations.viewdetails}>
                    <ArrowForwardIcon className="arrow-icon" fontSize="small" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderList;