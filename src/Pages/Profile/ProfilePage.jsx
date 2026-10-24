import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import CameraAltOutlinedIcon from "@mui/icons-material/CameraAltOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import { Country, State, City } from "country-state-city";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import "../../Scss/Pages/Profile/profile.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

const ProfilePage = () => {
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { translations = {}, isRtl } = useLanguage();
  const { business } = useWebsiteStatus();
  const businessDisplayName = business?.businessname;

  // Form Fields State
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [gender, setGender] = useState("Male");
  const [address, setAddress] = useState("");

  // Country, State, City State
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  // Profile Image State
  const [profileImage, setProfileImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const fileInputRef = useRef(null);

  // Status & Validation Errors
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileNumberError, setMobileNumberError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [stateError, setStateError] = useState("");
  const [cityError, setCityError] = useState("");

  useEffect(() => {
    const allCountries = Country.getAllCountries().map((country) => ({
      isoCode: country.isoCode,
      name: country.name,
    }));
    setCountries(allCountries);
  }, []);

  useEffect(() => {
    if (country) {
      const countryStates = State.getStatesOfCountry(country).map((state) => ({
        isoCode: state.isoCode,
        name: state.name,
      }));
      setStates(countryStates);
    } else {
      setStates([]);
      setCities([]);
    }
  }, [country]);

  useEffect(() => {
    if (country && state) {
      const stateCities = City.getCitiesOfState(country, state).map((city) => ({
        name: city.name,
      }));
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [country, state]);

  // Update document title and cleanup on unmount
  useEffect(() => {
    if (businessDisplayName) {
      document.title = `${translations.myaccount || "My Profile"} | ${businessDisplayName}`;
    }
    return () => {
      if (businessDisplayName) {
        document.title = businessDisplayName;
      }
    };
  }, [translations, businessDisplayName]);

  // Auth Protection & Fetch Customer Details on mount
  useEffect(() => {
    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId || !token) {
      navigate("/", { replace: true });
      return;
    }

    const fetchCustomerProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `${adminPanelBackendPath}/Website/General/GetCustomerDetails/${customerId}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-user": "customer", Authorization: `Bearer ${token}`, },
        });

        if (response.ok) {
          const data = await response.json();
          if (data) {
            setFirstName(data.customerfirstname || "");
            setLastName(data.customerlastname || "");
            setEmail(data.email || "");
            setMobileNumber(data.phone || "");
            setGender(data.gender || "Male");
            setAddress(data.address || "");
            setProfileImage(data.profileurl || "");

            let countryIsoCode = "";
            let stateIsoCode = "";

            if (data.countryname) {
              const allCountries = Country.getAllCountries();
              const foundCountry = allCountries.find(
                (c) => c.name === data.countryname || c.isoCode === data.countryname
              );
              if (foundCountry) {
                countryIsoCode = foundCountry.isoCode;
              }
            }

            if (data.statename && countryIsoCode) {
              const countryStates = State.getStatesOfCountry(countryIsoCode);
              const foundState = countryStates.find(
                (s) => s.name === data.statename || s.isoCode === data.statename
              );
              if (foundState) {
                stateIsoCode = foundState.isoCode;
              }
            }

            setCountry(countryIsoCode);
            setState(stateIsoCode);
            setCity(data.cityname || "");
          }
        }
      } catch (error) {
        console.error("Error fetching customer profile:", error);
        showSnackbar(translations.servererror || "Failed to load profile details", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerProfile();

    const handleAuthChange = (event) => {
      const detail = event?.detail;
      if (!detail?.isLoggedIn) {
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("customerAuthChange", handleAuthChange);
    return () => {
      window.removeEventListener("customerAuthChange", handleAuthChange);
    };
  }, [navigate]);

  // Handle Location Dropdowns Change
  const handleCountryChange = (value) => {
    setCountry(value);
    setState("");
    setCity("");
    if (countryError) setCountryError("");
    if (stateError) setStateError("");
    if (cityError) setCityError("");
  };

  const handleStateChange = (value) => {
    setState(value);
    setCity("");
    if (stateError) setStateError("");
    if (cityError) setCityError("");
  };

  const handleCityChange = (value) => {
    setCity(value);
    if (cityError) setCityError("");
  };

  // Image Selection Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSnackbar("Please select a valid image file (JPG, PNG, WEBP).", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar("Image size must be 5MB or less.", "error");
      return;
    }

    setSelectedImageFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPreviewImage(previewUrl);
  };

  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setPreviewImage("");
    setProfileImage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validation Helpers (Parity with SavoryOps_UserApp)
  const validateName = (name, fieldLabel) => {
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!name || !name.trim()) return `${fieldLabel} is required`;
    if (!nameRegex.test(name.trim())) return "Only letters are allowed";
    if (name.startsWith(" ")) return "First character cannot be a space";
    return "";
  };

  const validateEmailFormat = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val || !val.trim()) return "Email address is required";
    if (!emailRegex.test(val.trim())) return "Invalid email address format";
    return "";
  };

  const validatePhone = (val) => {
    if (!val || !String(val).trim()) return "Phone number is required";
    const cleaned = String(val).replace(/\D/g, "");
    if (cleaned.length < 8) return "Please enter a valid phone number";
    return "";
  };

  // Profile Completion Percentage
  const completionPercentage = useMemo(() => {
    const fields = [
      firstName,
      lastName,
      email,
      mobileNumber,
      profileImage || previewImage,
      address,
      country,
      state,
      city,
      gender,
    ];
    const completed = fields.filter((f) => f && String(f).trim() !== "");
    return Math.round((completed.length / fields.length) * 100);
  }, [
    firstName,
    lastName,
    email,
    mobileNumber,
    profileImage,
    previewImage,
    address,
    country,
    state,
    city,
    gender,
  ]);

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    const customerId = localStorage.getItem(customerIdName);
    const token = localStorage.getItem(customerTokenName);

    if (!customerId || !token) {
      showSnackbar(translations.signinwithphone, "warning");
      navigate("/");
      return;
    }

    let isValid = true;
    const fNameErr = validateName(firstName, translations.firstname || "First name");
    const lNameErr = validateName(lastName, translations.lastname || "Last name");
    const mailErr = validateEmailFormat(email);
    const phoneErr = validatePhone(mobileNumber);

    setFirstNameError(fNameErr);
    setLastNameError(lNameErr);
    setEmailError(mailErr);
    setMobileNumberError(phoneErr);

    if (fNameErr || lNameErr || mailErr || phoneErr) {
      isValid = false;
    }

    if (!address.trim()) {
      setAddressError("Delivery address is required");
      isValid = false;
    } else {
      setAddressError("");
    }

    if (!country) {
      setCountryError("Please select your country");
      isValid = false;
    } else {
      setCountryError("");
    }

    if (!state) {
      setStateError("Please select your state");
      isValid = false;
    } else {
      setStateError("");
    }

    if (!city) {
      setCityError("Please select your city");
      isValid = false;
    } else {
      setCityError("");
    }

    if (!isValid) {
      showSnackbar("Please correct the errors in the form before saving.", "warning");
      return;
    }

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("firstName", firstName.trim());
      formData.append("lastName", lastName.trim());
      formData.append("email", email.trim());
      formData.append("mobileNumber", mobileNumber.trim());
      formData.append("address", address.trim());
      if (country) {
        const selectedCountry = countries.find((c) => c.isoCode === country);
        if (selectedCountry) {
          formData.append("countryname", selectedCountry.name);
        }
      }
      if (state) {
        const selectedState = states.find((s) => s.isoCode === state);
        if (selectedState) {
          formData.append("statename", selectedState.name);
        }
      }
      if (city) {
        formData.append("cityname", city);
      }
      formData.append("gender", gender);

      if (selectedImageFile) {
        formData.append("image", selectedImageFile);
      }

      const response = await fetch(
        `${adminPanelBackendPath}/Website/General/UpdateProfile/${customerId}`, {
        method: "PUT",
        headers: { "x-user": "customer", Authorization: `Bearer ${token}`, },
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (response.ok) {
        showSnackbar(data?.message || "Profile updated successfully!", "success");

        if (data?.customer?.profileurl) {
          setProfileImage(data.customer.profileurl);
          setPreviewImage("");
          setSelectedImageFile(null);
        }

        // Notify Navbar and other components to update profile header display
        window.dispatchEvent(
          new CustomEvent("customerAuthChange", {
            detail: {
              isLoggedIn: true,
              customerId: String(customerId),
            },
          })
        );
      } else {
        const errorMsg = data?.message || "Failed to update profile";
        showSnackbar(errorMsg, "error");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showSnackbar("Server error occurred while updating profile", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentDisplayAvatar = previewImage || profileImage;

  if (isLoading) {
    return (
      <div className="profile-page-loading">
        <CircularProgress size={42} sx={{ color: "#028802" }} />
        <p>Loading profile details...</p>
      </div>
    );
  }

  return (
    <div className={`profile-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      <div className="profile-page-container">
        {/* Page Top Header */}
        <header className="profile-page-header">
          <h1 className="profile-page-title">{translations.myaccount || "My Account"}</h1>
        </header>

        {/* Profile Card Layout */}
        <div className="profile-card">
          {/* Card Header Banner */}
          <div className="profile-card-header">
            <div className="profile-header-meta">
              <p className="profile-subtitle">
                Manage your personal details, delivery address, and account preferences.
              </p>
            </div>

            {/* Profile Completion Badge */}
            <div className="profile-completion-badge">
              <div className="completion-ring-wrap">
                <svg className="completion-ring" viewBox="0 0 36 36">
                  <path
                    className="ring-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="ring-progress"
                    strokeDasharray={`${completionPercentage}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="completion-percent">{completionPercentage}%</span>
              </div>
              <div className="completion-text">
                <span className="completion-label">Profile Strength</span>
                <span className="completion-status">
                  {completionPercentage === 100 ? "Complete" : "In Progress"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form" noValidate>
            {/* Avatar Upload Strip */}
            <div className="profile-avatar-section">
              <div className="avatar-preview-box">
                {currentDisplayAvatar ? (
                  <img
                    src={currentDisplayAvatar}
                    alt={`${firstName} ${lastName}`}
                    className="avatar-image"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <PersonOutlineOutlinedIcon />
                  </div>
                )}

                <button
                  type="button"
                  className="avatar-edit-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                >
                  <CameraAltOutlinedIcon fontSize="small" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden-file-input"
                onChange={handleImageChange}
              />

              <div className="avatar-info-text">
                <div className="avatar-actions-row">
                  <button
                    type="button"
                    className="avatar-choose-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CameraAltOutlinedIcon fontSize="small" />
                    <span>Choose Photo</span>
                  </button>
                  {currentDisplayAvatar && (
                    <button
                      type="button"
                      className="avatar-remove-btn"
                      onClick={handleRemoveImage}
                      title="Remove Photo"
                    >
                      <DeleteOutlineIcon fontSize="small" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="avatar-help-note">
                  Recommended: Square JPG, PNG, or WEBP. Max size: 5MB.
                </p>
              </div>
            </div>

            <div className="profile-divider" />

            {/* Form Fields Grid */}
            <div className="profile-fields-grid">
              {/* 1. First Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-first-name">
                  {translations.firstname || "First Name"} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${firstNameError ? "has-error" : ""}`}>
                  <PersonOutlineOutlinedIcon className="field-icon" />
                  <input
                    id="profile-first-name"
                    type="text"
                    className="text-input"
                    placeholder="Enter first name"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (firstNameError) setFirstNameError("");
                    }}
                    onBlur={() =>
                      setFirstNameError(
                        validateName(firstName, translations.firstname || "First name")
                      )
                    }
                  />
                </div>
                {firstNameError && <span className="field-error-msg">{firstNameError}</span>}
              </div>

              {/* 2. Last Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-last-name">
                  {translations.lastname || "Last Name"} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${lastNameError ? "has-error" : ""}`}>
                  <PersonOutlineOutlinedIcon className="field-icon" />
                  <input
                    id="profile-last-name"
                    type="text"
                    className="text-input"
                    placeholder="Enter last name"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (lastNameError) setLastNameError("");
                    }}
                    onBlur={() =>
                      setLastNameError(
                        validateName(lastName, translations.lastname || "Last name")
                      )
                    }
                  />
                </div>
                {lastNameError && <span className="field-error-msg">{lastNameError}</span>}
              </div>

              {/* 3. Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-email">
                  {translations.emailid || "Email Address"} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${emailError ? "has-error" : ""}`}>
                  <EmailOutlinedIcon className="field-icon" />
                  <input
                    id="profile-email"
                    type="email"
                    className="text-input"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) setEmailError("");
                    }}
                    onBlur={() => setEmailError(validateEmailFormat(email))}
                  />
                </div>
                {emailError && <span className="field-error-msg">{emailError}</span>}
              </div>

              {/* 4. Phone Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-phone">
                  {translations.phonenumber || "Phone Number"} <span className="req">*</span>
                </label>
                <div className={`phone-input-wrap ${mobileNumberError ? "has-error" : ""}`}>
                  <PhoneInput
                    id="profile-phone"
                    international
                    defaultCountry="US"
                    value={mobileNumber}
                    onChange={(val) => {
                      setMobileNumber(val || "");
                      if (mobileNumberError) setMobileNumberError("");
                    }}
                    placeholder={translations.entermobilenumber || "Enter phone number"}
                    className="custom-phone-input"
                  />
                </div>
                {mobileNumberError && (
                  <span className="field-error-msg">{mobileNumberError}</span>
                )}
              </div>

              {/* 5. Gender Selection (Full Row or Span) */}
              <div className="form-group span-full">
                <label className="form-label">{translations.gender || "Gender"}</label>
                <div className="gender-options-row">
                  {["Male", "Female", "Other"].map((option) => {
                    const isSelected = gender === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`gender-chip ${isSelected ? "selected" : ""}`}
                        onClick={() => setGender(option)}
                      >
                        <span className="chip-radio-circle">
                          {isSelected && <span className="chip-radio-inner" />}
                        </span>
                        <span>{option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Street Address */}
              <div className="form-group span-full">
                <label className="form-label" htmlFor="profile-address">
                  {translations.address || "Street Address"} <span className="req">*</span>
                </label>
                <div className={`textarea-field-wrap ${addressError ? "has-error" : ""}`}>
                  <HomeOutlinedIcon className="field-icon textarea-icon" />
                  <textarea
                    id="profile-address"
                    rows={3}
                    className="textarea-input"
                    placeholder="Apartment, suite, street address"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (addressError) setAddressError("");
                    }}
                  />
                </div>
                {addressError && <span className="field-error-msg">{addressError}</span>}
              </div>

              {/* 7. Country */}
              <div className="form-group">
                <Dropdown
                  id="profile-country-dropdown"
                  label={translations.country || "Country"}
                  options={countries}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={country}
                  onValueChange={handleCountryChange}
                  placeholder={translations.countryselect || "Select Country"}
                  showSearch={true}
                />
                {countryError && <span className="field-error-msg">{countryError}</span>}
              </div>

              {/* 8. State / Province */}
              <div className="form-group">
                <Dropdown
                  id="profile-state-dropdown"
                  label={translations.state || "State"}
                  options={states}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={state}
                  onValueChange={handleStateChange}
                  placeholder={
                    translations.stateselect ||
                    (country ? "Select State" : "Select Country First")
                  }
                  disabled={!country || states.length === 0}
                  showSearch={true}
                />
                {stateError && <span className="field-error-msg">{stateError}</span>}
              </div>

              {/* 9. City */}
              <div className="form-group">
                <Dropdown
                  id="profile-city-dropdown"
                  label={translations.city || "City"}
                  options={cities}
                  labelKey="name"
                  valueKey="name"
                  selectedValue={city}
                  onValueChange={handleCityChange}
                  placeholder={
                    translations.cityselect ||
                    (state ? "Select City" : "Select State First")
                  }
                  disabled={!state || cities.length === 0}
                  showSearch={true}
                />
                {cityError && <span className="field-error-msg">{cityError}</span>}
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="profile-actions-footer">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => navigate("/")}
                disabled={isUpdating}
              >
                <ArrowBackOutlinedIcon fontSize="small" />
                <span>{translations.cancel || "Cancel"}</span>
              </button>

              <button
                type="submit"
                className="profile-save-btn"
                disabled={isUpdating}
                id="profile-submit-save-btn"
              >
                {isUpdating ? (
                  <>
                    <CircularProgress size={18} color="inherit" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <SaveOutlinedIcon fontSize="small" />
                    <span>{translations.savechanges || "Save Changes"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;