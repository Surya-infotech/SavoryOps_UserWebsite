import TableRestaurantOutlinedIcon from "@mui/icons-material/TableRestaurantOutlined";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AddIcon from "@mui/icons-material/Add";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useLanguage } from "../../Context/useLanguage.js";
import {
  getReservationStatusConfig,
  formatReservationDate,
  formatReservationTime,
} from "./reservationHelpers.js";
import "../../Scss/Pages/Reservation/tablereservation.scss";

const StatusBadgeIcon = ({ iconType, fontSize = "inherit" }) => {
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

const ShimmerCard = () => (
  <div className="reservation-card-tile shimmer-tile">
    <div className="shimmer-line line-bar" />
    <div className="shimmer-body">
      <div className="shimmer-row">
        <div className="shimmer-circle" />
        <div className="shimmer-col">
          <div className="shimmer-line line-title" />
          <div className="shimmer-line line-sub" />
        </div>
      </div>
      <div className="shimmer-line line-pill" />
      <div className="shimmer-divider" />
      <div className="shimmer-line line-meta" />
      <div className="shimmer-line line-meta short" />
    </div>
  </div>
);

const ReservationList = ({
  reservations = [],
  loading = false,
  dateFormat,
  timeFormat,
  timeZone,
  onSelectReservation,
  onOpenAddModal,
}) => {
  const { translations = {} } = useLanguage();

  return (
    <div className="reservations-list-wrapper">
      {/* Page Header & Action Bar */}
      <div className="reservations-header-row">
        <button
          type="button"
          className="add-reservation-primary-btn"
          onClick={onOpenAddModal}
        >
          <AddIcon fontSize="small" />
          <span>{translations.addreservation || "Add Table Reservation"}</span>
        </button>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="reservations-grid">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <ShimmerCard key={k} />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        /* Empty State (No Reservations at all) */
        <div className="reservations-empty-state">
          <div className="empty-icon-wrap">
            <TableRestaurantOutlinedIcon className="empty-icon" />
          </div>
          <h2 className="empty-title">
            {translations.noTableReservations || "No Table Reservations Saved"}
          </h2>
          <p className="empty-subtitle">
            {translations.noTableReservationsMessage ||
              "Save your favorite tables and book in advance for a faster and smoother dining experience."}
          </p>
          <button
            type="button"
            className="empty-add-btn"
            onClick={onOpenAddModal}
          >
            <AddIcon fontSize="small" />
            <span>{translations.addreservation || "Add Table Reservation"}</span>
          </button>
        </div>
      ) : (
        /* Reservations Cards Grid */
        <div className="reservations-grid">
          {reservations.map((res) => {
            const statusConfig = getReservationStatusConfig(
              res.status,
              translations
            );
            return (
              <div
                key={res._id}
                className="reservation-card-tile"
                onClick={() => onSelectReservation(res)}
              >
                {/* Top Accent Gradient Bar */}
                <div className="card-accent-bar" />

                <div className="card-main-content">
                  {/* Card Header: Storefront + Branch info & Status */}
                  <div className="card-top-row">
                    <div className="branch-meta-group">
                      <div className="branch-avatar-circle">
                        <StorefrontIcon />
                      </div>
                      <div className="branch-titles">
                        <h4 className="branch-name" title={res.branchname}>
                          {res.branchname}
                        </h4>
                        <span className="business-name" title={res.businessname}>
                          {res.businessname}
                        </span>
                      </div>
                    </div>

                    <span
                      className="status-pill"
                      style={{
                        backgroundColor: statusConfig.bgColor,
                        color: statusConfig.color,
                        borderColor: statusConfig.borderColor,
                      }}
                    >
                      <StatusBadgeIcon iconType={statusConfig.iconType} />
                      <span>{statusConfig.label}</span>
                    </span>
                  </div>

                  {/* Reservation # Pill */}
                  <div className="reservation-no-pill">
                    <TableRestaurantIcon fontSize="inherit" />
                    <span>
                      {translations.reservationNo || "Reservation No."} #
                      {res.reservationid}
                    </span>
                  </div>

                  {/* Divider Line */}
                  <div className="card-divider" />

                  {/* Date & Time Row */}
                  <div className="reservation-schedule-row">
                    <div className="schedule-item">
                      <div className="schedule-icon-wrap date">
                        <CalendarMonthOutlinedIcon fontSize="small" />
                      </div>
                      <div className="schedule-texts">
                        <span className="value">
                          {formatReservationDate(res.reservationdate, dateFormat, timeZone)}
                        </span>
                      </div>
                    </div>

                    <div className="schedule-item">
                      <div className="schedule-icon-wrap time">
                        <AccessTimeIcon fontSize="small" />
                      </div>
                      <div className="schedule-texts">
                        <span className="value">
                          {formatReservationTime(res.reservationtime, timeFormat, timeZone)}
                        </span>
                      </div>
                    </div>
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

export default ReservationList;