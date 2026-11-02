import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import ReservationList from "./ReservationList.jsx";
import AddReservationModal from "./AddReservationModal.jsx";
import ReservationDetailsModal from "./ReservationDetailsModal.jsx";
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
        onClose={handleCloseDetailsModal}
        onReservationUpdated={() => {
          fetchReservations();
        }}
      />
    </div>
  );
};

export default ReservationPage;