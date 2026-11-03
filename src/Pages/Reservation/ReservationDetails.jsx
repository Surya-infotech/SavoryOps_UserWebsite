import { useState, useEffect, useCallback } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import PublicIcon from "@mui/icons-material/Public";
import HistoryIcon from "@mui/icons-material/History";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";

import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import {
  getReservationStatusConfig,
  formatReservationDate,
  formatReservationTime,
  formatReservationDateTime,
  getStoredDateFormat,
  getStoredTimeFormat,
  getStoredTimeZone,
} from "./reservationHelpers.js";
import ReservationStatusHistoryModal from "./ReservationStatusHistoryModal.jsx";
import ReservationCancelModal from "./ReservationCancelModal.jsx";
import "../../Scss/Pages/Orders/orderdetails.scss";
import "../../Scss/Pages/Reservation/tablereservation.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;

const StatusIcon = ({ iconType, fontSize = "inherit" }) => {
  switch (iconType) {
    case "schedule":
      return <ScheduleIcon fontSize={fontSize} />;
    case "check":
      return <CheckCircleOutlinedIcon fontSize={fontSize} />;
    case "seat":
      return <EventSeatIcon fontSize={fontSize} />;
    case "cancel":
      return <CancelOutlinedIcon fontSize={fontSize} />;
    case "person_off":
      return <PersonOffOutlinedIcon fontSize={fontSize} />;
    default:
      return <InfoOutlinedIcon fontSize={fontSize} />;
  }
};

/**
 * Modern Skeleton Shimmer for Reservation Details
 * Mirrors Order Details Shimmer
 */
const ReservationDetailsShimmer = () => (
  <div className="order-details-container order-details-shimmer reservation-details-unified">
    {/* Nav Header Shimmer */}
    <div className="order-details-nav-header">
      <div
        className="shimmer-line order-title-shimmer"
        style={{ width: 220, height: 34, borderRadius: 8 }}
      />
      <div
        className="shimmer-pill order-btn-shimmer"
        style={{ width: 190, height: 38, borderRadius: 9999 }}
      />
    </div>

    {/* Content Shimmer */}
    <div className="reservation-details-main-content">
      {/* Overview Card Shimmer */}
      <div className="detail-card shimmer-card overview-shimmer">
        <div className="shimmer-accent-bar green" />
        <div className="shimmer-header-row">
          <div className="shimmer-badges-row">
            <div className="shimmer-pill status-pill-shimmer" />
            <div className="shimmer-pill payment-pill-shimmer" />
          </div>
          <div className="shimmer-line date-shimmer" />
        </div>
        <div className="shimmer-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="shimmer-info-row">
              <div className="shimmer-icon-box" />
              <div className="shimmer-text-col">
                <div className="shimmer-line text-val" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Booking Information Shimmer */}
      <div
        className="order-details-section shimmer-section"
        style={{ marginTop: "1.5rem" }}
      >
        <div className="section-header-outside shimmer-section-header">
          <div className="shimmer-line header-title" style={{ width: 160 }} />
        </div>
        <div className="detail-card shimmer-card" style={{ height: 120 }}>
          <div className="shimmer-accent-bar primary" />
        </div>
      </div>
    </div>
  </div>
);

const ReservationDetails = ({
  reservationId,
  initialReservation = null,
  dateFormat,
  timeFormat,
  timeZone,
  onBack,
  onReservationUpdated,
}) => {
  const { translations = {}, isRtl } = useLanguage();
  const { showSnackbar } = useSnackbar();

  const [reservation, setReservation] = useState(initialReservation);
  const [loading, setLoading] = useState(!initialReservation && Boolean(reservationId));
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const activeDateFormat = dateFormat || getStoredDateFormat();
  const activeTimeFormat = timeFormat || getStoredTimeFormat();
  const activeTimeZone = timeZone || reservation?.timezone || getStoredTimeZone();

  // Fetch full details
  const fetchDetails = useCallback(async () => {
    if (!reservationId) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/GetTableReservationDetails/${reservationId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setReservation(data);
      } else {
        showSnackbar(
          translations.reservationnotfound || "Reservation details not found.",
          "error"
        );
      }
    } catch (err) {
      console.error("Error fetching reservation details:", err);
      showSnackbar(
        translations.somethingWentWrong || "Failed to load reservation details.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [reservationId, showSnackbar, translations]);

  useEffect(() => {
    if (reservationId) {
      setIsCancelModalOpen(false);
      fetchDetails();
    }
  }, [reservationId, fetchDetails]);

  // Handle Cancel Reservation
  const handleCancelReservation = async (reason) => {
    if (!reason?.trim()) {
      showSnackbar(
        translations.pleaseentercancellationreason ||
        "Please enter a reason for cancellation.",
        "warning"
      );
      return;
    }

    setIsCancelling(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/CancelTableReservation/${reservationId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
          },
          body: JSON.stringify({
            cancellationreason: reason.trim(),
          }),
        }
      );

      const resData = await response.json();

      if (response.ok) {
        showSnackbar(
          translations.reservationcancelled ||
          "Reservation cancelled successfully.",
          "success"
        );
        setIsCancelModalOpen(false);
        await fetchDetails();
        if (onReservationUpdated) onReservationUpdated();
      } else {
        showSnackbar(
          resData?.message ||
          translations.somethingWentWrong ||
          "Failed to cancel reservation.",
          "error"
        );
      }
    } catch (err) {
      console.error("Error cancelling reservation:", err);
      showSnackbar(
        translations.somethingWentWrong || "Error connecting to server.",
        "error"
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (loading && !reservation) {
    return <ReservationDetailsShimmer />;
  }

  if (!reservation) {
    return (
      <div className={`order-details-container ${isRtl ? "is-rtl" : ""}`}>
        <div className="order-details-empty-state">
          <CancelOutlinedIcon className="empty-icon" />
          <h3>
            {translations.reservationnotfound || "Reservation details not found"}
          </h3>
          <p>
            {translations.reservationnotfounddesc ||
              "We couldn't retrieve the details for this reservation. It may have been removed or an error occurred."}
          </p>
          <div className="empty-actions">
            <button type="button" className="secondary-btn" onClick={onBack}>
              <ArrowBackIcon fontSize="small" />
              <span>
                {translations.backtoreservations || "Back to Reservations"}
              </span>
            </button>
            <button type="button" className="primary-btn" onClick={fetchDetails}>
              <RefreshIcon fontSize="small" />
              <span>{translations.taptoretry || "Retry"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getReservationStatusConfig(
    reservation?.status,
    translations
  );

  const statusNorm = String(reservation?.status || "")
    .toLowerCase()
    .replace(/[-\s_]/g, "");
  const isRejected = statusNorm === "rejected";
  const reasonText =
    reservation?.cancelreason ||
    reservation?.rejectionreason ||
    reservation?.rejectreason;

  const isCancellable =
    reservation?.status &&
    ["pending", "confirmed"].includes(statusNorm);

  const overviewDateTime = reservation.createdAt
    ? formatReservationDateTime(
      reservation.createdAt,
      activeDateFormat,
      activeTimeFormat,
      activeTimeZone
    )
    : `${formatReservationDate(
      reservation.reservationdate,
      activeDateFormat,
      activeTimeZone
    )} ${formatReservationTime(
      reservation.reservationtime,
      activeTimeFormat,
      activeTimeZone
    )}`;

  return (
    <div
      className={`order-details-container reservation-details-unified ${isRtl ? "is-rtl" : ""
        }`}
    >
      {/* Top Header Bar - Exact Match with Order Details */}
      <div className="order-details-nav-header">
        <div className="header-order-title">
          <h2>
            {translations.reservationNo || "Reservation No"} #{reservation.reservationid}
          </h2>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="history-btn"
            onClick={() => setIsHistoryModalOpen(true)}
            title={
              translations.reservationstatushistory ||
              "Reservation Status History"
            }
          >
            <HistoryIcon fontSize="small" />
            <span>
              {translations.reservationstatushistory ||
                "Reservation Status History"}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="reservation-details-main-content">
        {/* Top Status & Meta Overview Card - Exact Match with Order Overview Card */}
        <div className="detail-card overview-card">
          <div className="card-top-accent green" />
          <div className="overview-card-header">
            <div className="overview-badges-wrap">
              <span
                className="status-badge"
                style={{
                  backgroundColor: `${statusConfig.color}18`,
                  color: statusConfig.color,
                  borderColor: `${statusConfig.color}40`,
                }}
              >
                <StatusIcon iconType={statusConfig.iconType} />
                <span>{statusConfig.label}</span>
              </span>

              <span
                className="payment-badge"
                style={{
                  backgroundColor: "#02880218",
                  color: "#028802",
                  borderColor: "#02880240",
                }}
              >
                <EventSeatIcon fontSize="inherit" />
                <span>
                  {reservation.reservationtype === "quickseat"
                    ? translations.quickseat || "Quick Seat"
                    : translations.pickspot || "Pick Spot"}
                </span>
              </span>
            </div>

            <div className="overview-header-date">
              <CalendarMonthOutlinedIcon fontSize="small" />
              <span>{overviewDateTime}</span>
            </div>
          </div>

          <div className="overview-card-body">
            <div className="overview-info-grid">
              {/* Business Name */}
              <div className="info-row">
                <div className="info-icon-wrap primary">
                  <StorefrontIcon fontSize="small" />
                </div>
                <div className="info-text">
                  <span>{reservation.businessname || "SavoryOps"}</span>
                </div>
              </div>

              {/* Branch Name */}
              <div className="info-row">
                <div className="info-icon-wrap secondary">
                  <LocationOnOutlinedIcon fontSize="small" />
                </div>
                <div className="info-text">
                  <span>{reservation.branchname}</span>
                </div>
              </div>

              {/* Branch Phone / Type */}
              {reservation.branchphone ? (
                <div className="info-row">
                  <div
                    className="info-icon-wrap"
                    style={{
                      backgroundColor: "rgba(2, 136, 2, 0.12)",
                      color: "#028802",
                    }}
                  >
                    <PhoneOutlinedIcon fontSize="small" />
                  </div>
                  <div className="info-text">
                    <a
                      href={`tel:${reservation.branchphone}`}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <span>{reservation.branchphone}</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="info-row">
                  <div
                    className="info-icon-wrap"
                    style={{
                      backgroundColor: "rgba(2, 136, 2, 0.12)",
                      color: "#028802",
                    }}
                  >
                    <TableRestaurantIcon fontSize="small" />
                  </div>
                  <div className="info-text">
                    <span>
                      {reservation.reservationtype === "quickseat"
                        ? translations.quickseat || "Quick Seat"
                        : translations.pickspot || "Pick Spot"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Booking Information Section - Outside Header + Detail Card */}
        <div className="order-details-section">
          <div className="section-header-outside">
            <div className="section-header-left">
              <TableRestaurantIcon className="section-header-icon" />
              <h3>{translations.bookingdetails || "Booking Information"}</h3>
            </div>
          </div>
          <div className="detail-card booking-info-card">
            <div className="card-top-accent green" />
            <div
              className="booking-info-content"
              style={{ padding: "1.25rem" }}
            >
              <div
                className={`booking-info-grid ${reservation.reservationtype === "pickspot"
                  ? "five-items"
                  : "four-items"
                  }`}
              >
                {/* Date */}
                <div className="booking-tile">
                  <div className="tile-icon-wrap blue">
                    <CalendarMonthOutlinedIcon fontSize="small" />
                  </div>
                  <div className="tile-text">
                    <span>
                      {formatReservationDate(
                        reservation.reservationdate,
                        activeDateFormat,
                        activeTimeZone
                      )}
                    </span>
                  </div>
                </div>

                {/* Time */}
                <div className="booking-tile">
                  <div className="tile-icon-wrap amber">
                    <AccessTimeIcon fontSize="small" />
                  </div>
                  <div className="tile-text">
                    <span>
                      {formatReservationTime(
                        reservation.reservationtime,
                        activeTimeFormat,
                        activeTimeZone
                      )}
                    </span>
                  </div>
                </div>

                {/* Seating Details */}
                {reservation.reservationtype === "pickspot" ? (
                  <>
                    <div className="booking-tile">
                      <div className="tile-icon-wrap indigo">
                        <EventSeatIcon fontSize="small" />
                      </div>
                      <div className="tile-text">
                        <span>{reservation.areaname || "Main Area"}</span>
                      </div>
                    </div>

                    <div className="booking-tile">
                      <div className="tile-icon-wrap green">
                        <TableRestaurantIcon fontSize="small" />
                      </div>
                      <div className="tile-text">
                        <span className="table-highlight">
                          {reservation.tableno}
                        </span>
                        {reservation.capacity ? (
                          <span className="cap-badge">
                            {reservation.capacity} seats
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="booking-tile">
                    <div className="tile-icon-wrap green">
                      <GroupsOutlinedIcon fontSize="small" />
                    </div>
                    <div className="tile-text">
                      <span className="guest-highlight">
                        {reservation.guest || 1}{" "}
                        {reservation.guest === 1 ? "Guest" : "Guests"}
                      </span>
                    </div>
                  </div>
                )}

                {/* Timezone */}
                {reservation.timezone && (
                  <div className="booking-tile">
                    <div className="tile-icon-wrap teal">
                      <PublicIcon fontSize="small" />
                    </div>
                    <div className="tile-text">
                      <span className="text-muted">
                        {reservation.timezone}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Special Requests Section (if any) */}
        {reservation.specialnotes && (
          <div className="order-details-section">
            <div className="section-header-outside">
              <div className="section-header-left">
                <NotesOutlinedIcon className="section-header-icon" />
                <h3>{translations.specialnotes || "Special Requests"}</h3>
              </div>
            </div>
            <div className="detail-card">
              <div
                style={{
                  padding: "1.25rem",
                  color: "#334155",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                {reservation.specialnotes}
              </div>
            </div>
          </div>
        )}

        {/* Cancellation or Rejection Reason Section */}
        {reasonText && (
          <div className="order-details-section">
            <div className="section-header-outside">
              <div className="section-header-left">
                <CancelOutlinedIcon className="section-header-icon red" />
                <h3>
                  {isRejected
                    ? translations.rejectionreason || "Rejection Reason"
                    : translations.cancellationreason || "Cancellation Reason"}
                </h3>
              </div>
            </div>
            <div className="detail-card">
              <div
                style={{
                  padding: "1.25rem",
                  color: "#dc2626",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  backgroundColor: "#fff5f5",
                }}
              >
                {reasonText}
              </div>
            </div>
          </div>
        )}

        {/* Cancel Reservation Action Row (when Pending or Confirmed) */}
        {isCancellable && (
          <div className="cancel-reservation-action-row">
            <button
              type="button"
              className="cancel-reservation-btn"
              onClick={() => setIsCancelModalOpen(true)}
              title={translations.cancelreservation || "Cancel Reservation"}
            >
              <CancelOutlinedIcon className="cancel-btn-icon" />
              <span>
                {translations.cancelreservation || "Cancel Reservation"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Reservation Status History Modal */}
      <ReservationStatusHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        reservation={reservation}
        dateFormat={activeDateFormat}
        timeFormat={activeTimeFormat}
        timeZone={activeTimeZone}
        translations={translations}
      />

      {/* Reservation Cancel Confirmation Modal */}
      <ReservationCancelModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelReservation}
        reservationNo={reservation.reservationid}
        isCancelling={isCancelling}
        translations={translations}
      />
    </div>
  );
};

export default ReservationDetails;