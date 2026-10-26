import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import WorkOutlineOutlinedIcon from "@mui/icons-material/WorkOutlineOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LocationOffOutlinedIcon from "@mui/icons-material/LocationOffOutlined";
import MarkunreadMailboxOutlinedIcon from "@mui/icons-material/MarkunreadMailboxOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { Country, State, City } from "country-state-city";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
import "../../Scss/Pages/Profile/manageaddress.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ADDRESS_TYPES = [
  { id: "home", label: "Home", icon: HomeOutlinedIcon },
  { id: "work", label: "Work", icon: WorkOutlineOutlinedIcon },
  { id: "other", label: "Other", icon: PlaceOutlinedIcon },
];

const ManageAddressPage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields State
  const [addressType, setAddressType] = useState("home");
  const [streetAddress, setStreetAddress] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [countryName, setCountryName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [stateName, setStateName] = useState("");
  const [cityName, setCityName] = useState("");
  const [pincode, setPincode] = useState("");

  // Form Validation Errors
  const [addressError, setAddressError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [stateError, setStateError] = useState("");
  const [cityError, setCityError] = useState("");
  const [pincodeError, setPincodeError] = useState("");

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Countries list memo
  const countries = useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      name: c.name,
      isoCode: c.isoCode,
    }));
  }, []);

  // States list memo based on countryCode
  const states = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((s) => ({
      name: s.name,
      isoCode: s.isoCode,
    }));
  }, [countryCode]);

  // Cities list memo based on countryCode and stateCode
  const cities = useMemo(() => {
    if (!countryCode || !stateCode) return [];
    return City.getCitiesOfState(countryCode, stateCode).map((c) => ({
      name: c.name,
    }));
  }, [countryCode, stateCode]);

  // Document Title
  useEffect(() => {
    const pageTitle = translations.manageaddress;
    if (businessDisplayName) {
      document.title = `${pageTitle} | ${businessDisplayName}`;
    }
  }, [translations, businessDisplayName]);

  // Fetch all addresses for the authenticated customer
  const fetchAddresses = useCallback(async () => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId || !token) {
      navigate("/", { replace: true });
      return;
    }

    setLoading(true);
    try {
      // Calls website profile route (reusing manageaddress-controller)
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/GetManageAddress/${customerId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAddresses(Array.isArray(data) ? data : []);
      } else {
        setAddresses([]);
      }
    } catch (err) {
      console.error("Error fetching addresses:", err);
      showSnackbar(translations.failedtoloadaddresses, "error");
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, [navigate, showSnackbar, translations]);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  // Open modal for Adding new address
  const handleOpenAddModal = () => {
    setEditingAddressId(null);
    setAddressType("home");
    setStreetAddress("");
    setCountryCode("");
    setCountryName("");
    setStateCode("");
    setStateName("");
    setCityName("");
    setPincode("");

    setAddressError("");
    setCountryError("");
    setStateError("");
    setCityError("");
    setPincodeError("");

    setIsModalOpen(true);
  };

  // Open modal for Editing address
  const handleOpenEditModal = (addr) => {
    setEditingAddressId(addr._id || addr.addressid);
    setAddressType(addr.addresstype?.toLowerCase() || "home");
    setStreetAddress(addr.address || "");
    setPincode(addr.postalcode ? String(addr.postalcode) : "");

    // Resolve Country Code
    const rawCountry = addr.country || "";
    const matchedCountry = countries.find(
      (c) =>
        c.name.toLowerCase() === rawCountry.toLowerCase() ||
        c.isoCode.toLowerCase() === rawCountry.toLowerCase()
    );
    const resolvedCountryCode = matchedCountry ? matchedCountry.isoCode : "";
    const resolvedCountryName = matchedCountry ? matchedCountry.name : rawCountry;

    setCountryCode(resolvedCountryCode);
    setCountryName(resolvedCountryName);

    // Resolve State Code
    const rawState = addr.state || "";
    if (resolvedCountryCode) {
      const countryStates = State.getStatesOfCountry(resolvedCountryCode);
      const matchedState = countryStates.find(
        (s) =>
          s.name.toLowerCase() === rawState.toLowerCase() ||
          s.isoCode.toLowerCase() === rawState.toLowerCase()
      );
      setStateCode(matchedState ? matchedState.isoCode : "");
      setStateName(matchedState ? matchedState.name : rawState);
    } else {
      setStateCode("");
      setStateName(rawState);
    }

    setCityName(addr.city || "");

    setAddressError("");
    setCountryError("");
    setStateError("");
    setCityError("");
    setPincodeError("");

    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingAddressId(null);
  };

  // Country Change Handler in Form
  const handleCountryChange = (isoCode) => {
    setCountryCode(isoCode);
    const found = countries.find((c) => c.isoCode === isoCode);
    setCountryName(found ? found.name : "");
    setStateCode("");
    setStateName("");
    setCityName("");
    if (countryError) setCountryError("");
  };

  // State Change Handler in Form
  const handleStateChange = (isoCode) => {
    setStateCode(isoCode);
    const found = states.find((s) => s.isoCode === isoCode);
    setStateName(found ? found.name : "");
    setCityName("");
    if (stateError) setStateError("");
  };

  // City Change Handler in Form
  const handleCityChange = (val) => {
    setCityName(val);
    if (cityError) setCityError("");
  };

  // Save / Update Address Submission
  const handleSaveAddress = async (e) => {
    e.preventDefault();

    let isValid = true;

    if (!streetAddress.trim()) {
      setAddressError(translations.addressrequired);
      isValid = false;
    } else {
      setAddressError("");
    }

    if (!countryName) {
      setCountryError(translations.countryrequired);
      isValid = false;
    } else {
      setCountryError("");
    }

    if (!stateName) {
      setStateError(translations.staterequired);
      isValid = false;
    } else {
      setStateError("");
    }

    if (!cityName) {
      setCityError(translations.cityrequired);
      isValid = false;
    } else {
      setCityError("");
    }

    if (!pincode.trim()) {
      setPincodeError(translations.pincoderequired);
      isValid = false;
    } else if (pincode.trim().length < 3) {
      setPincodeError(translations.pincodeinvalid);
      isValid = false;
    } else {
      setPincodeError("");
    }

    if (!isValid) return;

    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);
    if (!customerId || !token) {
      navigate("/", { replace: true });
      return;
    }

    setIsSaving(true);
    const payload = {
      address: streetAddress.trim(),
      addresstype: addressType,
      country: countryName,
      state: stateName,
      city: cityName,
      postalcode: pincode.trim(),
    };

    try {
      const endpoint = editingAddressId
        ? `${adminPanelBackendPath}/Website/Profile/UpdateManageAddress/${editingAddressId}`
        : `${adminPanelBackendPath}/Website/Profile/AddManageAddress/${customerId}`;

      const method = editingAddressId ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user": "customer",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showSnackbar(
          editingAddressId
            ? translations.addressupdatedsuccessfully
            : translations.addressaddedsuccessfully,
          "success"
        );
        setIsModalOpen(false);
        setEditingAddressId(null);
        await fetchAddresses();
      } else {
        const errData = await response.json().catch(() => null);
        showSnackbar(errData?.message || translations.failedtosaveaddress, "error");
      }
    } catch (err) {
      console.error("Error saving address:", err);
      showSnackbar(translations.servererror, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Delete Confirmation Modal
  const handlePromptDelete = (addr) => {
    setAddressToDelete(addr);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setAddressToDelete(null);
  };

  // Confirm Delete Address
  const handleConfirmDelete = async () => {
    if (!addressToDelete || isDeleting) return;

    const token = localStorage.getItem(customerTokenName);
    const addressId = addressToDelete._id || addressToDelete.addressid;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `${adminPanelBackendPath}/Website/Profile/DeleteManageAddress/${addressId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "x-user": "customer",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        showSnackbar(translations.addressdeletedsuccessfully, "success");
        setDeleteModalOpen(false);
        setAddressToDelete(null);
        await fetchAddresses();
      } else {
        const errData = await response.json().catch(() => null);
        showSnackbar(errData?.message || translations.failedtodeleteaddress, "error");
      }
    } catch (err) {
      console.error("Error deleting address:", err);
      showSnackbar(translations.servererror, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  // Helper for address type icon
  const getBadgeIcon = (type) => {
    const normalized = type?.toLowerCase() || "";
    if (normalized === "work") return <WorkOutlineOutlinedIcon fontSize="small" />;
    if (normalized === "other") return <PlaceOutlinedIcon fontSize="small" />;
    return <HomeOutlinedIcon fontSize="small" />;
  };

  return (
    <div className={`manage-address-wrapper ${isRtl ? "is-rtl" : ""}`}>
      <div className="manage-address-container">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: translations.home || "Home", path: "/" },
            { label: translations.myaccount || "My Account", path: "/profile" },
            { label: translations.manageaddress || "Manage Addresses" },
          ]}
        />

        {/* Page Top Header */}
        <header className="manage-address-header">
          <div className="manage-address-header-meta">
            <h1 className="manage-address-title">
              {translations.manageaddress}
            </h1>
            <p className="manage-address-subtitle">
              {translations.addresssubtitle}
            </p>
          </div>
          <button
            type="button"
            className="add-address-btn"
            onClick={handleOpenAddModal}
            id="add-new-address-header-btn"
          >
            <AddIcon fontSize="small" />
            <span>{translations.addaddress}</span>
          </button>
        </header>

        {/* Content Area */}
        {loading ? (
          <div className="address-loading-wrap">
            <CircularProgress size={40} sx={{ color: "#028802" }} />
            <p>{translations.loading}</p>
          </div>
        ) : addresses.length === 0 ? (
          /* Empty State */
          <div className="address-empty-card">
            <div className="empty-icon-wrap">
              <LocationOffOutlinedIcon className="empty-icon" />
            </div>
            <h2 className="empty-title">
              {translations.noAddresses}
            </h2>
            <p className="empty-subtitle">
              {translations.noAddressesMessage}
            </p>
            <button
              type="button"
              className="empty-add-btn"
              onClick={handleOpenAddModal}
            >
              <AddIcon fontSize="small" />
              <span>{translations.addaddress}</span>
            </button>
          </div>
        ) : (
          /* Address Cards Grid */
          <div className="address-cards-grid">
            {addresses.map((item) => {
              const typeKey = (item.addresstype || "home").toLowerCase();
              return (
                <div key={item._id || item.addressid} className="address-card">
                  {/* Card Header with Type Badge & Actions */}
                  <div className="address-card-header">
                    <span className={`address-type-badge ${typeKey}`}>
                      {getBadgeIcon(typeKey)}
                      <span className="type-label">
                        {translations[typeKey] || item.addresstype}
                      </span>
                    </span>

                    <div className="address-card-actions">
                      <button
                        type="button"
                        className="card-action-btn edit"
                        onClick={() => handleOpenEditModal(item)}
                        title={translations.editaddress}
                        aria-label={translations.editaddress}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </button>
                      <button
                        type="button"
                        className="card-action-btn delete"
                        onClick={() => handlePromptDelete(item)}
                        title={translations.delete}
                        aria-label={translations.delete}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </button>
                    </div>
                  </div>

                  {/* Card Body with Detailed Address */}
                  <div className="address-card-body">
                    <p className="street-line">{item.address}</p>
                    <p className="city-state-line">
                      {[item.city, item.state, item.country]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                    {item.postalcode && (
                      <div className="postal-chip" title={translations.postalcode}>
                        <MarkunreadMailboxOutlinedIcon fontSize="inherit" />
                        <span>{item.postalcode}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- ADD / EDIT ADDRESS MODAL --- */}
      {isModalOpen && (
        <div className="address-modal-overlay" onClick={handleCloseModal}>
          <div
            className="address-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-modal-title"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <h2 id="address-modal-title" className="modal-title">
                {editingAddressId
                  ? translations.editaddress
                  : translations.addaddress}
              </h2>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseModal}
                disabled={isSaving}
                aria-label="Close dialog"
              >
                <CloseIcon />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAddress} className="address-modal-form" noValidate autoComplete="off">
              {/* Address Type Chips */}
              <div className="form-group span-full">
                <label className="form-label">
                  {translations.addresstype}
                </label>
                <div className="address-type-selector">
                  {ADDRESS_TYPES.map((typeObj) => {
                    const isSelected = addressType === typeObj.id;
                    const IconComp = typeObj.icon;
                    return (
                      <button
                        key={typeObj.id}
                        type="button"
                        className={`type-select-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => setAddressType(typeObj.id)}
                      >
                        <IconComp fontSize="small" />
                        <span>{translations[typeObj.id] || typeObj.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Street Address */}
              <div className="form-group span-full">
                <label className="form-label" htmlFor="address-street">
                  {translations.address} <span className="req">*</span>
                </label>
                <div className={`textarea-field-wrap ${addressError ? "has-error" : ""}`}>
                  <HomeOutlinedIcon className="field-icon textarea-icon" />
                  <textarea
                    id="address-street"
                    name="modal_addr_street"
                    rows={2}
                    className="textarea-input"
                    placeholder={translations.streetaddressplaceholder}
                    autoComplete="off"
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      if (addressError) setAddressError("");
                    }}
                  />
                </div>
                {addressError && <span className="field-error-msg">{addressError}</span>}
              </div>

              {/* Country Dropdown */}
              <div className="form-group">
                <Dropdown
                  id="address-country-dropdown"
                  label={translations.country}
                  required={true}
                  options={countries}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={countryCode}
                  onValueChange={handleCountryChange}
                  placeholder={translations.countryselect}
                  showSearch={true}
                />
                {countryError && <span className="field-error-msg">{countryError}</span>}
              </div>

              {/* State Dropdown */}
              <div className="form-group">
                <Dropdown
                  id="address-state-dropdown"
                  label={translations.state}
                  required={true}
                  options={states}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={stateCode}
                  onValueChange={handleStateChange}
                  placeholder={
                    countryCode ? translations.stateselect : translations.selectcountryfirst
                  }
                  disabled={!countryCode || states.length === 0}
                  showSearch={true}
                />
                {stateError && <span className="field-error-msg">{stateError}</span>}
              </div>

              {/* City Dropdown */}
              <div className="form-group">
                <Dropdown
                  id="address-city-dropdown"
                  label={translations.city}
                  required={true}
                  options={cities}
                  labelKey="name"
                  valueKey="name"
                  selectedValue={cityName}
                  onValueChange={handleCityChange}
                  placeholder={
                    stateCode ? translations.cityselect : translations.selectstatefirst
                  }
                  disabled={!stateCode || cities.length === 0}
                  showSearch={true}
                />
                {cityError && <span className="field-error-msg">{cityError}</span>}
              </div>

              {/* Postal Code / Pincode */}
              <div className="form-group">
                <label className="form-label" htmlFor="address-postalcode">
                  {translations.postalcode} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${pincodeError ? "has-error" : ""}`}>
                  <MarkunreadMailboxOutlinedIcon className="field-icon" />
                  <input
                    id="address-postalcode"
                    name="address_postal_code_field"
                    type="text"
                    className="text-input"
                    placeholder={translations.enterpostalcode}
                    autoComplete="off"
                    value={pincode}
                    onChange={(e) => {
                      setPincode(e.target.value);
                      if (pincodeError) setPincodeError("");
                    }}
                  />
                </div>
                {pincodeError && <span className="field-error-msg">{pincodeError}</span>}
              </div>

              {/* Modal Footer Buttons */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={handleCloseModal}
                  disabled={isSaving}
                >
                  {translations.cancel}
                </button>
                <button
                  type="submit"
                  className="modal-save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <CircularProgress size={18} color="inherit" />
                      <span>{translations.saving}</span>
                    </>
                  ) : (
                    <span>
                      {editingAddressId
                        ? translations.updateaddress
                        : translations.saveaddress}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {deleteModalOpen && (
        <div className="address-modal-overlay" onClick={handleCloseDeleteModal}>
          <div
            className="delete-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="delete-icon-box">
              <DeleteOutlineOutlinedIcon className="delete-icon" />
            </div>
            <h3 className="delete-modal-title">{translations.deletedeliveryaddress}</h3>
            <p className="delete-modal-text">
              {translations.deleteaddressconfirm}
            </p>
            <div className="delete-modal-actions">
              <button
                type="button"
                className="delete-cancel-btn"
                onClick={handleCloseDeleteModal}
                disabled={isDeleting}
              >
                {translations.cancel}
              </button>
              <button
                type="button"
                className="delete-confirm-btn"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? translations.deleting : translations.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAddressPage;