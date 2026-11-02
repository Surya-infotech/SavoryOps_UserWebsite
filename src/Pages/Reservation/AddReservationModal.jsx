import { useState, useEffect, useMemo, useCallback } from "react";
import CloseIcon from "@mui/icons-material/Close";
import StorefrontIcon from "@mui/icons-material/Storefront";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import BoltIcon from "@mui/icons-material/Bolt";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import PublicIcon from "@mui/icons-material/Public";
import CircularProgress from "@mui/material/CircularProgress";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import { getActiveBranch } from "../../utils/formatCurrency.js";
import { formatTime12h, getTodayDateInputString } from "./reservationHelpers.js";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const AddReservationModal = ({ isOpen, onClose, onSuccess }) => {
  const { translations = {} } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const { business } = useWebsiteStatus();

  // Form State
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [reservationType, setReservationType] = useState("pickspot"); // "pickspot" | "quickseat"
  const [selectedArea, setSelectedArea] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedDate, setSelectedDate] = useState(getTodayDateInputString);
  const [selectedTime, setSelectedTime] = useState("19:00");
  const [guestCount, setGuestCount] = useState(2);
  const [specialNotes, setSpecialNotes] = useState("");

  // Data State
  const [allBranches, setAllBranches] = useState([]);
  const [allTables, setAllTables] = useState([]);
  const [branchTimezone, setBranchTimezone] = useState("");
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Field validation errors
  const [errors, setErrors] = useState({});

  // Reset form when opening modal
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(getTodayDateInputString());
      setSelectedTime("19:00");
      setGuestCount(2);
      setSpecialNotes("");
      setErrors({});
      fetchBranches();
    }
  }, [isOpen]);

  // Fetch all reservation-enabled branches
  const fetchBranches = async () => {
    setLoadingBranches(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Main/GetTablereservationBranch`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const branchesArray = Array.isArray(data) ? data : [];
        setAllBranches(branchesArray);

        // Filter branches matching current website business if available
        const currentBizId = business?.businessid || business?._id;
        const bizBranches = currentBizId
          ? branchesArray.filter(
            (b) =>
              String(b.businessid) === String(currentBizId) ||
              (business?.businessname &&
                b.businessname?.toLowerCase() ===
                business.businessname.toLowerCase())
          )
          : branchesArray;

        const candidateBranches =
          bizBranches.length > 0 ? bizBranches : branchesArray;

        // Auto select current active branch from site or first branch
        const activeSiteBranch = getActiveBranch();
        const activeBranchId =
          activeSiteBranch?._id ||
          activeSiteBranch?.branchid ||
          localStorage.getItem("selectedBranchId");

        const matchedBranch =
          candidateBranches.find(
            (b) =>
              String(b.branchid) === String(activeBranchId) ||
              String(b._id) === String(activeBranchId)
          ) || candidateBranches[0];

        if (matchedBranch) {
          setSelectedBranch(matchedBranch);
        }
      }
    } catch (err) {
      console.error("Error fetching reservation branches:", err);
      showSnackbar(
        translations.somethingWentWrong || "Error loading branches",
        "error"
      );
    } finally {
      setLoadingBranches(false);
    }
  };

  // Filter available branches for display
  const availableBranches = useMemo(() => {
    if (allBranches.length === 0) return [];
    const currentBizId = business?.businessid || business?._id;
    if (currentBizId) {
      const matched = allBranches.filter(
        (b) =>
          String(b.businessid) === String(currentBizId) ||
          (business?.businessname &&
            b.businessname?.toLowerCase() ===
            business.businessname.toLowerCase())
      );
      if (matched.length > 0) return matched;
    }
    return allBranches;
  }, [allBranches, business]);

  // When selected branch changes, load branch hours/timezone and tables
  useEffect(() => {
    if (selectedBranch?.branchid && selectedBranch?.ownerid) {
      fetchBranchHours(selectedBranch.branchid, selectedBranch.ownerid);
      if (reservationType === "pickspot") {
        fetchTables(selectedBranch.branchid, selectedBranch.ownerid);
      }
    } else {
      setBranchTimezone("");
      setAllTables([]);
      setSelectedArea(null);
      setSelectedTable(null);
    }
  }, [selectedBranch, reservationType]);

  // Fetch branch working hours and timezone
  const fetchBranchHours = async (branchId, ownerId) => {
    setBranchTimezone("");
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Owner/Main/GetBranchHoursTableReservation/${ownerId}/${branchId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const timezone = data?.branchHours?.timezone || "";
        setBranchTimezone(timezone);
      }
    } catch (err) {
      console.error("Error fetching branch hours:", err);
    }
  };

  // Fetch tables for branch
  const fetchTables = async (branchId, ownerId) => {
    setLoadingTables(true);
    setSelectedArea(null);
    setSelectedTable(null);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Owner/ManageTable/GetTablereservationTable/${branchId}/${ownerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const tablesArray = Array.isArray(data) ? data : [];
        setAllTables(tablesArray);

        // Pre-select first area if available
        const firstTable = tablesArray[0];
        if (firstTable?.areaid && firstTable?.areaname) {
          setSelectedArea({
            areaid: firstTable.areaid,
            areaname: firstTable.areaname,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching tables:", err);
      setAllTables([]);
    } finally {
      setLoadingTables(false);
    }
  };

  // Unique areas from tables data
  const areas = useMemo(() => {
    const areaMap = new Map();
    allTables.forEach((table) => {
      if (table.areaid && table.areaname && !areaMap.has(table.areaid)) {
        areaMap.set(table.areaid, {
          areaid: table.areaid,
          areaname: table.areaname,
        });
      }
    });
    return Array.from(areaMap.values());
  }, [allTables]);

  // Tables filtered by selected area
  const tablesInArea = useMemo(() => {
    if (!selectedArea) return [];
    return allTables.filter((t) => t.areaid === selectedArea.areaid);
  }, [allTables, selectedArea]);

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!selectedBranch) {
      newErrors.branch = translations.pleaseselectbranchfirst || "Please select a branch";
    }

    if (!selectedDate) {
      newErrors.date = translations.pleaseselectdate || "Please select a date";
    }

    if (!selectedTime) {
      newErrors.time = translations.pleaseselecttime || "Please select a time";
    }

    if (reservationType === "pickspot") {
      if (!selectedArea) {
        newErrors.area = translations.pleaseselectareafirst || "Please select an area";
      }
      if (!selectedTable) {
        newErrors.table = translations.pleaseselecttable || "Please select a table";
      }
    }

    if (reservationType === "quickseat") {
      if (!guestCount || guestCount < 1) {
        newErrors.guests = translations.pleaseenterguest || "Please enter number of guests";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Reservation
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm() || isSubmitting) return;

    const customerId = localStorage.getItem(customerIdName);
    if (!customerId) {
      showSnackbar(translations.pleasesignin || "Please sign in to make a reservation", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedTime = formatTime12h(selectedTime);

      const reservationData = {
        businessid: selectedBranch.businessid || business?.businessid,
        businessname: selectedBranch.businessname || business?.businessname,
        branchid: selectedBranch.branchid,
        branchname: selectedBranch.branchname,
        branchphonenumber: selectedBranch.phone || "",
        ownerid: selectedBranch.ownerid,
        reservationtype: reservationType,
        reservationdate: selectedDate, // YYYY-MM-DD
        reservationtime: formattedTime, // 07:30 PM
        timezone: branchTimezone || "UTC",
        specialnotes: specialNotes.trim(),
        ...(reservationType === "pickspot"
          ? {
            areaid: selectedArea.areaid,
            areaname: selectedArea.areaname,
            tableid: selectedTable.tableid,
            tableno: selectedTable.tableno,
            capacity: selectedTable.capacity,
          }
          : {
            guest: parseInt(guestCount, 10),
          }),
      };

      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/AddTableReservation/${customerId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
          },
          body: JSON.stringify(reservationData),
        }
      );

      const result = await response.json();

      if (response.ok) {
        showSnackbar(
          translations.tablereservationsavedsuccessfully ||
          "Table reservation booked successfully!",
          "success"
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showSnackbar(
          result?.message ||
          translations.somethingWentWrong ||
          "Failed to book table reservation.",
          "error"
        );
      }
    } catch (err) {
      console.error("Error saving reservation:", err);
      showSnackbar(
        translations.somethingWentWrong || "Error connecting to server.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="reservation-modal-overlay" onClick={onClose}>
      <div
        className="reservation-modal-card add-reservation-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-left">
            <div className="modal-icon-badge">
              <TableRestaurantIcon />
            </div>
            <div>
              <h3 className="modal-title">
                {translations.addreservation || "Book a Table"}
              </h3>
              <p className="modal-subtitle">
                {translations.bookingsubtitle ||
                  "Reserve your spot online with instant confirmation."}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="modal-scroll-body">
            {/* 1. Branch Selector */}
            <div className="form-group">
              <label className="form-label">
                <StorefrontIcon fontSize="small" className="label-icon" />
                <span>{translations.selectbranch || "Select Branch"}</span>
              </label>
              {loadingBranches ? (
                <div className="field-loading-placeholder">
                  <CircularProgress size={18} />
                  <span>Loading branches...</span>
                </div>
              ) : (
                <select
                  className={`form-select ${errors.branch ? "has-error" : ""}`}
                  value={selectedBranch?.branchid || ""}
                  onChange={(e) => {
                    const found = availableBranches.find(
                      (b) => String(b.branchid) === String(e.target.value)
                    );
                    setSelectedBranch(found || null);
                    setErrors((prev) => ({ ...prev, branch: null }));
                  }}
                >
                  <option value="" disabled>
                    {translations.selectbranch || "Choose a branch..."}
                  </option>
                  {availableBranches.map((branch) => (
                    <option key={branch.branchid} value={branch.branchid}>
                      {branch.branchname}{" "}
                      {branch.address ? `— ${branch.address}` : ""}
                    </option>
                  ))}
                </select>
              )}
              {errors.branch && (
                <span className="error-message">{errors.branch}</span>
              )}
            </div>

            {/* 2. Reservation Type Selector (Pick Spot vs Quick Seat) */}
            <div className="form-group">
              <label className="form-label">
                <span>{translations.reservationtype || "Reservation Type"}</span>
              </label>
              <div className="type-toggle-container">
                <button
                  type="button"
                  className={`type-toggle-card ${reservationType === "pickspot" ? "active" : ""
                    }`}
                  onClick={() => {
                    setReservationType("pickspot");
                    setErrors((prev) => ({ ...prev, area: null, table: null }));
                  }}
                >
                  <div className="type-icon-circle">
                    <EventSeatIcon />
                  </div>
                  <div className="type-text-meta">
                    <span className="type-name">
                      {translations.pickspot || "Pick Spot"}
                    </span>
                    <span className="type-desc">
                      {translations.pickspotdesc ||
                        "Choose your preferred dining area & table"}
                    </span>
                  </div>
                  {reservationType === "pickspot" && (
                    <CheckCircleIcon className="check-indicator" fontSize="small" />
                  )}
                </button>

                <button
                  type="button"
                  className={`type-toggle-card ${reservationType === "quickseat" ? "active" : ""
                    }`}
                  onClick={() => {
                    setReservationType("quickseat");
                    setErrors((prev) => ({ ...prev, guests: null }));
                  }}
                >
                  <div className="type-icon-circle quick">
                    <BoltIcon />
                  </div>
                  <div className="type-text-meta">
                    <span className="type-name">
                      {translations.quickseat || "Quick Seat"}
                    </span>
                    <span className="type-desc">
                      {translations.quickseatdesc ||
                        "Fast booking by guest count"}
                    </span>
                  </div>
                  {reservationType === "quickseat" && (
                    <CheckCircleIcon className="check-indicator" fontSize="small" />
                  )}
                </button>
              </div>
            </div>

            {/* 3. Seating Options: Pick Spot (Area & Table) vs Quick Seat (Guests) */}
            {reservationType === "pickspot" ? (
              <div className="pick-spot-fields">
                {/* Area Selector (Dropdown instead of tabs) */}
                <div className="form-group area-form-group">
                  <label className="form-label" htmlFor="reservation-area-dropdown">
                    <span>{translations.selectarea || "Select Area"}</span>
                    <span className="req">*</span>
                  </label>
                  {loadingTables ? (
                    <div className="field-loading-placeholder">
                      <CircularProgress size={18} />
                      <span>{translations.loadingareas || "Loading dining areas..."}</span>
                    </div>
                  ) : areas.length === 0 ? (
                    <div className="notice-chip">
                      {translations.noareafound ||
                        "No specific dining areas configured for this branch."}
                    </div>
                  ) : (
                    <Dropdown
                      id="reservation-area-dropdown"
                      placeholder={
                        translations.selectareaplaceholder ||
                        translations.selectarea ||
                        "Select Area"
                      }
                      options={areas}
                      labelKey="areaname"
                      valueKey="areaid"
                      selectedValue={selectedArea?.areaid || ""}
                      onValueChange={(newAreaId) => {
                        const chosen = areas.find(
                          (a) => String(a.areaid) === String(newAreaId)
                        );
                        setSelectedArea(chosen || null);
                        setSelectedTable(null);
                        setErrors((prev) => ({ ...prev, area: null }));
                      }}
                      showSearch={areas.length > 5}
                    />
                  )}
                  {errors.area && (
                    <span className="error-message">{errors.area}</span>
                  )}
                </div>

                {/* Table Selector */}
                {selectedArea && (
                  <div className="form-group">
                    <label className="form-label">
                      <span>{translations.selecttable || "Select Table"}</span>
                    </label>
                    {tablesInArea.length === 0 ? (
                      <div className="notice-chip">
                        {translations.notablefound || "No tables found in this area."}
                      </div>
                    ) : (
                      <div className="table-cards-grid">
                        {tablesInArea.map((table) => {
                          const isSelected =
                            selectedTable?.tableid === table.tableid;
                          return (
                            <button
                              key={table.tableid}
                              type="button"
                              className={`table-select-card ${isSelected ? "selected" : ""
                                }`}
                              onClick={() => {
                                setSelectedTable(table);
                                setErrors((prev) => ({ ...prev, table: null }));
                              }}
                            >
                              <TableRestaurantIcon className="table-card-icon" />
                              <span className="table-card-no">
                                {table.tableno}
                              </span>
                              <span className="table-card-cap">
                                {table.capacity}{" "}
                                {table.capacity === 1 ? "seat" : "seats"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {errors.table && (
                      <span className="error-message">{errors.table}</span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* Quick Seat: Guest Counter */
              <div className="form-group">
                <label className="form-label">
                  <GroupsOutlinedIcon fontSize="small" className="label-icon" />
                  <span>{translations.guest || "Number of Guests"}</span>
                </label>
                <div className="guest-stepper-box">
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={guestCount <= 1}
                    onClick={() =>
                      setGuestCount((prev) => Math.max(1, prev - 1))
                    }
                  >
                    <RemoveIcon fontSize="small" />
                  </button>
                  <div className="stepper-value-display">
                    <span className="count-number">{guestCount}</span>
                    <span className="count-label">
                      {guestCount === 1 ? "Guest" : "Guests"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="stepper-btn"
                    disabled={guestCount >= 20}
                    onClick={() =>
                      setGuestCount((prev) => Math.min(20, prev + 1))
                    }
                  >
                    <AddIcon fontSize="small" />
                  </button>
                </div>
                {errors.guests && (
                  <span className="error-message">{errors.guests}</span>
                )}
              </div>
            )}

            {/* 4. Date & Time Row */}
            <div className="form-grid-row">
              <div className="form-group">
                <label className="form-label">
                  <CalendarMonthOutlinedIcon
                    fontSize="small"
                    className="label-icon"
                  />
                  <span>{translations.date || "Date"}</span>
                </label>
                <input
                  type="date"
                  className={`form-input ${errors.date ? "has-error" : ""}`}
                  min={getTodayDateInputString()}
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setErrors((prev) => ({ ...prev, date: null }));
                  }}
                  required
                />
                {errors.date && (
                  <span className="error-message">{errors.date}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <AccessTimeIcon fontSize="small" className="label-icon" />
                  <span>{translations.time || "Time"}</span>
                </label>
                <input
                  type="time"
                  className={`form-input ${errors.time ? "has-error" : ""}`}
                  value={selectedTime}
                  onChange={(e) => {
                    setSelectedTime(e.target.value);
                    setErrors((prev) => ({ ...prev, time: null }));
                  }}
                  required
                />
                {errors.time && (
                  <span className="error-message">{errors.time}</span>
                )}
              </div>
            </div>

            {/* Timezone Indicator */}
            {branchTimezone && (
              <div className="branch-timezone-badge">
                <PublicIcon fontSize="inherit" />
                <span>
                  {translations.timezone || "Branch Timezone"}:{" "}
                  <strong>{branchTimezone}</strong>
                </span>
              </div>
            )}

            {/* 5. Special Notes */}
            <div className="form-group">
              <label className="form-label">
                <NotesOutlinedIcon fontSize="small" className="label-icon" />
                <span>{translations.specialnotes || "Special Requests"}</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={
                  translations.enterspecialnotes ||
                  "Add any requests (e.g., anniversary celebration, quiet table, child seat)..."
                }
                value={specialNotes}
                onChange={(e) => setSpecialNotes(e.target.value)}
                maxLength={400}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button
              type="button"
              className="modal-cancel-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              {translations.cancel || "Cancel"}
            </button>
            <button
              type="submit"
              className="modal-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <CircularProgress size={18} color="inherit" />
                  <span>
                    {translations.savingreservation || "Booking Table..."}
                  </span>
                </>
              ) : (
                <span>
                  {translations.confirmbooking || "Confirm Reservation"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReservationModal;

