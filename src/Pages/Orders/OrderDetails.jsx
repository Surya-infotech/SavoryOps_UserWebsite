import React, { useState, useEffect, useCallback, useMemo } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HistoryIcon from "@mui/icons-material/History";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import TakeoutDiningIcon from "@mui/icons-material/TakeoutDining";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ShoppingBasketOutlinedIcon from "@mui/icons-material/ShoppingBasketOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import SpeakerNotesOutlinedIcon from "@mui/icons-material/SpeakerNotesOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import RefreshIcon from "@mui/icons-material/Refresh";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import {
  getOrderStatusColor,
  getPaymentStatusColor,
  getItemStatusColor,
  getOrderTypeBackgroundColor,
  isDeliveryOrderType,
  isDineInOrderType,
  isItemCancelled,
  normalizeLocationDetails,
  formatLocationDetailsLine,
  formatLocationAddressType,
  formatOrderDateTime,
  formatOrderPrice,
} from "./orderHelpers.js";
import { printOrderInvoice } from "./orderInvoiceGenerator.js";
import "../../Scss/Pages/Orders/orderdetails.scss";
import OrderStatusHistoryModal from "./OrderStatusHistoryModal.jsx";
import OrderReviewModal from "./OrderReviewModal.jsx";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

const getOrderTypeComponentIcon = (orderType) => {
  const norm = String(orderType || "").toLowerCase().replace(/[-\s_]/g, "");
  switch (norm) {
    case "dinein":
      return <TableRestaurantIcon fontSize="small" />;
    case "pickup":
      return <TakeoutDiningIcon fontSize="small" />;
    case "delivery":
      return <DeliveryDiningIcon fontSize="small" />;
    case "takeaway":
      return <ShoppingBagOutlinedIcon fontSize="small" />;
    default:
      return <RestaurantIcon fontSize="small" />;
  }
};

/**
 * Modern Skeleton Shimmer for Order Details
 * Replaces the spinner with animated cards mirroring the actual layout
 */
const OrderDetailsShimmer = () => (
  <div className="order-details-container order-details-shimmer">
    {/* Nav Header Shimmer */}
    <div className="order-details-nav-header">
      <div className="shimmer-line order-title-shimmer" />
      <div className="shimmer-pill order-btn-shimmer" />
    </div>

    {/* Content Grid Shimmer */}
    <div className="order-details-content-grid">
      {/* Left Column Shimmer */}
      <div className="details-main-column">
        {/* Overview Card Shimmer */}
        <div className="detail-card shimmer-card overview-shimmer">
          <div className="shimmer-accent-bar" />
          <div className="shimmer-badges-row">
            <div className="shimmer-pill status-pill-shimmer" />
            <div className="shimmer-pill payment-pill-shimmer" />
          </div>
          <div className="shimmer-grid">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shimmer-info-row">
                <div className="shimmer-icon-box" />
                <div className="shimmer-text-col">
                  <div className="shimmer-line text-val" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Items Card Shimmer */}
        <div className="detail-card shimmer-card items-shimmer">
          <div className="shimmer-accent-bar primary" />
          <div className="shimmer-card-header">
            <div className="shimmer-line header-title" />
            <div className="shimmer-pill count-pill" />
          </div>
          <div className="shimmer-items-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="shimmer-product-row">
                <div className="shimmer-dot" />
                <div className="shimmer-product-meta">
                  <div className="shimmer-line product-name" />
                  <div className="shimmer-line product-price" />
                </div>
                <div className="shimmer-pill qty-pill" />
                <div className="shimmer-line total-price" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column Shimmer */}
      <div className="details-side-column">
        {/* Bill Summary Card Shimmer */}
        <div className="detail-card shimmer-card bill-shimmer">
          <div className="shimmer-accent-bar green" />
          <div className="shimmer-card-header">
            <div className="shimmer-line header-title" />
          </div>
          <div className="shimmer-bill-rows">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="shimmer-bill-row">
                <div className="shimmer-line bill-label" />
                <div className="shimmer-line bill-val" />
              </div>
            ))}
            <div className="shimmer-divider" />
            <div className="shimmer-bill-row total-row">
              <div className="shimmer-line total-label" />
              <div className="shimmer-line total-val" />
            </div>
          </div>
        </div>

        {/* Invoice Button Shimmer */}
        <div className="shimmer-button-full" />
      </div>
    </div>
  </div>
);

const OrderDetails = ({ orderId, onBack }) => {
  const { translations = {}, isRtl } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInvoicePrinting, setIsInvoicePrinting] = useState(false);

  // Modals state
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditReview, setIsEditReview] = useState(false);

  // Settings from localStorage (parity with SettingsPage)
  const dateFormat = localStorage.getItem("DateFormat") || "DD/MM/YYYY";
  const timeFormat = localStorage.getItem("TimeFormat") || "hh:mm A";
  const timeZone = localStorage.getItem("TimeZone") || "Asia/Kolkata";

  const fetchOrderReview = useCallback(
    async (currentOrderId) => {
      try {
        const response = await fetch(
          `${adminPanelBackendPath}/Website/Order/GetOrderReview/${currentOrderId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "x-user": "customer",
            },
          }
        );
        const data = await response.json();
        if (response.ok && data) {
          setOrder((prev) => (prev ? { ...prev, review: data } : prev));
        }
      } catch (err) {
        console.error("Error fetching order review:", err);
      }
    },
    []
  );

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);

    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Order/GetOrderByOrderNo/${orderId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
          },
        }
      );

      const data = await response.json();
      if (response.ok && data) {
        const hasItems = Array.isArray(data.items) && data.items.length > 0;
        const hasNonCancelledItems =
          hasItems && data.items.some((it) => !isItemCancelled(it));

        let calculatedSubtotal = 0;
        if (hasItems) {
          data.items.forEach((item) => {
            if (isItemCancelled(item)) return;
            const itemQty = item.qty || item.quantity || 1;
            calculatedSubtotal += (parseFloat(item.price) || 0) * itemQty;
            if (item.addons && item.addons.length > 0) {
              item.addons.forEach((addon) => {
                calculatedSubtotal +=
                  (parseFloat(addon.addonprice || addon.price) || 0) * itemQty;
              });
            }
          });
        }

        const serverSubtotal =
          data.subtotalprice !== undefined &&
          data.subtotalprice !== null &&
          !isNaN(parseFloat(data.subtotalprice))
            ? parseFloat(data.subtotalprice)
            : null;

        let effectiveSubtotal;
        if (!hasNonCancelledItems && hasItems) {
          effectiveSubtotal = 0;
        } else if (
          serverSubtotal !== null &&
          (serverSubtotal > 0 || !hasItems)
        ) {
          effectiveSubtotal = serverSubtotal;
        } else {
          effectiveSubtotal =
            calculatedSubtotal > 0
              ? calculatedSubtotal
              : serverSubtotal !== null
              ? serverSubtotal
              : 0;
        }

        const formattedProducts = (data.items || []).map((item) => {
          const hasAddons = Array.isArray(item.addons) && item.addons.length > 0;
          const addonsForProduct = hasAddons ? item.addons : [];
          const itemQty = item.qty || item.quantity || 1;
          const cancelled = isItemCancelled(item);
          const baseAmount = (parseFloat(item.price) || 0) * itemQty;
          const addonsAmount = addonsForProduct.reduce((sum, addon) => {
            const addonPrice = parseFloat(addon.addonprice || addon.price) || 0;
            return sum + addonPrice * itemQty;
          }, 0);

          const cancelReason =
            item.cancelreason ||
            item.reason ||
            (cancelled ? data.cancelreason || "" : "") ||
            "";
          const cancelledBy =
            item.cancelledby ||
            (cancelled ? data.cancelledby || "" : "") ||
            "";
          const cancelledAt =
            item.cancelledat ||
            item.cancelledtime ||
            item.cancelledTime ||
            item.cancelledAt ||
            (cancelled
              ? data.cancelledat ||
                data.cancelledtime ||
                data.cancelledTime ||
                data.cancelledAt
              : null);

          return {
            productname: item.itemname || item.name,
            quantity: itemQty,
            price: item.price,
            amount:
              item.amount !== undefined ? item.amount : baseAmount + addonsAmount,
            itemtype: item.itemtype || "Veg",
            addons: addonsForProduct.map((addon) => ({
              addonname: addon.addonname || addon.name,
              addonprice: addon.addonprice || addon.price || 0,
              amount:
                (parseFloat(addon.addonprice || addon.price) || 0) * itemQty,
            })),
            specialInstructions: item.specialInstructions || "",
            itemstatus: item.itemStatus,
            cancelreason: cancelReason,
            cancelledby: cancelledBy,
            cancelledat: cancelledAt,
            appliedTaxes: cancelled ? [] : item.appliedTaxes || item.taxes || [],
          };
        });

        const rawAdditionalCharges = (data.additionalCharges || []).map((c) => {
          const chg = c.toObject ? c.toObject() : { ...c };
          if (chg.chargetype === "percentage" && chg.chargevalue) {
            chg.amount = parseFloat(
              (
                (effectiveSubtotal * parseFloat(chg.chargevalue)) /
                100
              ).toFixed(data.decimal || 2)
            );
          }
          return chg;
        });

        const beforeTaxAmt = rawAdditionalCharges
          .filter((c) => c.applicationtiming === "before_tax")
          .reduce((s, c) => s + (parseFloat(c.amount) || 0), 0);
        const afterTaxAmt = (data.specialDayCharges || []).reduce(
          (s, c) => s + (parseFloat(c.amount) || 0),
          0
        );
        const roundAmt = Number(
          data.roundoff?.roundedAmount ?? data.roundoffAmount ?? 0
        );

        const taxBaseForInit = effectiveSubtotal + beforeTaxAmt;
        const allTaxesList =
          Array.isArray(data.taxes) && data.taxes.length > 0
            ? data.taxes
            : [
                ...(data.branchTaxes || []),
                ...(data.orderTypeTaxes || []),
                ...(data.itemTaxes || []),
              ];
        const validTaxesMap = new Map();
        allTaxesList.forEach((t) => {
          if (
            !t ||
            !t.taxname ||
            String(t.taxcomputation ?? "exclusive").toLowerCase() ===
              "inclusive"
          )
            return;
          const key = t.taxid ?? t.taxname;
          if (!validTaxesMap.has(key)) {
            validTaxesMap.set(key, t);
          }
        });

        let computedTotalTax = 0;
        const formattedTaxes = Array.from(validTaxesMap.values()).map((t) => {
          const taxObj = { ...t };
          const r = Number(taxObj.price ?? taxObj.rate ?? 0);
          const isP =
            String(taxObj.taxtype ?? "percentage").toLowerCase() ===
            "percentage";
          let amt = 0;
          if (isP) {
            amt = (taxBaseForInit * r) / 100;
          } else {
            const tKey =
              taxObj.taxid != null
                ? String(taxObj.taxid)
                : String(taxObj.taxname);
            const isBranchTax =
              taxObj.taxLevel === "branch" ||
              (data.branchTaxes || []).some(
                (x) =>
                  (x.taxid != null ? String(x.taxid) : String(x.taxname)) ===
                  tKey
              );
            const isApplyAll =
              String(data.taxApplicationMode || "apply_all").toLowerCase() ===
              "apply_all";
            let units = 0;
            (data.items || []).forEach((it) => {
              if (isItemCancelled(it)) return;
              const itTaxes = it.appliedTaxes?.length
                ? it.appliedTaxes
                : it.taxes || [];
              const hasDirect = itTaxes.some(
                (x) =>
                  (x.taxid != null ? String(x.taxid) : String(x.taxname)) ===
                  tKey
              );
              if (hasDirect || (isBranchTax && isApplyAll)) {
                units += Number(it.qty ?? it.quantity) || 1;
              }
            });
            if (units > 0) {
              amt = r * units;
            } else if (
              taxObj.calculatedAmount != null &&
              Number(taxObj.calculatedAmount) > 0 &&
              hasNonCancelledItems
            ) {
              amt = Number(taxObj.calculatedAmount);
            } else {
              amt = 0;
            }
          }
          taxObj.calculatedAmount = amt;
          computedTotalTax += amt;
          return taxObj;
        });

        const serverTax =
          data.totaltax !== undefined &&
          data.totaltax !== null &&
          !isNaN(parseFloat(data.totaltax))
            ? parseFloat(data.totaltax)
            : null;

        let finalTax;
        if (!hasNonCancelledItems && hasItems) {
          finalTax = 0;
        } else if (
          serverTax !== null &&
          (serverSubtotal === null ||
            Math.abs(serverSubtotal - effectiveSubtotal) < 0.01)
        ) {
          finalTax = serverTax;
        } else {
          finalTax = computedTotalTax;
        }

        const serverTotalPrice =
          data.totalprice !== undefined &&
          data.totalprice !== null &&
          !isNaN(parseFloat(data.totalprice))
            ? parseFloat(data.totalprice)
            : null;

        const computedGrandTotal =
          effectiveSubtotal +
          beforeTaxAmt +
          finalTax +
          afterTaxAmt +
          roundAmt;

        let finalTotalPrice;
        if (!hasNonCancelledItems && hasItems) {
          finalTotalPrice = serverTotalPrice !== null ? serverTotalPrice : 0;
        } else if (
          serverTotalPrice !== null &&
          (serverSubtotal === null ||
            Math.abs(serverSubtotal - effectiveSubtotal) < 0.01)
        ) {
          finalTotalPrice = serverTotalPrice;
        } else {
          finalTotalPrice = computedGrandTotal;
        }

        const customerFirstName = data.customer?.firstName || "";
        const customerLastName = data.customer?.lastName || "";
        const customerName = `${customerFirstName} ${customerLastName}`.trim();
        const customerPhone = data.customer?.phone || "";
        const customerEmail = data.customer?.email || "";

        let tableno = data.tableno;
        let areaname = data.areaname;
        if (!tableno || !areaname) {
          const areaDetails = data.areatabledetails;
          if (Array.isArray(areaDetails) && areaDetails.length > 0) {
            const firstArea = areaDetails[0];
            const tables = firstArea?.tables || [];
            if (tables.length > 0) {
              tableno = tableno || tables[0].tableno;
              areaname = areaname || firstArea.areaname;
            }
          }
        }

        const formattedOrder = {
          ...data,
          tableno: tableno || null,
          areaname: areaname || null,
          products: formattedProducts,
          additionalCharges: rawAdditionalCharges,
          subtotalprice: effectiveSubtotal,
          taxes: formattedTaxes,
          totaltax: finalTax,
          totalprice: finalTotalPrice,
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          customerName: customerName || null,
        };

        setOrder(formattedOrder);
        await fetchOrderReview(data._id);
      } else {
        showSnackbar(
          translations.orderdetilsnotfound || "Order details not found",
          "error"
        );
        setOrder(null);
      }
    } catch (err) {
      console.error("Error fetching order detail:", err);
      showSnackbar(
        translations.orderdetilsnotfound || "Error fetching order detail",
        "error"
      );
      setOrder(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId, fetchOrderReview, showSnackbar, translations]);

  useEffect(() => {
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  const handlePrintInvoice = () => {
    if (!order) {
      showSnackbar(
        translations.cannotdownloadinvoice || "Cannot download invoice",
        "error"
      );
      return;
    }
    setIsInvoicePrinting(true);
    try {
      printOrderInvoice(order, dateFormat, timeFormat, timeZone, translations);
      showSnackbar(
        translations.invoicepdfgenerated || "Invoice ready for print/download",
        "success"
      );
    } catch (err) {
      console.error("Error generating invoice:", err);
      showSnackbar(
        translations.failedtogenerateinvoice || "Failed to generate invoice",
        "error"
      );
    } finally {
      setIsInvoicePrinting(false);
    }
  };

  const hasTableDetails = useMemo(() => {
    const areas = order?.areatabledetails;
    if (!Array.isArray(areas) || areas.length === 0) return false;
    return areas.some(
      (area) => Array.isArray(area?.tables) && area.tables.length > 0
    );
  }, [order]);

  const locationDetails = useMemo(() => normalizeLocationDetails(order), [order]);

  const showLocationDetails = useMemo(
    () => Boolean(locationDetails) && isDeliveryOrderType(order?.ordertype),
    [locationDetails, order?.ordertype]
  );

  const showReviewAndInvoiceActions =
    (order?.orderstatus === "Completed" || order?.orderstatus === "Delivered") &&
    order?.paymentstatus === "Paid";

  const beforeTaxCharges = useMemo(() => {
    return (order?.additionalCharges || [])
      .concat(order?.specialDayCharges || [])
      .filter((c) => c.applicationtiming === "before_tax");
  }, [order]);

  const afterTaxCharges = useMemo(() => {
    return (order?.additionalCharges || [])
      .concat(order?.specialDayCharges || [])
      .filter((c) => c.applicationtiming === "after_tax");
  }, [order]);

  const roundoffAmount = Number(
    order?.roundoff?.roundedAmount ?? order?.roundoffAmount ?? 0
  );
  const showRoundoff = order?.roundoff?.status || roundoffAmount !== 0;

  if (loading && !refreshing) {
    return <OrderDetailsShimmer />;
  }

  if (!order) {
    return (
      <div className="order-details-empty-state">
        <CancelOutlinedIcon className="empty-icon" />
        <h3>{translations.orderdetilsnotfound || "Order details not found"}</h3>
        <p>
          We couldn't retrieve the details for this order. It might have been
          removed or an error occurred.
        </p>
        <div className="empty-actions">
          <button type="button" className="secondary-btn" onClick={onBack}>
            <ArrowBackIcon fontSize="small" />
            <span>{translations.backtoorders || "Back to Orders"}</span>
          </button>
          <button
            type="button"
            className="primary-btn"
            onClick={fetchOrderDetail}
          >
            <RefreshIcon fontSize="small" />
            <span>{translations.taptoretry || "Retry"}</span>
          </button>
        </div>
      </div>
    );
  }

  const statusColor = getOrderStatusColor(order.orderstatus);
  const paymentColor = getPaymentStatusColor(order.paymentstatus);

  return (
    <div className={`order-details-container ${isRtl ? "is-rtl" : ""}`}>
      {/* Top Header Bar */}
      <div className="order-details-nav-header">
        <div className="header-order-title">
          <h2>
            {translations.orderno || "Order"} #{order.orderno}
          </h2>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="history-btn"
            onClick={() => setIsHistoryModalOpen(true)}
            title={translations.orderstatushistory || "Status History"}
          >
            <HistoryIcon fontSize="small" />
            <span>{translations.orderstatushistory || "History"}</span>
          </button>
        </div>
      </div>

      <div className="order-details-content-grid">
        {/* Left Column: Status, Items & Tables */}
        <div className="details-main-column">
          {/* Top Status & Meta Card */}
          <div className="detail-card overview-card">
            <div
              className="card-top-accent"
              style={{
                background: `linear-gradient(90deg, ${statusColor}, ${paymentColor})`,
              }}
            />
            <div className="overview-badges-row">
              <span
                className="status-badge"
                style={{
                  backgroundColor: `${statusColor}15`,
                  color: statusColor,
                  borderColor: `${statusColor}40`,
                }}
              >
                <CheckCircleIcon fontSize="inherit" />
                <span>{translations[order.orderstatus] || order.orderstatus}</span>
              </span>

              <span
                className="payment-badge"
                style={{
                  backgroundColor: `${paymentColor}15`,
                  color: paymentColor,
                  borderColor: `${paymentColor}40`,
                }}
              >
                <PaymentsOutlinedIcon fontSize="inherit" />
                <span>{translations[order.paymentstatus] || order.paymentstatus}</span>
              </span>
            </div>

            <div className="overview-info-grid">
              <div className="info-row">
                <div className="info-icon-wrap primary">
                  <StorefrontIcon fontSize="small" />
                </div>
                <div className="info-text">
                  <span>{order.businessname}</span>
                </div>
              </div>

              <div className="info-row">
                <div className="info-icon-wrap secondary">
                  <LocationOnOutlinedIcon fontSize="small" />
                </div>
                <div className="info-text">
                  <span>{order.branchname}</span>
                </div>
              </div>

              {order.ordertype && (
                <div className="info-row">
                  <div
                    className="info-icon-wrap"
                    style={{
                      backgroundColor: `${getOrderTypeBackgroundColor(order.ordertype)}18`,
                      color: getOrderTypeBackgroundColor(order.ordertype),
                    }}
                  >
                    {getOrderTypeComponentIcon(order.ordertype)}
                  </div>
                  <div className="info-text">
                    <span>{translations[order.ordertype] || order.ordertype}</span>
                  </div>
                </div>
              )}

              <div className="info-row">
                <div className="info-icon-wrap muted">
                  <CalendarMonthOutlinedIcon fontSize="small" />
                </div>
                <div className="info-text">
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
          </div>

          {/* Table Details Card (Dine-in) */}
          {hasTableDetails && (
            <div className="detail-card table-details-card">
              <div className="card-top-accent teal" />
              <div className="card-header">
                <TableRestaurantIcon className="card-header-icon" />
                <h3>{translations.tabledetails || "Table Details"}</h3>
              </div>
              <div className="table-details-list">
                {order.areatabledetails
                  .filter((a) => Array.isArray(a?.tables) && a.tables.length > 0)
                  .map((area, idx) => {
                    const tableNos = area.tables
                      .map((t) => t.tableno)
                      .join(", ");
                    return (
                      <div key={idx} className="table-row">
                        <span className="area-name">{area.areaname}</span>
                        <span className="table-numbers">
                          {translations.tableno || "Table"} {tableNos}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Delivery Location Details Card */}
          {showLocationDetails && (
            <div className="detail-card location-details-card">
              <div className="card-top-accent green" />
              <div className="card-header">
                <PlaceOutlinedIcon className="card-header-icon" />
                <h3>{translations.locationdetails || "Delivery Location"}</h3>
              </div>
              <div className="location-details-content">
                <div className="address-type-pill">
                  {locationDetails.addresstype === "work" ? (
                    <WorkOutlineOutlinedIcon fontSize="inherit" />
                  ) : locationDetails.addresstype === "other" ? (
                    <PlaceOutlinedIcon fontSize="inherit" />
                  ) : (
                    <HomeOutlinedIcon fontSize="inherit" />
                  )}
                  <span>
                    {formatLocationAddressType(
                      locationDetails.addresstype,
                      translations
                    )}
                  </span>
                </div>
                <p className="address-full-line">
                  {formatLocationDetailsLine(locationDetails)}
                </p>
              </div>
            </div>
          )}

          {/* Item Details Card */}
          <div className="detail-card items-details-card">
            <div className="card-top-accent primary" />
            <div className="card-header">
              <ShoppingBasketOutlinedIcon className="card-header-icon" />
              <h3>{translations.itemdetails || "Item Details"}</h3>
              <span className="item-count-badge">
                {order.products?.length || 0}{" "}
                {translations.items || "Items"}
              </span>
            </div>

            <div className="items-list">
              {(order.products || []).map((product, pIndex) => {
                const cancelled = String(
                  product.itemstatus || ""
                ).toLowerCase() === "cancelled";
                const isVeg =
                  String(product.itemtype || "veg").toLowerCase() === "veg";

                return (
                  <div
                    key={pIndex}
                    className={`order-product-card ${
                      cancelled ? "is-cancelled" : ""
                    }`}
                  >
                    <div className="product-card-main">
                      <div className="diet-dot-wrap">
                        <div
                          className={`diet-box ${isVeg ? "veg" : "non-veg"}`}
                        >
                          <div
                            className={`diet-dot ${isVeg ? "veg" : "non-veg"}`}
                          />
                        </div>
                      </div>

                      <div className="product-title-group">
                        <div className="name-and-badge">
                          <span
                            className={`product-name ${
                              cancelled ? "strikethrough" : ""
                            }`}
                          >
                            {product.productname}
                          </span>
                          {cancelled && (
                            <span className="cancelled-pill">
                              {translations.Cancelled || "Cancelled"}
                            </span>
                          )}
                        </div>
                        <span className="unit-price">
                          {formatOrderPrice(product.price, order)}
                        </span>
                      </div>

                      <div className="product-amount-col">
                        <div className="qty-tag">
                          <span>
                            {translations.qty || "Qty"}: {product.quantity}
                          </span>
                        </div>
                        <span
                          className={`product-total-price ${
                            cancelled ? "strikethrough" : ""
                          }`}
                        >
                          {formatOrderPrice(product.amount, order)}
                        </span>
                      </div>
                    </div>

                    {/* Addons List */}
                    {product.addons && product.addons.length > 0 && (
                      <div className="product-addons-box">
                        <div className="addons-title">
                          <AddCircleOutlineIcon fontSize="inherit" />
                          <span>{translations.addons || "Add-ons"}</span>
                        </div>
                        {product.addons.map((addon, aIdx) => (
                          <div key={aIdx} className="addon-line">
                            <span className="addon-name">
                              • {addon.addonname}
                            </span>
                            <span className="addon-calc">
                              ({formatOrderPrice(addon.addonprice, order)} ×{" "}
                              {product.quantity})
                            </span>
                            <span className="addon-total">
                              {formatOrderPrice(addon.amount, order)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Special Instructions */}
                    {product.specialInstructions && (
                      <div className="product-notes-box">
                        <SpeakerNotesOutlinedIcon fontSize="inherit" />
                        <div className="notes-text">
                          <label>
                            {translations.specialinstructions ||
                              "Special Instructions"}
                            :
                          </label>
                          <span>{product.specialInstructions}</span>
                        </div>
                      </div>
                    )}

                    {/* Item Cancellation Details */}
                    {cancelled && (
                      <div className="item-cancellation-box">
                        <div className="cancellation-header">
                          <CancelOutlinedIcon fontSize="small" />
                          <span>
                            {translations.cancellationdetails ||
                              "Cancellation Details"}
                          </span>
                        </div>
                        <div className="cancellation-meta">
                          {product.cancelledby && (
                            <span className="meta-pill">
                              <strong>
                                {translations.cancelledby || "By"}:
                              </strong>{" "}
                              {product.cancelledby}
                            </span>
                          )}
                          {product.cancelledat && (
                            <span className="meta-pill">
                              <strong>
                                {translations.cancelledtime || "Time"}:
                              </strong>{" "}
                              {formatOrderDateTime(
                                product.cancelledat,
                                dateFormat,
                                timeFormat,
                                timeZone
                              )}
                            </span>
                          )}
                        </div>
                        <div className="cancellation-reason">
                          <span className="reason-label">
                            {translations.cancellationreason || "Reason"}:
                          </span>{" "}
                          <span className="reason-text">
                            {product.cancelreason ||
                              translations.notspecified ||
                              "Not specified"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Bill Details, Invoice, Reviews */}
        <div className="details-side-column">
          {/* Bill Summary Card */}
          <div className="detail-card bill-summary-card">
            <div className="card-top-accent green" />
            <div className="card-header">
              <AccountBalanceWalletOutlinedIcon className="card-header-icon" />
              <h3>{translations.billdetails || "Bill Details"}</h3>
            </div>

            <div className="bill-rows-container">
              {/* Subtotal */}
              <div className="bill-row">
                <span className="label">
                  {translations.subtotal || "Subtotal"}
                </span>
                <span className="value">
                  {formatOrderPrice(order.subtotalprice, order)}
                </span>
              </div>

              {/* Before-Tax Additional Charges */}
              {beforeTaxCharges.map((chg, idx) => {
                const rawVal = chg.chargevalue ?? chg.val ?? chg.value;
                const valLabel =
                  rawVal != null && rawVal !== ""
                    ? chg.chargetype === "percentage"
                      ? ` (${rawVal}%)`
                      : chg.chargetype === "fixed"
                      ? ` (${formatOrderPrice(rawVal, order)})`
                      : ` (${rawVal})`
                    : "";
                return (
                  <div key={`btc-${idx}`} className="bill-row charge">
                    <span className="label">
                      {chg.name || chg.chargename || chg.eventname}
                      {valLabel}
                    </span>
                    <span className="value">
                      {formatOrderPrice(chg.amount, order)}
                    </span>
                  </div>
                );
              })}

              {/* Itemized Taxes */}
              {Array.isArray(order.taxes) &&
                order.taxes.map((tax, idx) => {
                  const rateLabel =
                    tax.taxtype === "percentage"
                      ? ` (${tax.price ?? tax.rate}%)`
                      : tax.taxtype === "fixed"
                      ? ` (${formatOrderPrice(tax.price ?? tax.rate, order)})`
                      : "";
                  return (
                    <div key={`tax-${idx}`} className="bill-row tax">
                      <span className="label">
                        {tax.taxname}
                        {rateLabel}
                      </span>
                      <span className="value">
                        {formatOrderPrice(
                          tax.calculatedAmount ?? tax.amount ?? 0,
                          order
                        )}
                      </span>
                    </div>
                  );
                })}

              {/* Total Tax (if more than 1 tax) */}
              {Array.isArray(order.taxes) && order.taxes.length > 1 && (
                <div className="bill-row total-tax-row">
                  <span className="label">
                    {translations.totaltax || "Total Tax"}
                  </span>
                  <span className="value">
                    {formatOrderPrice(order.totaltax, order)}
                  </span>
                </div>
              )}

              {/* After-Tax Additional Charges */}
              {afterTaxCharges.map((chg, idx) => {
                const rawVal = chg.chargevalue ?? chg.val ?? chg.value;
                const valLabel =
                  rawVal != null && rawVal !== ""
                    ? chg.chargetype === "percentage"
                      ? ` (${rawVal}%)`
                      : chg.chargetype === "fixed"
                      ? ` (${formatOrderPrice(rawVal, order)})`
                      : ` (${rawVal})`
                    : "";
                return (
                  <div key={`atc-${idx}`} className="bill-row charge">
                    <span className="label">
                      {chg.name || chg.chargename || chg.eventname}
                      {valLabel}
                    </span>
                    <span className="value">
                      {formatOrderPrice(chg.amount, order)}
                    </span>
                  </div>
                );
              })}

              {/* Round Off */}
              {showRoundoff && (
                <div className="bill-row roundoff">
                  <span className="label">
                    {translations.roundoff || "Round Off"}
                  </span>
                  <span className="value">
                    {roundoffAmount > 0
                      ? `+${formatOrderPrice(roundoffAmount, order)}`
                      : roundoffAmount < 0
                      ? `-${formatOrderPrice(Math.abs(roundoffAmount), order)}`
                      : formatOrderPrice(0, order)}
                  </span>
                </div>
              )}

              {/* Grand Total */}
              <div className="bill-grand-total">
                <div className="grand-label">
                  <AccountBalanceWalletOutlinedIcon fontSize="small" />
                  <span>{translations.grandtotal || "Grand Total"}</span>
                </div>
                <span className="grand-value">
                  {formatOrderPrice(order.totalprice, order)}
                </span>
              </div>
            </div>

            {/* Invoice Button */}
            <div className="invoice-action-wrap">
              <button
                type="button"
                className="invoice-download-btn"
                onClick={handlePrintInvoice}
                disabled={isInvoicePrinting}
              >
                {isInvoicePrinting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <DownloadOutlinedIcon fontSize="small" />
                )}
                <span>
                  {translations.generatepdfinvoice || "Download / Print Invoice"}
                </span>
              </button>
            </div>
          </div>

          {/* Dining Reviews Section */}
          {showReviewAndInvoiceActions && (
            <div className="detail-card reviews-card">
              <div className="card-top-accent gold" />
              <div className="card-header">
                <RateReviewOutlinedIcon className="card-header-icon gold" />
                <h3>{translations.reviews || "Dining Review"}</h3>
              </div>

              {!order.review || !order.review._id ? (
                <div
                  className="write-review-prompt"
                  onClick={() => {
                    setIsEditReview(false);
                    setIsReviewModalOpen(true);
                  }}
                >
                  <div className="prompt-left">
                    <span className="prompt-title">
                      {translations.writeareview || "Write a Review"}
                    </span>
                    <p className="prompt-sub">
                      Share your dining experience, dish flavor, and service
                      ratings.
                    </p>
                    <div className="stars-placeholder">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <StarBorderIcon key={s} fontSize="small" />
                      ))}
                    </div>
                  </div>
                  <ChevronRightIcon className="prompt-chevron" />
                </div>
              ) : (
                <div className="existing-review-box">
                  <div className="review-top-meta">
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((s) =>
                        s <= order.review.rating ? (
                          <StarIcon key={s} className="star-filled" />
                        ) : (
                          <StarBorderIcon key={s} className="star-empty" />
                        )
                      )}
                    </div>
                    <div className="review-actions">
                      <button
                        type="button"
                        className="icon-action-btn edit"
                        onClick={() => {
                          setIsEditReview(true);
                          setIsReviewModalOpen(true);
                        }}
                        title={translations.editreview || "Edit Review"}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </button>
                    </div>
                  </div>

                  <div className="review-quote-bubble">
                    <p>"{order.review.review}"</p>
                  </div>

                  <div className="review-footer-date">
                    <AccessTimeIcon fontSize="inherit" />
                    <span>
                      {formatOrderDateTime(
                        order.review.updatedAt,
                        dateFormat,
                        timeFormat,
                        timeZone
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <OrderStatusHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        order={order}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        timeZone={timeZone}
        translations={translations}
      />

      <OrderReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        order={order}
        isEdit={isEditReview}
        existingReview={order.review}
        onReviewSubmitted={(savedRev) => {
          setOrder((prev) => (prev ? { ...prev, review: savedRev } : prev));
        }}
        onReviewDeleted={() => {
          setOrder((prev) => (prev ? { ...prev, review: null } : prev));
        }}
        showSnackbar={showSnackbar}
        translations={translations}
      />
    </div>
  );
};

export default OrderDetails;