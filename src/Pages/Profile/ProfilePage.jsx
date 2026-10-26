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
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../Partials/UnderMaintenance.jsx";
import { Country, State, City } from "country-state-city";
import Dropdown from "../../Components/Dropdown/Dropdown.jsx";
import Breadcrumbs from "../../Components/Common/Breadcrumbs.jsx";
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
  // Countries list memo
  const countries = useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      name: c.name,
      isoCode: c.isoCode,
    }));
  }, []);

  // States list memo based on country
  const states = useMemo(() => {
    if (!country) return [];
    return State.getStatesOfCountry(country).map((s) => ({
      name: s.name,
      isoCode: s.isoCode,
    }));
  }, [country]);

  // Cities list memo based on country and state
  const cities = useMemo(() => {
    if (!country || !state) return [];
    return City.getCitiesOfState(country, state).map((c) => ({
      name: c.name,
    }));
  }, [country, state]);

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

  // Update document title and cleanup on unmount
  useEffect(() => {
    if (businessDisplayName) {
      document.title = `${translations.myaccount} | ${businessDisplayName}`;
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
                (c) =>
                  c.name.toLowerCase() === data.countryname.toLowerCase() ||
                  c.isoCode.toLowerCase() === data.countryname.toLowerCase()
              );
              if (foundCountry) {
                countryIsoCode = foundCountry.isoCode;
              }
            }

            if (data.statename && countryIsoCode) {
              const countryStates = State.getStatesOfCountry(countryIsoCode);
              const foundState = countryStates.find(
                (s) =>
                  s.name.toLowerCase() === data.statename.toLowerCase() ||
                  s.isoCode.toLowerCase() === data.statename.toLowerCase()
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
        showSnackbar(translations.servererror, "error");
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
      showSnackbar(translations.selectvalidimagefile, "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showSnackbar(translations.imagesizemax5mb, "error");
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
    if (!name || !name.trim()) return `${fieldLabel} ${translations.isrequired}`;
    if (!nameRegex.test(name.trim())) return translations.onlylettersallowed;
    if (name.startsWith(" ")) return translations.firstcharacternotspace;
    return "";
  };

  const validateEmailFormat = (val) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val || !val.trim()) return translations.emailaddressrequired;
    if (!emailRegex.test(val.trim())) return translations.invalidemailformat;
    return "";
  };

  const validatePhone = (val) => {
    if (!val || !String(val).trim()) return translations.phonenumberrequired;
    const cleaned = String(val).replace(/\D/g, "");
    if (cleaned.length < 8) return translations.invalidphoneformat;
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
    const fNameErr = validateName(firstName, translations.firstname);
    const lNameErr = validateName(lastName, translations.lastname);
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
      setAddressError(translations.deliveryaddressrequired);
      isValid = false;
    } else {
      setAddressError("");
    }

    if (!country) {
      setCountryError(translations.pleaseselectcountry);
      isValid = false;
    } else {
      setCountryError("");
    }

    if (!state) {
      setStateError(translations.pleaseselectstate);
      isValid = false;
    } else {
      setStateError("");
    }

    if (!city) {
      setCityError(translations.pleaseselectcity);
      isValid = false;
    } else {
      setCityError("");
    }

    if (!isValid) {
      showSnackbar(translations.correctformerrors, "warning");
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
        showSnackbar(translations.profileupdatedsuccessfully, "success");

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
        showSnackbar(translations.servererror, "error");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showSnackbar(translations.servererror, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const currentDisplayAvatar = previewImage || profileImage;

  if (isLoading) {
    return (
      <div className="profile-page-loading">
        <CircularProgress size={42} sx={{ color: "#028802" }} />
        <p>{translations.loading}</p>
      </div>
    );
  }

  return (
    <div className={`profile-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      <div className="profile-page-container">
        {/* Header Block with Breadcrumbs */}
        <div className="profile-page-header-block">
          <Breadcrumbs currentPage={translations.myaccount || "My Account"} />
          <header className="profile-page-header">
            <div className="profile-page-header-meta">
              <h1 className="profile-page-title">
                {translations.myaccount}
              </h1>
              <p className="profile-page-subtitle">
                {translations.profilesubtitle}
              </p>
            </div>
          </header>
        </div>

        {/* Profile Card Layout */}
        <div className="profile-card">
          {/* Unified Card Header Banner */}
          <div className="profile-card-header">
            <div className="profile-header-main">
              {/* Avatar Preview */}
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

              {/* User Meta & Action */}
              <div className="profile-header-meta">
                <div className="profile-name-row">
                  <h2 className="profile-user-name">
                    {firstName || lastName ? `${firstName} ${lastName}`.trim() : translations.myaccount}
                  </h2>
                  <span className="profile-verified-badge">
                    <VerifiedUserOutlinedIcon fontSize="inherit" />
                    <span>{translations.verifiedcustomer}</span>
                  </span>
                </div>
                {(email || mobileNumber) ? (
                  <p className="profile-subtitle">
                    {email && <span>{email}</span>}
                    {email && mobileNumber && <span className="meta-dot">•</span>}
                    {mobileNumber && <span>{mobileNumber}</span>}
                  </p>
                ) : null}

                <div className="avatar-actions-row">
                  <button
                    type="button"
                    className="avatar-choose-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <CameraAltOutlinedIcon fontSize="small" />
                    <span>{translations.choosephoto}</span>
                  </button>
                  <span className="avatar-help-note">
                    {translations.choosephotohint}
                  </span>
                </div>
              </div>
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
                <span className="completion-label">{translations.profilestrength}</span>
                <span className="completion-status">
                  {completionPercentage === 100 ? translations.complete : translations.inprogress}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form" noValidate autoComplete="off">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/webp"
              className="hidden-file-input"
              onChange={handleImageChange}
            />

            {/* Form Fields Grid */}
            <div className="profile-fields-grid">
              {/* 1. First Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-first-name">
                  {translations.firstname} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${firstNameError ? "has-error" : ""}`}>
                  <PersonOutlineOutlinedIcon className="field-icon" />
                  <input
                    id="profile-first-name"
                    name="profile_first_name_field"
                    type="text"
                    className="text-input"
                    autoComplete="off"
                    placeholder={translations.enterfirstname}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (firstNameError) setFirstNameError("");
                    }}
                    onBlur={() =>
                      setFirstNameError(
                        validateName(firstName, translations.firstname)
                      )
                    }
                  />
                </div>
                {firstNameError && <span className="field-error-msg">{firstNameError}</span>}
              </div>

              {/* 2. Last Name */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-last-name">
                  {translations.lastname} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${lastNameError ? "has-error" : ""}`}>
                  <PersonOutlineOutlinedIcon className="field-icon" />
                  <input
                    id="profile-last-name"
                    name="profile_last_name_field"
                    type="text"
                    className="text-input"
                    autoComplete="off"
                    placeholder={translations.enterlastname}
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (lastNameError) setLastNameError("");
                    }}
                    onBlur={() =>
                      setLastNameError(
                        validateName(lastName, translations.lastname)
                      )
                    }
                  />
                </div>
                {lastNameError && <span className="field-error-msg">{lastNameError}</span>}
              </div>

              {/* 3. Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="profile-email">
                  {translations.emailid} <span className="req">*</span>
                </label>
                <div className={`input-field-wrap ${emailError ? "has-error" : ""}`}>
                  <EmailOutlinedIcon className="field-icon" />
                  <input
                    id="profile-email"
                    name="profile_email_address_field"
                    type="email"
                    className="text-input"
                    autoComplete="off"
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
                  {translations.phonenumber} <span className="req">*</span>
                </label>
                <div className={`phone-input-wrap ${mobileNumberError ? "has-error" : ""}`}>
                  <PhoneInput
                    id="profile-phone"
                    name="profile_phone_number_field"
                    autoComplete="off"
                    numberInputProps={{
                      autoComplete: "off"
                    }}
                    international
                    defaultCountry="US"
                    value={mobileNumber}
                    onChange={(val) => {
                      setMobileNumber(val || "");
                      if (mobileNumberError) setMobileNumberError("");
                    }}
                    placeholder={translations.entermobilenumber}
                    className="custom-phone-input"
                  />
                </div>
                {mobileNumberError && (
                  <span className="field-error-msg">{mobileNumberError}</span>
                )}
              </div>

              {/* 5. Gender Selection (Full Row or Span) */}
              <div className="form-group span-full">
                <label className="form-label">{translations.gender}</label>
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
                        <span>{translations[option.toLowerCase()] || option}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Street Address */}
              <div className="form-group span-full">
                <label className="form-label" htmlFor="profile-address">
                  {translations.address} <span className="req">*</span>
                </label>
                <div className={`textarea-field-wrap ${addressError ? "has-error" : ""}`}>
                  <HomeOutlinedIcon className="field-icon textarea-icon" />
                  <textarea
                    id="profile-address"
                    name="profile_street_address_field"
                    autoComplete="off"
                    rows={3}
                    className="textarea-input"
                    placeholder={translations.enterstreetaddress}
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
                  label={translations.country}
                  required={true}
                  options={countries}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={country}
                  onValueChange={handleCountryChange}
                  placeholder={translations.countryselect}
                  showSearch={true}
                />
                {countryError && <span className="field-error-msg">{countryError}</span>}
              </div>

              {/* 8. State / Province */}
              <div className="form-group">
                <Dropdown
                  id="profile-state-dropdown"
                  label={translations.state}
                  required={true}
                  options={states}
                  labelKey="name"
                  valueKey="isoCode"
                  selectedValue={state}
                  onValueChange={handleStateChange}
                  placeholder={
                    country ? translations.stateselect : translations.selectcountryfirst
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
                  label={translations.city}
                  required={true}
                  options={cities}
                  labelKey="name"
                  valueKey="name"
                  selectedValue={city}
                  onValueChange={handleCityChange}
                  placeholder={
                    state ? translations.cityselect : translations.selectstatefirst
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
                <span>{translations.cancel}</span>
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
                    <span>{translations.saving}</span>
                  </>
                ) : (
                  <>
                    <SaveOutlinedIcon fontSize="small" />
                    <span>{translations.savechanges}</span>
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