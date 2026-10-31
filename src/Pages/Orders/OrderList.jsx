import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import TakeoutDiningIcon from "@mui/icons-material/TakeoutDining";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import CircularProgress from "@mui/material/CircularProgress";

import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
  getOrderTypeBackgroundColor,
  formatOrderDateTime,
  formatOrderPrice,
} from "./orderHelpers.js";
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
  <div className="order-shimmer-card">
    <div className="shimmer-bar top-accent" />
    <div className="shimmer-header">
      <div className="shimmer-box title" />
      <div className="shimmer-box badge" />
    </div>
    <div className="shimmer-body">
      <div className="shimmer-box line" />
      <div className="shimmer-box line short" />
      <div className="shimmer-box line" />
    </div>
    <div className="shimmer-footer">
      <div className="shimmer-box pill" />
      <div className="shimmer-box pill price" />
    </div>
  </div>
);

const OrderList = ({ onSelectOrder }) => {
  const { translations = {}, isRtl } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
        translations.somethingWentWrong || "Failed to load orders",
        "error"
      );
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId, showSnackbar, translations]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  // Filter by search & status tabs
  useEffect(() => {
    let result = [...orders];

    // Status Tab Filter
    if (activeTab === "active") {
      result = result.filter((o) => {
        const s = String(o.orderstatus || "").toLowerCase();
        return (
          s !== "completed" &&
          s !== "delivered" &&
          s !== "cancelled"
        );
      });
    } else if (activeTab === "completed") {
      result = result.filter((o) => {
        const s = String(o.orderstatus || "").toLowerCase();
        return s === "completed" || s === "delivered";
      });
    } else if (activeTab === "cancelled") {
      result = result.filter((o) => {
        const s = String(o.orderstatus || "").toLowerCase();
        return s === "cancelled";
      });
    }

    // Search query filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((item) => {
        const orderNo = String(item.orderno || "").toLowerCase();
        const businessName = String(item.businessname || "").toLowerCase();
        const branchName = String(item.branchname || "").toLowerCase();
        return (
          orderNo.includes(q) ||
          businessName.includes(q) ||
          branchName.includes(q)
        );
      });
    }

    setFilteredOrders(result);
  }, [orders, search, activeTab]);

  // Tab counts
  const counts = useMemo(() => {
    const all = orders.length;
    let active = 0;
    let completed = 0;
    let cancelled = 0;
    orders.forEach((o) => {
      const s = String(o.orderstatus || "").toLowerCase();
      if (s === "cancelled") {
        cancelled += 1;
      } else if (s === "completed" || s === "delivered") {
        completed += 1;
      } else {
        active += 1;
      }
    });
    return { all, active, completed, cancelled };
  }, [orders]);

  return (
    <div className={`orders-list-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Search & Actions Bar */}
      <div className="orders-toolbar">
        <div className="orders-search-box">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              translations.searchorders ||
              "Search by order number, restaurant, branch..."
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

        <button
          type="button"
          className="orders-refresh-btn"
          onClick={handleRefresh}
          disabled={loading || refreshing}
          title="Refresh orders"
        >
          {refreshing ? (
            <CircularProgress size={18} color="inherit" />
          ) : (
            <RefreshIcon fontSize="small" />
          )}
          <span>{translations.refresh || "Refresh"}</span>
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="orders-tabs-row">
        <button
          type="button"
          className={`order-tab-btn ${activeTab === "all" ? "active" : ""}`}
          onClick={() => setActiveTab("all")}
        >
          <span>{translations.allorders || "All Orders"}</span>
          <span className="tab-count">{counts.all}</span>
        </button>
        <button
          type="button"
          className={`order-tab-btn ${activeTab === "active" ? "active" : ""}`}
          onClick={() => setActiveTab("active")}
        >
          <span>{translations.activeorders || "Active"}</span>
          {counts.active > 0 && (
            <span className="tab-count active-count">{counts.active}</span>
          )}
        </button>
        <button
          type="button"
          className={`order-tab-btn ${
            activeTab === "completed" ? "active" : ""
          }`}
          onClick={() => setActiveTab("completed")}
        >
          <span>{translations.completedorders || "Completed"}</span>
          <span className="tab-count">{counts.completed}</span>
        </button>
        <button
          type="button"
          className={`order-tab-btn ${
            activeTab === "cancelled" ? "active" : ""
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          <span>{translations.cancelledorders || "Cancelled"}</span>
          <span className="tab-count">{counts.cancelled}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <div className="orders-grid">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <ShimmerCard key={k} />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="orders-empty-state">
          <div className="empty-icon-wrap">
            <ReceiptLongIcon className="empty-illustration-icon" />
          </div>
          <h3>{translations.noorderfound || "No orders found"}</h3>
          <p>
            {translations.noorderdescription ||
              "Your order history will appear here once you place your first order."}
          </p>
          <Link to="/menu" className="empty-action-btn">
            {translations.ordernow || "Explore Menu & Order"}
          </Link>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="orders-empty-state search-empty">
          <div className="empty-icon-wrap search">
            <SearchOffIcon className="empty-illustration-icon" />
          </div>
          <h3>{translations.noorderfound || "No orders found"}</h3>
          <p>
            {translations.nosearchresultsfound ||
              "No orders match your search criteria. Try a different query."}
          </p>
          <button
            type="button"
            className="secondary-btn"
            onClick={() => setSearch("")}
          >
            {translations.clearsearch || "Clear Search Filter"}
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
                <div
                  className="card-accent-bar"
                  style={{
                    background: `linear-gradient(90deg, ${statusColor}, ${paymentColor})`,
                  }}
                />

                {/* Card Header */}
                <div className="order-tile-header">
                  <div className="order-no-pill">
                    <ReceiptLongIcon fontSize="small" />
                    <span>#{order.orderno}</span>
                  </div>

                  <span
                    className="order-status-pill"
                    style={{
                      backgroundColor: `${statusColor}15`,
                      color: statusColor,
                      borderColor: `${statusColor}35`,
                    }}
                  >
                    <CheckCircleIcon fontSize="inherit" />
                    <span>{translations[order.orderstatus] || order.orderstatus}</span>
                  </span>
                </div>

                {/* Card Details */}
                <div className="order-tile-details">
                  <div className="detail-line">
                    <div className="line-icon store">
                      <StorefrontIcon fontSize="small" />
                    </div>
                    <span className="line-text bold" title={order.businessname}>
                      {order.businessname}
                    </span>
                  </div>

                  <div className="detail-line">
                    <div className="line-icon pin">
                      <LocationOnOutlinedIcon fontSize="small" />
                    </div>
                    <span className="line-text" title={order.branchname}>
                      {order.branchname}
                    </span>
                  </div>

                  {order.ordertype && (
                    <div className="detail-line">
                      <div
                        className="line-icon type"
                        style={{
                          backgroundColor: `${orderTypeBg}18`,
                          color: orderTypeBg,
                        }}
                      >
                        {getOrderTypeComponentIcon(order.ordertype)}
                      </div>
                      <span className="line-text">
                        {translations[order.ordertype] || order.ordertype}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment & Date Row */}
                <div className="order-tile-meta-row">
                  <span
                    className="payment-badge-pill"
                    style={{
                      backgroundColor: `${paymentColor}15`,
                      color: paymentColor,
                      borderColor: `${paymentColor}30`,
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

                {/* Card Footer */}
                <div className="order-tile-footer">
                  <div className="order-amount-display">
                    <AccountBalanceWalletOutlinedIcon fontSize="small" />
                    <span className="total-val">
                      {formatOrderPrice(order.totalprice, order)}
                    </span>
                  </div>

                  <div className="view-details-action">
                    <span>{translations.viewdetails || "View Details"}</span>
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