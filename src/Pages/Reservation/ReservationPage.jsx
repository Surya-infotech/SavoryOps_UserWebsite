import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import ReservationList from "./ReservationList.jsx";
import AddReservationModal from "./AddReservationModal.jsx";
import ReservationDetailsModal from "./ReservationDetailsModal.jsx";
import {
  getStoredDateFormat,
  getStoredTimeFormat,
  getStoredTimeZone,
} from "./reservationHelpers.js";
import "../../Scss/Pages/Reservation/tablereservation.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ReservationPage = () => {
  const { reservationId: paramReservationId } = useParams();
  const navigate = useNavigate();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname || "";

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Date and Time formats from user preferences/localStorage
  const [dateFormat, setDateFormat] = useState(getStoredDateFormat);
  const [timeFormat, setTimeFormat] = useState(getStoredTimeFormat);
  const [timeZone, setTimeZone] = useState(getStoredTimeZone);

  // Listen for date & time format changes
  useEffect(() => {
    const handleDateTimeSettingsChange = (e) => {
      if (e?.detail) {
        if (e.detail.dateFormat) setDateFormat(e.detail.dateFormat);
        if (e.detail.timeFormat) setTimeFormat(e.detail.timeFormat);
        if (e.detail.timezone || e.detail.timeZone) {
          setTimeZone(e.detail.timezone || e.detail.timeZone);
        }
      } else {
        setDateFormat(getStoredDateFormat());
        setTimeFormat(getStoredTimeFormat());
        setTimeZone(getStoredTimeZone());
      }
    };

    window.addEventListener("dateTimeSettingsChange", handleDateTimeSettingsChange);
    window.addEventListener("storage", handleDateTimeSettingsChange);

    return () => {
      window.removeEventListener("dateTimeSettingsChange", handleDateTimeSettingsChange);
      window.removeEventListener("storage", handleDateTimeSettingsChange);
    };
  }, []);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Set document title
  useEffect(() => {
    const pageTitle = translations.tablereservation || "Table Reservations";
    if (businessDisplayName) {
      document.title = `${pageTitle} | ${businessDisplayName}`;
    } else {
      document.title = pageTitle;
    }
  }, [translations, businessDisplayName]);

  // Fetch reservations from server
  const fetchReservations = useCallback(async () => {
    const customerId = localStorage.getItem(customerIdName);
    if (!customerId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/GetTableReservation/${customerId}`,
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
        setReservations(Array.isArray(data) ? data : []);
      } else {
        setReservations([]);
      }
    } catch (err) {
      console.error("Error fetching reservations:", err);
      setReservations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReservations();
  }, [fetchReservations]);

  // If a reservationId is passed in URL, open details modal
  useEffect(() => {
    if (paramReservationId) {
      const match = reservations.find((r) => r._id === paramReservationId);
      if (match) {
        setSelectedReservation(match);
      } else {
        setSelectedReservation({ _id: paramReservationId });
      }
      setIsDetailsModalOpen(true);
    }
  }, [paramReservationId, reservations]);

  const handleSelectReservation = (reservation) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedReservation(null);
    if (paramReservationId) {
      navigate("/reservation", { replace: true });
    }
  };

  const breadcrumbItems = [
    { label: translations.home || "Home", path: "/" },
    { label: translations.tablereservation || "Table Reservations" },
  ];

  return (
    <div className={`reservation-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="reservation-page-container">
        <ReservationList
          reservations={reservations}
          loading={loading}
          dateFormat={dateFormat}
          timeFormat={timeFormat}
          timeZone={timeZone}
          onSelectReservation={handleSelectReservation}
          onOpenAddModal={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* Add Table Reservation Modal */}
      <AddReservationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          fetchReservations();
        }}
      />

      {/* Reservation Details Modal */}
      <ReservationDetailsModal
        isOpen={isDetailsModalOpen}
        reservationId={selectedReservation?._id}
        initialReservation={selectedReservation}
        dateFormat={dateFormat}
        timeFormat={timeFormat}
        timeZone={timeZone}
        onClose={handleCloseDetailsModal}
        onReservationUpdated={() => {
          fetchReservations();
        }}
      />
    </div>
  );
};

export default ReservationPage;