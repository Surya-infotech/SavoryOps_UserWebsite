import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import LoadingSpinner from "../Custom/LoadingSpinner.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import {
  getStoredDateFormat,
  getStoredTimeFormat,
  getStoredTimeZone,
} from "./reservationHelpers.js";
import HandleUnauthorized from "../../utils/HandleUnauthorized.jsx";
import "../../Scss/Pages/Reservation/reservationpage.scss";

const ReservationList = lazy(() => import("./ReservationList.jsx"));
const AddReservationModal = lazy(() => import("./AddReservationModal.jsx"));
const ReservationDetails = lazy(() => import("./ReservationDetails.jsx"));

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ReservationPage = () => {
  const { reservationId: paramReservationId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname || "";

  // Selected reservation id from param or query param
  const selectedReservationId = paramReservationId || searchParams.get("id") || null;

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

  // Set document title
  useEffect(() => {
    const pageTitle = selectedReservationId
      ? translations.reservationdetails
      : translations.tablereservation;
    if (businessDisplayName) {
      document.title = `${pageTitle} | ${businessDisplayName}`;
    } else {
      document.title = pageTitle;
    }
  }, [selectedReservationId, translations, businessDisplayName]);

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

      const data = await response.json().catch(() => null);
      if (HandleUnauthorized(data, null, navigate)) {
        setLoading(false);
        return;
      }

      if (response.ok) {
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

  const handleSelectReservation = (reservation) => {
    setSelectedReservation(reservation);
    const id = reservation?._id || reservation?.reservationid;
    navigate(`/reservationdetails/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackToList = () => {
    setSelectedReservation(null);
    navigate("/reservation");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const matchedReservation =
    selectedReservation ||
    (selectedReservationId
      ? reservations.find(
        (r) =>
          r._id === selectedReservationId ||
          String(r.reservationid) === String(selectedReservationId)
      )
      : null);

  const breadcrumbItems = selectedReservationId
    ? [
      { label: translations.home, path: "/" },
      {
        label: translations.tablereservation,
        path: "/reservation",
      },
      { label: translations.reservationdetails },
    ]
    : [
      { label: translations.home, path: "/" },
      { label: translations.tablereservation },
    ];

  return (
    <div className={`reservation-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      {/* Site-wide Unified Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      <div className="reservation-page-container">
        <Suspense fallback={<LoadingSpinner type="detail" />}>
          {selectedReservationId ? (
            <ReservationDetails
              reservationId={selectedReservationId}
              initialReservation={matchedReservation}
              dateFormat={dateFormat}
              timeFormat={timeFormat}
              timeZone={timeZone}
              onBack={handleBackToList}
              onReservationUpdated={() => {
                fetchReservations();
              }}
            />
          ) : (
            <ReservationList
              reservations={reservations}
              loading={loading}
              dateFormat={dateFormat}
              timeFormat={timeFormat}
              timeZone={timeZone}
              onSelectReservation={handleSelectReservation}
              onOpenAddModal={() => setIsAddModalOpen(true)}
            />
          )}
        </Suspense>
      </div>

      {/* Add Table Reservation Modal */}
      {isAddModalOpen && (
        <Suspense fallback={null}>
          <AddReservationModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onSuccess={() => {
              fetchReservations();
            }}
          />
        </Suspense>
      )}
    </div>
  );
};

export default ReservationPage;