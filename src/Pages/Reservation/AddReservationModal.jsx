import { useState, useEffect, useMemo } from "react";
import CloseIcon from "@mui/icons-material/Close";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import BoltIcon from "@mui/icons-material/Bolt";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import NotesOutlinedIcon from "@mui/icons-material/NotesOutlined";
import PublicIcon from "@mui/icons-material/Public";
import CircularProgress from "@mui/material/CircularProgress";

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
  const [guestCount, setGuestCount] = useState("");
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
      setGuestCount("");
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
        translations.somethingWentWrong,
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

  // Branch options formatted for Dropdown
  const branchOptions = useMemo(() => {
    return availableBranches.map((branch) => ({
      ...branch,
      displayLabel: branch.branchname || branch.name || "",
    }));
  }, [availableBranches]);

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

        // Pre-select first area & table if available
        const firstTable = tablesArray[0];
        if (firstTable?.areaid && firstTable?.areaname) {
          setSelectedArea({
            areaid: firstTable.areaid,
            areaname: firstTable.areaname,
          });
          setSelectedTable(firstTable);
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

  // Table options formatted for Dropdown
  const tableOptions = useMemo(() => {
    return tablesInArea.map((table) => ({
      ...table,
      displayLabel: `${table.tableno}${table.capacity
        ? ` (${table.capacity} ${table.capacity === 1
          ? translations.seat
          : translations.seats
        })`
        : ""
        }`,
    }));
  }, [tablesInArea, translations]);

  // Form Validation
  const validateForm = () => {
    const newErrors = {};

    if (!selectedBranch) {
      newErrors.branch = translations.pleaseselectbranchfirst;
    }

    if (!selectedDate) {
      newErrors.date = translations.pleaseselectdate;
    }

    if (!selectedTime) {
      newErrors.time = translations.pleaseselecttime;
    }

    if (reservationType === "pickspot") {
      if (!selectedArea) {
        newErrors.area = translations.pleaseselectareafirst;
      }
      if (!selectedTable) {
        newErrors.table = translations.pleaseselecttable;
      }
    }

    if (reservationType === "quickseat") {
      if (!guestCount || Number(guestCount) < 1) {
        newErrors.guests = translations.pleaseenterguest;
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
      showSnackbar(translations.pleasesignin, "warning");
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
          translations.tablereservationsavedsuccessfully,
          "success"
        );
        if (onSuccess) onSuccess();
        onClose();
      } else {
        showSnackbar(
          result?.message ||
          translations.somethingWentWrong,
          "error"
        );
      }
    } catch (err) {
      console.error("Error saving reservation:", err);
      showSnackbar(
        translations.somethingWentWrong,
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
        {/* Modal Header (Matching Manage Address modal header design) */}
        <div className="modal-header">
          <h2 className="modal-title">
            {translations.addreservation}
          </h2>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="reservation-form">
          <div className="modal-scroll-body">
            {/* 1. Branch Selector (Dropdown matching ManageAddress dropdown design) */}
            <div className="form-group branch-form-group">
              {loadingBranches ? (
                <div className="field-loading-placeholder">
                  <CircularProgress size={18} />
                  <span>{translations.loadingbranches}</span>
                </div>
              ) : availableBranches.length === 0 ? (
                <div className="notice-chip">
                  {translations.nobranchfound}
                </div>
              ) : (
                <Dropdown
                  id="reservation-branch-dropdown"
                  label={translations.branch}
                  required={true}
                  placeholder={translations.selectbranchplaceholder}
                  options={branchOptions}
                  labelKey="displayLabel"
                  valueKey="branchid"
                  selectedValue={selectedBranch?.branchid || ""}
                  onValueChange={(newBranchId) => {
                    const found = availableBranches.find(
                      (b) => String(b.branchid) === String(newBranchId)
                    );
                    setSelectedBranch(found || null);
                    setErrors((prev) => ({ ...prev, branch: null }));
                  }}
                  showSearch={true}
                />
              )}
              {errors.branch && (
                <span className="field-error-msg">{errors.branch}</span>
              )}
            </div>

            {/* 2. Reservation Type Selector (Pick Spot vs Quick Seat) */}
            <div className="form-group">
              <label className="form-label">
                <span>{translations.reservationtype}</span>
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
                      {translations.pickspot}
                    </span>
                  </div>
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
                      {translations.quickseat}
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Seating Options: Pick Spot (Area & Table) vs Quick Seat (Guests) */}
            {reservationType === "pickspot" ? (
              <div className="pick-spot-fields">
                {/* Area Selector (Dropdown matching ManageAddress dropdown design) */}
                <div className="form-group area-form-group">
                  {loadingTables ? (
                    <div className="field-loading-placeholder">
                      <CircularProgress size={18} />
                      <span>{translations.loadingareas}</span>
                    </div>
                  ) : areas.length === 0 ? (
                    <div className="notice-chip">
                      {translations.noareafound}
                    </div>
                  ) : (
                    <Dropdown
                      id="reservation-area-dropdown"
                      label={translations.area}
                      required={true}
                      placeholder={translations.selectareaplaceholder}
                      options={areas}
                      labelKey="areaname"
                      valueKey="areaid"
                      selectedValue={selectedArea?.areaid || ""}
                      onValueChange={(newAreaId) => {
                        const chosen = areas.find(
                          (a) => String(a.areaid) === String(newAreaId)
                        );
                        setSelectedArea(chosen || null);
                        const tablesInNewArea = allTables.filter(
                          (t) => String(t.areaid) === String(newAreaId)
                        );
                        setSelectedTable(tablesInNewArea[0] || null);
                        setErrors((prev) => ({
                          ...prev,
                          area: null,
                          table: null,
                        }));
                      }}
                      showSearch={true}
                    />
                  )}
                  {errors.area && (
                    <span className="field-error-msg">{errors.area}</span>
                  )}
                </div>

                {/* Table Selector (Dropdown matching ManageAddress dropdown design) */}
                <div className="form-group table-form-group">
                  <Dropdown
                    id="reservation-table-dropdown"
                    label={translations.tablelabel}
                    required={true}
                    placeholder={
                      !selectedArea
                        ? (translations.pleaseselectareafirst)
                        : tablesInArea.length === 0
                          ? (translations.notablefound)
                          : translations.selecttableplaceholder
                    }
                    options={tableOptions}
                    labelKey="displayLabel"
                    valueKey="tableid"
                    selectedValue={selectedTable?.tableid || ""}
                    onValueChange={(newTableId) => {
                      const chosen = tablesInArea.find(
                        (t) => String(t.tableid) === String(newTableId)
                      );
                      setSelectedTable(chosen || null);
                      setErrors((prev) => ({ ...prev, table: null }));
                    }}
                    disabled={!selectedArea || tablesInArea.length === 0}
                    showSearch={true}
                  />
                  {errors.table && (
                    <span className="field-error-msg">{errors.table}</span>
                  )}
                </div>
              </div>
            ) : (
              /* Quick Seat: Guest Input */
              <div className="form-group guest-form-group">
                <label className="form-label" htmlFor="reservation-guests-input">
                  <GroupsOutlinedIcon fontSize="small" className="label-icon" />
                  <span>{translations.guest}</span>
                </label>
                <input
                  id="reservation-guests-input"
                  type="number"
                  className={`form-input guest-input ${errors.guests ? "has-error" : ""}`}
                  min="1"
                  max="100"
                  placeholder={
                    translations.enterguestcount
                  }
                  value={guestCount}
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-", "."].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "") {
                      setGuestCount("");
                    } else {
                      const num = parseInt(val, 10);
                      setGuestCount(isNaN(num) || num <= 0 ? "" : num);
                    }
                    setErrors((prev) => ({ ...prev, guests: null }));
                  }}
                />
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
                  <span>{translations.date}</span>
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
                  <span>{translations.time}</span>
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
                <span>{branchTimezone}</span>
              </div>
            )}

            {/* 5. Special Notes */}
            <div className="form-group">
              <label className="form-label">
                <NotesOutlinedIcon fontSize="small" className="label-icon" />
                <span>{translations.specialnotes}</span>
              </label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder={
                  translations.enterspecialnotes
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
              {translations.cancel}
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
                    {translations.savingreservation}
                  </span>
                </>
              ) : (
                <span>
                  {translations.confirmbooking}
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

