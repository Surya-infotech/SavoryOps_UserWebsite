import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FlagModule from "react-world-flags";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LocationOnOutlinedIcon from "@mui/icons-material/LocationOnOutlined";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "./UnderMaintenance.jsx";
import { DEFAULT_BRANCHES, getStoredBranch } from "../../constants/branches";
import { getLanguageOptions } from "../../constants/languages";
import "../../Scss/Pages/Partials/navbar.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const Flag = typeof FlagModule === "function" ? FlagModule : (FlagModule?.default || FlagModule);

/* ==========================================================================
   1. BranchDropdown Component
   ========================================================================== */
export const BranchDropdown = ({ className = "" }) => {
  const { translations = {} } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const dropdownRef = useRef(null);

  // Fetch branches directly via subdomain API
  useEffect(() => {
    const fetchBranches = async () => {
      const currentSubdomain = getWebsiteSubdomain();
      if (!currentSubdomain) return;
      try {
        const res = await fetch(`${adminPanelBackendPath}/Website/Home/GetBranches`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
            "x-subdomain": currentSubdomain,
          },
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
          const current = getStoredBranch(data.branches);
          setSelectedBranch(current);
          if (current) {
            const branchId = current.id || current.branchid;
            const branchName = current.name || current.branchname;
            const savedId = localStorage.getItem("selectedBranchId");
            if (!savedId || !data.branches.some(b => String(b.id || b.branchid) === String(savedId))) {
              localStorage.setItem("selectedBranchId", branchId);
              localStorage.setItem("selectedBranchName", branchName);
              window.dispatchEvent(
                new CustomEvent("branchChange", {
                  detail: current,
                })
              );
            }
          }
        }
      } catch (err) {
        console.error("Error fetching website branches:", err);
      }
    };

    fetchBranches();
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    const branchId = branch.id || branch.branchid;
    const branchName = branch.name || branch.branchname;
    localStorage.setItem("selectedBranchId", branchId);
    localStorage.setItem("selectedBranchName", branchName);
    setIsOpen(false);
    setSearch("");

    // Notify other components (HomePage, HomeBanner, Reservation, etc.) about branch change
    window.dispatchEvent(
      new CustomEvent("branchChange", {
        detail: branch,
      })
    );
  };

  const filteredBranches = branches.filter((branch) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      branch.name.toLowerCase().includes(query) ||
      (branch.address && branch.address.toLowerCase().includes(query)) ||
      (branch.tagline && branch.tagline.toLowerCase().includes(query))
    );
  });

  return (
    <div
      ref={dropdownRef}
      className={`branch-dropdown-wrapper ${className} ${isOpen ? "open" : ""}`}
    >
      <button
        type="button"
        className="branch-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={selectedBranch?.name || translations.selectbranch}
      >
        <LocationOnIcon className="branch-icon-pin" />
        <span className="branch-active-name">{selectedBranch?.name || translations.selectbranch}</span>
        <KeyboardArrowDownIcon
          className={`branch-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="branch-dropdown-menu" role="listbox">
          <div className="branch-menu-header">
            <div className="branch-menu-header-text">
              <span className="branch-menu-title">{translations.selectbranch}</span>
              <span className="branch-menu-subtitle">
                {branches.length} available {branches.length === 1 ? translations.branch : translations.branches}
              </span>
            </div>
          </div>

          <div className="branch-search-container">
            <SearchIcon className="branch-search-icon" fontSize="small" />
            <input
              type="text"
              className="branch-search-input"
              placeholder={translations.searchbranchname}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="branch-list-scroller">
            {filteredBranches.length === 0 ? (
              <div className="branch-empty-state">
                <p>{translations.nobranchesfound} "{search}"</p>
              </div>
            ) : (
              filteredBranches.map((branch) => {
                const isSelected =
                  String(selectedBranch?.id) === String(branch.id) ||
                  String(selectedBranch?.branchid) === String(branch.branchid);
                return (
                  <div
                    key={branch.id || branch.branchid}
                    className={`branch-item-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleBranchSelect(branch)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="branch-item-icon-wrapper">
                      <StorefrontIcon fontSize="small" />
                    </div>

                    <div className="branch-item-details">
                      <span className="branch-item-name">{branch.name}</span>
                      {branch.address && (
                        <span className="branch-item-address">{branch.address}</span>
                      )}
                    </div>

                    {isSelected && (
                      <div className="branch-item-check">
                        <CheckIcon fontSize="small" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   2. LanguageDropdown Component
   ========================================================================== */
export const LanguageDropdown = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, changeLanguage } = useLanguage();
  const dropdownRef = useRef(null);
  const languages = getLanguageOptions();

  const currentLanguage = language || localStorage.getItem("selectedLanguage") || "English";

  const selectedLang =
    languages.find((lang) => lang.name.toLowerCase() === currentLanguage.toLowerCase()) ||
    languages.find((lang) => lang.name === "English") ||
    languages[0];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        !event.target.closest?.(".language-dropdown-wrapper")
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageSelect = (lang) => {
    if (!lang || !lang.name) return;
    changeLanguage(lang.name);
    setIsOpen(false);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("closeMobileMenu"));
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`language-dropdown-wrapper ${className} ${isOpen ? "open" : ""}`}
    >
      <button
        type="button"
        className="language-dropdown-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`Selected Language: ${selectedLang?.name}`}
      >
        <span className="lang-flag-container">
          <Flag code={selectedLang?.code} className="flag-icon" alt={selectedLang?.name} />
        </span>
        <span className="lang-name-label">{selectedLang?.name.substring(0, 3)}</span>
      </button>

      {isOpen && (
        <div className="language-dropdown-menu" role="listbox">
          <ul className="language-menu-list">
            {languages.map((item) => {
              const isSelected = item.name.toLowerCase() === currentLanguage.toLowerCase();
              return (
                <li
                  key={item.code}
                  className={`language-menu-item ${isSelected ? "selected" : ""}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleLanguageSelect(item);
                  }}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="lang-flag-container">
                    <Flag code={item.code} className="flag-icon" alt={item.name} />
                  </span>
                  <span className="language-item-name">{item.name}</span>
                  {isSelected && <CheckIcon className="language-item-check" />}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};

const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
const customerIdName = import.meta.env.VITE_CUSTOMERID_NAME;

/* ==========================================================================
   3. ProfileDropdown Component
   ========================================================================== */
export const ProfileDropdown = ({ className = "" }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [customerDetails, setCustomerDetails] = useState(null);
  const { showSnackbar } = useSnackbar();
  const { translations = {} } = useLanguage();

  // Customer Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem(customerTokenName);
    const customerId = localStorage.getItem(customerIdName);
    return Boolean(token || customerId);
  });

  const fetchCustomerDetails = async (customerId, token) => {
    if (!customerId || !adminPanelBackendPath) return;

    try {
      const response = await fetch(`${adminPanelBackendPath}/Website/General/GetCustomerDetails/${customerId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user": "customer",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data) {
          setCustomerDetails(data);
          setIsLoggedIn(true);
        }
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(customerTokenName);
    const customerId = localStorage.getItem(customerIdName);
    if (customerId) {
      fetchCustomerDetails(customerId, token);
    }

    const handleAuthChange = (event) => {
      const detail = event?.detail;
      if (detail?.isLoggedIn && detail?.customerId) {
        const currentToken = localStorage.getItem(customerTokenName);
        setIsLoggedIn(true);
        fetchCustomerDetails(detail.customerId, currentToken);
      } else {
        setCustomerDetails(null);
        setIsOpen(false);
        setIsLoggedIn(false);
      }
    };

    window.addEventListener("customerAuthChange", handleAuthChange);
    return () => {
      window.removeEventListener("customerAuthChange", handleAuthChange);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = () => {
    localStorage.removeItem(customerTokenName);
    localStorage.removeItem(customerIdName);
    setCustomerDetails(null);
    setIsOpen(false);
    setIsLoggedIn(false);

    showSnackbar(translations.signedoutsuccessfully, "success");

    window.dispatchEvent(
      new CustomEvent("customerAuthChange", {
        detail: { isLoggedIn: false },
      })
    );

    navigate("/");
  };

  const fullName = customerDetails
    ? `${customerDetails.customerfirstname || ""} ${customerDetails.customerlastname || ""}`.trim()
    : "";

  const displayName = isLoggedIn
    ? (fullName || translations.myaccount)
    : translations.guestuser;

  const displaySubtitle = isLoggedIn
    ? (customerDetails?.phone || "")
    : translations.signinwithphone;

  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [customerDetails?.profileurl]);

  return (
    <div
      ref={dropdownRef}
      className={`profile-dropdown-wrapper ${className} ${isOpen ? "open" : ""}`}
    >
      <button
        type="button"
        className={`nav-profile-btn ${isOpen ? "active" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        title={displayName}
      >
        {isLoggedIn && customerDetails?.profileurl && !imgError ? (
          <img
            src={customerDetails.profileurl}
            alt={displayName}
            className="nav-profile-avatar-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <PersonOutlinedIcon className="nav-profile-icon" />
        )}
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu" role="menu">
          {/* User Info Header - Clickable to open Customer Profile page */}
          {isLoggedIn ? (
            <Link
              to="/profile"
              className="profile-menu-header clickable"
              onClick={() => setIsOpen(false)}
              id="profile-dropdown-header-btn"
              title={translations.myaccount}
            >
              <div className="profile-avatar">
                {customerDetails?.profileurl ? (
                  <img
                    src={customerDetails.profileurl}
                    alt={displayName}
                    className="profile-avatar-img"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                ) : (
                  <PersonOutlinedIcon />
                )}
              </div>
              <div className="profile-user-details">
                <span className="profile-name">{displayName}</span>
                <span className="profile-subtitle">{displaySubtitle}</span>
              </div>
              <ChevronRightIcon className="profile-header-arrow" />
            </Link>
          ) : (
            <div className="profile-menu-header">
              <div className="profile-avatar">
                <PersonOutlinedIcon />
              </div>
              <div className="profile-user-details">
                <span className="profile-name">{displayName}</span>
                <span className="profile-subtitle">{displaySubtitle}</span>
              </div>
            </div>
          )}

          {isLoggedIn && (
            <>
              <div className="profile-menu-divider" />

              {/* Quick Nav Links */}
              <div className="profile-menu-links">
                <Link
                  to="/orders"
                  className="profile-menu-item"
                  onClick={() => setIsOpen(false)}
                >
                  <ReceiptLongOutlinedIcon fontSize="small" />
                  <span>{translations.orders}</span>
                </Link>

                <Link
                  to="/reservation"
                  className="profile-menu-item"
                  onClick={() => setIsOpen(false)}
                >
                  <TableRestaurantIcon fontSize="small" />
                  <span>{translations.tablereservation}</span>
                </Link>

                <Link
                  to="/manage-address"
                  className="profile-menu-item"
                  onClick={() => setIsOpen(false)}
                >
                  <LocationOnOutlinedIcon fontSize="small" />
                  <span>{translations.manageaddress}</span>
                </Link>

                <Link
                  to="/my-reviews"
                  className="profile-menu-item"
                  onClick={() => setIsOpen(false)}
                >
                  <RateReviewOutlinedIcon fontSize="small" />
                  <span>{translations.myreviews}</span>
                </Link>

                <Link
                  to="/settings"
                  className="profile-menu-item"
                  onClick={() => setIsOpen(false)}
                >
                  <SettingsOutlinedIcon fontSize="small" />
                  <span>{translations.settings}</span>
                </Link>
              </div>
            </>
          )}

          <div className="profile-menu-divider" />

          {/* Action Button */}
          <div className="profile-menu-footer">
            {isLoggedIn ? (
              <button
                type="button"
                className="profile-action-btn logout"
                onClick={handleSignOut}
              >
                <LogoutIcon fontSize="small" />
                <span>{translations.logout}</span>
              </button>
            ) : (
              <Link
                to="/signin"
                className="profile-action-btn login"
                onClick={() => setIsOpen(false)}
                id="nav-profile-signin-link"
              >
                <LoginIcon fontSize="small" />
                <span>{translations.signinwithphone}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   4. Main Navbar Component
   ========================================================================== */
const Navbar = () => {
  const { translations = {}, language } = useLanguage();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  // Close mobile drawer whenever language or route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [language, location.pathname]);

  // Listen to close event and handle desktop resize
  useEffect(() => {
    const handleClose = () => setMobileMenuOpen(false);
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("closeMobileMenu", handleClose);
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("closeMobileMenu", handleClose);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Scroll listener for elevation
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 25) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: translations.menu, path: "/menu", icon: <RestaurantMenuIcon fontSize="inherit" /> },
    { label: translations.offers, path: "/offers", badge: "Hot", icon: <LocalOfferIcon fontSize="inherit" /> },
    { label: translations.booktable, path: "/reservation", icon: <TableRestaurantIcon fontSize="inherit" /> },
  ];

  const { business } = useWebsiteStatus();
  const brandDisplayName = business?.businessname;
  const brandLogoUrl = business?.imageUrl;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      alert(`Searching dishes for: "${searchQuery}"`);
    }
  };

  return (
    <>
      <header className={`savory-navbar-wrapper ${isScrolled ? "scrolled" : ""}`}>
        {/* --- Top Utility Bar --- */}
        <div className="nav-top-bar">
          <div className="nav-top-inner">
            <div className="nav-top-left">
              <span className="top-badge">
                <span className="live-dot"></span>
                {translations.livekitchen}
              </span>
              <span className="nav-top-text">
                {translations.navpromo}
              </span>
            </div>

            <div className="nav-top-right">
              <a href="tel:+18005553663" className="top-contact-link">
                <PhoneInTalkIcon />
                <span>+1 (800) 555-FOOD</span>
              </a>
            </div>
          </div>
        </div>

        {/* --- Main Navigation Bar --- */}
        <nav className="nav-main">
          {/* Brand & Branch Section */}
          <div className="nav-brand-group">
            <Link to="/" className="nav-brand-link" title={brandDisplayName}>
              <img
                src={brandLogoUrl}
                alt={brandDisplayName}
                className="nav-brand-logo"
              />
            </Link>

            <div className="nav-brand-info">
              <Link to="/" className="nav-brand-name-link">
                <span className="nav-brand-name">{brandDisplayName}</span>
              </Link>
              <BranchDropdown />
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="nav-links-container">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.label}
                  to={link.path}
                  className={`nav-link-item ${isActive ? "active" : ""}`}
                >
                  {link.label}
                  {link.badge && <span className="nav-badge-pill">{link.badge}</span>}
                </Link>
              );
            })}
          </div>

          {/* Quick Food Search */}
          <form className="nav-search-box" onSubmit={handleSearchSubmit} autoComplete="off">
            <SearchIcon className="nav-search-icon" />
            <input
              type="text"
              className="nav-search-input"
              placeholder={translations.searchdishes}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoComplete="off"
            />
          </form>

          {/* Action Buttons: Language, Cart & Profile */}
          <div className="nav-actions">
            <LanguageDropdown />

            <button
              type="button"
              className="nav-cart-btn"
              title={translations.cart}
              onClick={() => alert("Cart: 2 delicious items ready for checkout!")}
            >
              <ShoppingBagOutlinedIcon fontSize="small" />
              <span className="cart-count-badge">2</span>
            </button>

            <ProfileDropdown />

            <button
              type="button"
              className="nav-mobile-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
            >
              <MenuIcon />
            </button>
          </div>
        </nav>
      </header>

      {/* --- Mobile Drawer Navigation (Rendered in Body Portal) --- */}
      {typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              className={`mobile-drawer-overlay ${mobileMenuOpen ? "open" : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className={`mobile-drawer ${mobileMenuOpen ? "open" : ""}`}>
              <div className="mobile-drawer-header">
                <div className="nav-brand-group mobile-brand-group">
                  <img
                    src={brandLogoUrl}
                    alt={brandDisplayName}
                    className="nav-brand-logo mobile-logo"
                  />
                  <div className="nav-brand-info">
                    <span className="nav-brand-name">{brandDisplayName}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="mobile-drawer-close"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>

              <div className="mobile-drawer-content">
                {/* Mobile Branch Selector */}
                <div className="mobile-branch-section">
                  <span className="mobile-section-label">{translations.selectbranch}</span>
                  <BranchDropdown className="mobile-branch-dropdown" />
                </div>

                <form className="mobile-search-box" onSubmit={handleSearchSubmit} autoComplete="off">
                  <SearchIcon className="nav-search-icon" />
                  <input
                    type="text"
                    className="nav-search-input"
                    placeholder={translations.searchdishes}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoComplete="off"
                  />
                </form>

                <div className="mobile-nav-links">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.label}
                        to={link.path}
                        className={`mobile-nav-item ${isActive ? "active" : ""}`}
                      >
                        <span className="mobile-nav-link-content">
                          {link.icon}
                          {link.label}
                        </span>
                        {link.badge && <span className="nav-badge-pill">{link.badge}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>

              <div className="mobile-drawer-footer">
                <Link
                  to="/signin"
                  className="nav-cta-btn mobile-signin-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  id="mobile-drawer-signin-btn"
                >
                  <LoginIcon fontSize="small" />
                  <span>{localStorage.getItem("savoryopscustomer_token") ? translations.myaccount : translations.signinwithphone}</span>
                </Link>
                <Link
                  to="/reservation"
                  className="nav-cta-btn mobile-book-btn"
                >
                  <TableRestaurantIcon fontSize="small" />
                  <span>{translations.booktable}</span>
                </Link>
                <a
                  href="tel:+18005553663"
                  className="mobile-helpline-link"
                >
                  📞 {translations.helpline}: +1 (800) 555-FOOD
                </a>
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};

export default Navbar;