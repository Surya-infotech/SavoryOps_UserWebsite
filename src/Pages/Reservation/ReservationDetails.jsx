import { useState, useEffect, useCallback } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import PublicIcon from "@mui/icons-material/Public";
import HistoryIcon from "@mui/icons-material/History";
import CircularProgress from "@mui/material/CircularProgress";
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

const ReservationDetailsShimmer = ({ onBack, translations = {} }) => (
  <div className="reservation-details-page-container shimmer-mode">
    <div className="reservation-details-nav-header">
      <button type="button" className="details-back-btn" onClick={onBack}>
        <ArrowBackIcon fontSize="small" />
        <span>{translations.backtoreservations || "Back to Reservations"}</span>
      </button>
      <div className="shimmer-line" style={{ width: 180, height: 28, borderRadius: 8 }} />
    </div>

    <div className="reservation-details-page-grid">
      <div className="details-main-column">
        <div className="shimmer-card" style={{ height: 70, borderRadius: 14 }} />
        <div className="shimmer-card" style={{ height: 130, borderRadius: 16 }} />
        <div className="shimmer-card" style={{ height: 210, borderRadius: 16 }} />
      </div>
      <div className="details-side-column">
        <div className="shimmer-card" style={{ height: 260, borderRadius: 16 }} />
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
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  const activeDateFormat = dateFormat || getStoredDateFormat();
  const activeTimeFormat = timeFormat || getStoredTimeFormat();
  const activeTimeZone = timeZone || reservation?.timezone || getStoredTimeZone();

  // Fetch full details if needed
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
      setIsCancelConfirmOpen(false);
      setCancellationReason("");
      fetchDetails();
    }
  }, [reservationId, fetchDetails]);

  // Handle Cancel Reservation
  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellationReason.trim()) {
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
            cancellationreason: cancellationReason.trim(),
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
        setIsCancelConfirmOpen(false);
        setCancellationReason("");
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
    return <ReservationDetailsShimmer onBack={onBack} translations={translations} />;
  }

  if (!reservation) {
    return (
      <div className="reservation-details-page-container">
        <div className="reservation-details-empty-state">
          <InfoOutlinedIcon className="empty-icon" />
          <h3>{translations.reservationnotfound || "Reservation details not found"}</h3>
          <p>
            {translations.reservationnotfounddesc ||
              "We couldn't retrieve the details for this reservation. It may have been removed or the link is invalid."}
          </p>
          <div className="empty-actions">
            <button type="button" className="details-back-btn" onClick={onBack}>
              <ArrowBackIcon fontSize="small" />
              <span>{translations.backtoreservations || "Back to Reservations"}</span>
            </button>
            <button type="button" className="retry-btn" onClick={fetchDetails}>
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
  const isCancellable =
    reservation?.status &&
    ["pending", "confirmed"].includes(
      reservation.status.toLowerCase().replace(/\s/g, "")
    );

  const hasStatusLogs =
    Array.isArray(reservation.statusLogs) && reservation.statusLogs.length > 0;

  return (
    <div className={`reservation-details-page-container ${isRtl ? "is-rtl" : ""}`}>
      {/* Top Header Bar */}
      <div className="reservation-details-nav-header">
        <button type="button" className="details-back-btn" onClick={onBack}>
          <ArrowBackIcon fontSize="small" />
          <span>{translations.backtoreservations || "Back to Reservations"}</span>
        </button>

        <div className="header-titles">
          <h2>{translations.reservationdetails || "Reservation Details"}</h2>
          {reservation?.reservationid && (
            <span className="reservation-id-pill">
              <TableRestaurantIcon fontSize="inherit" />
              <span>
                {translations.reservationNo || "Reservation No."} #{reservation.reservationid}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="reservation-details-page-grid">
        {/* Left Column: Status, Branch, Booking, Notes, Cancellation */}
        <div className="details-main-column">
          <div className="reservation-details-content">
            {/* Status Header Banner */}
            <div
              className="status-banner-card"
              style={{
                backgroundColor: statusConfig.bgColor,
                borderColor: statusConfig.borderColor,
              }}
            >
              <div
                className="status-pill-badge"
                style={{
                  backgroundColor: `${statusConfig.color}15`,
                  color: statusConfig.color,
                  borderColor: `${statusConfig.color}30`,
                }}
              >
                <StatusIcon iconType={statusConfig.iconType} />
                <span>{statusConfig.label}</span>
              </div>
              <div className="status-banner-meta">
                <span className="type-badge">
                  {reservation.reservationtype === "quickseat"
                    ? translations.quickseat || "Quick Seat"
                    : translations.pickspot || "Pick Spot"}
                </span>
              </div>
            </div>

            {/* Branch / Restaurant Card */}
            <div className="details-section-card">
              <div className="section-card-header">
                <StorefrontIcon className="section-icon" />
                <h4>{translations.restaurantinfo || "Branch Information"}</h4>
              </div>
              <div className="branch-meta-box">
                <div className="branch-main-info">
                  <h5 className="branch-title">{reservation.branchname}</h5>
                  <p className="business-subline">
                    {reservation.businessname}
                  </p>
                </div>

                {reservation.branchphone && (
                  <a
                    href={`tel:${reservation.branchphone}`}
                    className="branch-phone-link"
                  >
                    <PhoneOutlinedIcon fontSize="small" />
                    <span>{reservation.branchphone}</span>
                  </a>
                )}
              </div>
            </div>

            {/* Booking Information Card */}
            <div className="details-section-card">
              <div className="section-card-header">
                <TableRestaurantIcon className="section-icon" />
                <h4>{translations.bookingdetails || "Booking Information"}</h4>
              </div>
              <div className="info-grid-two">
                {/* Date */}
                <div className="info-cell">
                  <CalendarMonthOutlinedIcon className="cell-icon" />
                  <div className="cell-value">
                    {formatReservationDate(
                      reservation.reservationdate,
                      activeDateFormat,
                      activeTimeZone
                    )}
                  </div>
                </div>

                {/* Time */}
                <div className="info-cell">
                  <AccessTimeIcon className="cell-icon" />
                  <div className="cell-value">
                    {formatReservationTime(
                      reservation.reservationtime,
                      activeTimeFormat,
                      activeTimeZone
                    )}
                  </div>
                </div>

                {/* Seating Details */}
                {reservation.reservationtype === "pickspot" ? (
                  <>
                    <div className="info-cell">
                      <EventSeatIcon className="cell-icon" />
                      <div className="cell-value">
                        {reservation.areaname || "Main Area"}
                      </div>
                    </div>

                    <div className="info-cell">
                      <TableRestaurantIcon className="cell-icon highlight" />
                      <div className="cell-value highlight">
                        {reservation.tableno}
                        {reservation.capacity ? (
                          <span className="sub-cap">
                            ({reservation.capacity} seats)
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="info-cell full-span">
                    <GroupsOutlinedIcon className="cell-icon highlight" />
                    <div className="cell-value highlight">
                      {reservation.guest || 1}{" "}
                      {reservation.guest === 1 ? "Guest" : "Guests"}
                    </div>
                  </div>
                )}

                {/* Timezone */}
                {reservation.timezone && (
                  <div className="info-cell full-span">
                    <PublicIcon className="cell-icon" />
                    <div className="cell-value text-muted">
                      {reservation.timezone}
                    </div>
                  </div>
                )}
              </div>

              {/* Special Notes (if any) */}
              {reservation.specialnotes && (
                <div className="special-notes-box">
                  <div className="notes-label">
                    <NotesOutlinedIcon fontSize="small" />
                    <span>
                      {translations.specialnotes || "Special Requests"}
                    </span>
                  </div>
                  <p className="notes-text">{reservation.specialnotes}</p>
                </div>
              )}

              {/* Cancellation Reason (if cancelled) */}
              {reservation.cancelreason && (
                <div className="cancellation-reason-box">
                  <div className="cancel-label">
                    <CancelOutlinedIcon fontSize="small" />
                    <span>
                      {translations.cancellationreason ||
                        "Cancellation Reason"}
                    </span>
                  </div>
                  <p className="cancel-text">{reservation.cancelreason}</p>
                </div>
              )}
            </div>

            {/* Cancel Reservation Section (when Pending or Confirmed) */}
            {isCancellable && (
              <div className="cancel-action-wrapper">
                {!isCancelConfirmOpen ? (
                  <button
                    type="button"
                    className="cancel-trigger-btn"
                    onClick={() => setIsCancelConfirmOpen(true)}
                  >
                    <CancelOutlinedIcon fontSize="small" />
                    <span>
                      {translations.cancelreservation || "Cancel Reservation"}
                    </span>
                  </button>
                ) : (
                  <form
                    onSubmit={handleCancelSubmit}
                    className="cancel-form-box"
                  >
                    <h5>
                      {translations.cancelreservation || "Cancel Reservation"}
                    </h5>
                    <p className="cancel-prompt">
                      {translations.cancellationconfirmdesc ||
                        "Are you sure you want to cancel this booking? Please provide a brief reason."}
                    </p>
                    <textarea
                      className="cancel-textarea"
                      rows={3}
                      placeholder={
                        translations.entercancellationreason ||
                        "e.g. Schedule conflict, feeling unwell, change of plans..."
                      }
                      value={cancellationReason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      required
                      disabled={isCancelling}
                    />
                    <div className="cancel-form-actions">
                      <button
                        type="button"
                        className="cancel-dismiss-btn"
                        onClick={() => {
                          setIsCancelConfirmOpen(false);
                          setCancellationReason("");
                        }}
                        disabled={isCancelling}
                      >
                        {translations.keepbooking || "Keep Reservation"}
                      </button>
                      <button
                        type="submit"
                        className="cancel-submit-danger-btn"
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <>
                            <CircularProgress size={16} color="inherit" />
                            <span>
                              {translations.cancellingreservation ||
                                "Cancelling..."}
                            </span>
                          </>
                        ) : (
                          <span>
                            {translations.confirmcancellation ||
                              "Confirm Cancellation"}
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Status History Timeline */}
        <div className="details-side-column">
          <div className="reservation-details-content">
            <div className="details-section-card">
              <div className="section-card-header">
                <HistoryIcon className="section-icon" />
                <h4>
                  {translations.reservationstatushistory || "Status History"}
                </h4>
              </div>

              {hasStatusLogs ? (
                <div className="timeline-container">
                  {reservation.statusLogs.map((log, index) => {
                    const logConfig = getReservationStatusConfig(
                      log.newStatus,
                      translations
                    );
                    return (
                      <div key={index} className="timeline-item">
                        <div
                          className="timeline-marker"
                          style={{ backgroundColor: logConfig.dotColor }}
                        />
                        {index !== reservation.statusLogs.length - 1 && (
                          <div className="timeline-line" />
                        )}
                        <div className="timeline-content">
                          <span
                            className="timeline-status-chip"
                            style={{
                              backgroundColor: logConfig.bgColor,
                              color: logConfig.color,
                            }}
                          >
                            {logConfig.label}
                          </span>
                          <div className="timeline-meta">
                            {log.updatedAt && (
                              <span className="timeline-time">
                                {formatReservationDateTime(
                                  log.updatedAt,
                                  activeDateFormat,
                                  activeTimeFormat,
                                  activeTimeZone
                                )}
                              </span>
                            )}
                            {log.updatedByEmployeeName && (
                              <span className="timeline-author">
                                by {log.updatedByEmployeeName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-history-text" style={{ fontSize: "0.85rem", color: "#94a3b8", margin: 0 }}>
                  {translations.nostatushistory || "No status history recorded yet."}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationDetails;

