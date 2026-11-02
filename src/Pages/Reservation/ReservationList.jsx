import { useState, useMemo } from "react";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import TableRestaurantOutlinedIcon from "@mui/icons-material/TableRestaurantOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import BoltIcon from "@mui/icons-material/Bolt";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import PersonOffOutlinedIcon from "@mui/icons-material/PersonOffOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import { useLanguage } from "../../Context/useLanguage.js";
import {
  getReservationStatusConfig,
  formatReservationDate,
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
  onSelectReservation,
  onOpenAddModal,
}) => {
  const { translations = {} } = useLanguage();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filterTabs = [
    { key: "all", label: translations.all || "All" },
    { key: "pending", label: translations.pending || "Pending" },
    { key: "confirmed", label: translations.confirmed || "Confirmed" },
    { key: "seated", label: translations.seated || "Seated" },
    { key: "cancelled", label: translations.cancelled || "Cancelled" },
  ];

  // Filtered Reservations
  const filteredReservations = useMemo(() => {
    return reservations.filter((item) => {
      // 1. Status Filter
      if (statusFilter !== "all") {
        const itemStatus = String(item.status || "").toLowerCase().replace(/\s/g, "");
        if (statusFilter === "cancelled") {
          if (itemStatus !== "cancelled" && itemStatus !== "rejected") {
            return false;
          }
        } else if (itemStatus !== statusFilter) {
          return false;
        }
      }

      // 2. Search Filter
      if (!search.trim()) return true;
      const q = search.toLowerCase().trim();
      const resNo = String(item.reservationid || "").toLowerCase();
      const bName = String(item.branchname || "").toLowerCase();
      const bizName = String(item.businessname || "").toLowerCase();
      const area = String(item.areaname || "").toLowerCase();
      const table = String(item.tableno || "").toLowerCase();
      const status = String(item.status || "").toLowerCase();

      return (
        resNo.includes(q) ||
        bName.includes(q) ||
        bizName.includes(q) ||
        area.includes(q) ||
        table.includes(q) ||
        status.includes(q)
      );
    });
  }, [reservations, statusFilter, search]);

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

      {/* Toolbar / Search & Filter Row */}
      {reservations.length > 0 && (
        <div className="reservations-toolbar">
          {/* Status Tabs */}
          <div className="filter-tabs-row">
            {filterTabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  className={`status-tab-btn ${isActive ? "active" : ""}`}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="reservation-search-box">
            <SearchIcon className="search-icon" />
            <input
              type="text"
              placeholder={
                translations.searchreservations ||
                "Search by #No, branch, or table..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

      {/* Main Content Area */}
      {loading ? (
        <div className="reservations-grid">
          {[1, 2, 3, 4, 5, 6].map((k) => (
            <ShimmerCard key={k} />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        /* Empty State (No Reservations at all - matching Manage Address) */
        <div className="address-empty-card reservations-empty-state">
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
      ) : filteredReservations.length === 0 ? (
        /* Filter / Search Empty State */
        <div className="reservations-empty-state search-empty">
          <div className="empty-icon-wrap search">
            <SearchOffIcon className="empty-icon" />
          </div>
          <h2 className="empty-title">
            {translations.noreservationfound || "No reservations found"}
          </h2>
          <p className="empty-subtitle">
            {translations.nosearchresultsfound ||
              "No reservations match your search or filter criteria. Try adjusting your filter."}
          </p>
          <button
            type="button"
            className="empty-add-btn secondary"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            <CloseIcon fontSize="small" />
            <span>{translations.clearfilter || "Clear Filters"}</span>
          </button>
        </div>
      ) : (
        /* Reservations Cards Grid */
        <div className="reservations-grid">
          {filteredReservations.map((res) => {
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
                        <span className="label">
                          {translations.date || "Date"}
                        </span>
                        <span className="value">
                          {formatReservationDate(res.reservationdate)}
                        </span>
                      </div>
                    </div>

                    <div className="schedule-item">
                      <div className="schedule-icon-wrap time">
                        <AccessTimeIcon fontSize="small" />
                      </div>
                      <div className="schedule-texts">
                        <span className="label">
                          {translations.time || "Time"}
                        </span>
                        <span className="value">{res.reservationtime}</span>
                      </div>
                    </div>
                  </div>

                  {/* Seating Details Footer Preview */}
                  <div className="seating-preview-row">
                    {res.reservationtype === "quickseat" ? (
                      <div className="seating-chip quick">
                        <BoltIcon fontSize="inherit" />
                        <span>
                          {translations.quickseat || "Quick Seat"} •{" "}
                          {res.guest || 1}{" "}
                          {res.guest === 1 ? "Guest" : "Guests"}
                        </span>
                      </div>
                    ) : (
                      <div className="seating-chip spot">
                        <EventSeatIcon fontSize="inherit" />
                        <span>
                          {res.areaname || "Main Area"} • {res.tableno}{" "}
                          {res.capacity ? `(${res.capacity} Seats)` : ""}
                        </span>
                      </div>
                    )}

                    <div
                      className="card-action-circle"
                      title={translations.viewdetails || "View Details"}
                    >
                      <ArrowForwardIcon className="arrow-icon" fontSize="small" />
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