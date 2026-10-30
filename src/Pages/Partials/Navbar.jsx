import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import FlagModule from "react-world-flags";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
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
import { getCartTotalCount } from "../../utils/cartService.js";
import { useWebsiteStatus, getWebsiteSubdomain } from "./UnderMaintenance.jsx";
import { LanguageDropdown } from "./LanguageDropdown.jsx";
export { LanguageDropdown };
import { getLanguageOptions } from "../../constants/languages";
import "../../Scss/Pages/Partials/navbar.scss";

const adminPanelBackendPath = import.meta.env.VITE_BACKEND_URL;
const Flag = typeof FlagModule === "function" ? FlagModule : (FlagModule?.default || FlagModule);

/**
 * Helper to retrieve stored branch or default to first available branch
 */
const getStoredBranch = (branches = []) => {
  if (!Array.isArray(branches) || branches.length === 0) return null;
  const savedId = localStorage.getItem("selectedBranchId");
  if (savedId) {
    const found = branches.find(
      (b) => String(b._id) === String(savedId)
    );
    if (found) return found;
  }
  return branches[0] || null;
};

/* ==========================================================================
   1. BranchDropdown Component
   ========================================================================== */
const BranchDropdown = ({ className = "", onBranchChange }) => {
  const { translations = {} } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (typeof window !== "undefined" && window.__selectedBranch) {
      return window.__selectedBranch;
    }
    return null;
  });
  const dropdownRef = useRef(null);

  // Fetch branches directly via subdomain API
  useEffect(() => {
    const fetchBranches = async () => {
      const currentSubdomain = getWebsiteSubdomain();
      if (!currentSubdomain) return;
      try {
        const res = await fetch(`${adminPanelBackendPath}/Website/Home/GetBranches`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "x-user": "admin", "x-subdomain": currentSubdomain, },
        });
        const data = await res.json();
        if (res.ok && data.success && Array.isArray(data.branches) && data.branches.length > 0) {
          setBranches(data.branches);
          const current = getStoredBranch(data.branches);
          setSelectedBranch(current);
          if (current) {
            const branchId = current._id;
            window.__selectedBranch = current;
            const savedId = localStorage.getItem("selectedBranchId");
            if (!savedId || !data.branches.some(b => String(b._id) === String(savedId))) {
              localStorage.setItem("selectedBranchId", branchId);
            }
            if (typeof onBranchChange === "function") {
              onBranchChange(current);
            }
            window.dispatchEvent(
              new CustomEvent("branchChange", {
                detail: current,
              })
            );
          }
        }
      } catch (err) {
        console.error("Error fetching website branches:", err);
      }
    };

    fetchBranches();
  }, [onBranchChange]);

  // Keep state synchronized if branch changes elsewhere
  useEffect(() => {
    const handleBranchChange = (e) => {
      if (e?.detail) {
        setSelectedBranch(e.detail);
      }
    };

    window.addEventListener("branchChange", handleBranchChange);
    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, []);

  // Allow sibling components (like Footer) to request current branch without refetching API
  useEffect(() => {
    const handleRequestBranch = () => {
      const active = selectedBranch || window.__selectedBranch;
      if (active) {
        window.dispatchEvent(
          new CustomEvent("branchChange", {
            detail: active,
          })
        );
      }
    };

    window.addEventListener("requestBranch", handleRequestBranch);
    return () => {
      window.removeEventListener("requestBranch", handleRequestBranch);
    };
  }, [selectedBranch]);

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
    const branchId = branch._id;
    localStorage.setItem("selectedBranchId", branchId);
    window.__selectedBranch = branch;
    setIsOpen(false);
    setSearch("");

    if (typeof onBranchChange === "function") {
      onBranchChange(branch);
    }

    // Notify other components (HomePage, HomeBanner, Reservation, Footer, etc.) about branch change
    window.dispatchEvent(
      new CustomEvent("branchChange", {
        detail: branch,
      })
    );
  };

  const filteredBranches = branches.filter((branch) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    const name = branch.branchname || "";
    const address = branch.address || "";
    return (
      name.toLowerCase().includes(query) ||
      address.toLowerCase().includes(query)
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
        title={selectedBranch?.branchname || translations.selectbranch}
      >
        <LocationOnIcon className="branch-icon-pin" />
        <span className="branch-active-name">{selectedBranch?.branchname || translations.selectbranch}</span>
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
                <p>
                  {search
                    ? `${translations.nobranchesfound} "${search}"`
                    : translations.nobranchesfound}
                </p>
              </div>
            ) : (
              filteredBranches.map((branch) => {
                const isSelected =
                  String(selectedBranch?._id) ===
                  String(branch._id);
                return (
                  <div
                    key={branch._id}
                    className={`branch-item-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleBranchSelect(branch)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="branch-item-icon-wrapper">
                      <StorefrontIcon fontSize="small" />
                    </div>

                    <div className="branch-item-details">
                      <span className="branch-item-name">{branch.branchname}</span>
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
   2. OrderTypeDropdown Component
   ========================================================================== */
const getOrderTypeNavIcon = (typeName = "") => {
  const lower = String(typeName).toLowerCase().replace(/[\s_\-]+/g, "");
  if (lower.includes("delivery")) return <DeliveryDiningIcon className="order-type-icon-pin" />;
  if (lower.includes("pickup")) return <StorefrontIcon className="order-type-icon-pin" />;
  if (lower.includes("dine")) return <TableRestaurantIcon className="order-type-icon-pin" />;
  return <RestaurantMenuIcon className="order-type-icon-pin" />;
};

export const OrderTypeDropdown = ({ className = "" }) => {
  const { translations = {} } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [orderTypes, setOrderTypes] = useState([]);
  const [selectedOrderType, setSelectedOrderType] = useState(() => {
    return localStorage.getItem("selectedOrderType") || "";
  });
  const dropdownRef = useRef(null);

  const fetchOrderTypes = useCallback(async (explicitBranchId) => {
    const currentSubdomain = getWebsiteSubdomain();
    if (!currentSubdomain) return;

    const branchId =
      explicitBranchId ||
      localStorage.getItem("selectedBranchId") ||
      (typeof window !== "undefined" && window.__selectedBranch?._id);

    if (!branchId) return;

    try {
      const res = await fetch(`${adminPanelBackendPath}/Website/Home/GetBranchSettings/${branchId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-user": "admin",
          "x-subdomain": currentSubdomain,
        },
      });

      const data = await res.json();
      if (res.ok && data.success && data.branchSetting) {
        if (typeof window !== "undefined") {
          window.__branchSetting = data.branchSetting;
          window.__branchHours = data.branchHours || null;
        }
        window.dispatchEvent(
          new CustomEvent("branchSettingChange", {
            detail: data.branchSetting,
          })
        );
        window.dispatchEvent(
          new CustomEvent("branchSettingsLoaded", {
            detail: {
              branchSetting: data.branchSetting,
              branchHours: data.branchHours || null,
            },
          })
        );
        const rawTypes = data.branchSetting.ordertypes;
        if (Array.isArray(rawTypes)) {
          const enabled = rawTypes.filter((t) => t.isEnabled === true);
          setOrderTypes(enabled);

          const saved = localStorage.getItem("selectedOrderType");
          const exists = enabled.some(
            (t) => t.ordertypename.toLowerCase() === (saved || "").toLowerCase()
          );

          if (exists) {
            setSelectedOrderType(saved);
          } else if (enabled.length > 0) {
            const first = enabled[0].ordertypename;
            setSelectedOrderType(first);
            localStorage.setItem("selectedOrderType", first);
            window.dispatchEvent(
              new CustomEvent("orderTypeChange", {
                detail: { orderType: first },
              })
            );
          }
        }
      }
    } catch (err) {
      console.error("Error fetching branch order types in Navbar:", err);
    }
  }, []);

  useEffect(() => {
    fetchOrderTypes();

    const handleBranchChange = (e) => {
      fetchOrderTypes(e?.detail?._id);
    };
    const handleStorage = (e) => {
      if (e.key === "selectedBranchId") {
        fetchOrderTypes(e.newValue);
      } else if (e.key === "selectedOrderType") {
        setSelectedOrderType(e.newValue || "");
      }
    };
    const handleOrderTypeChange = (e) => {
      if (e.detail?.orderType) {
        setSelectedOrderType(e.detail.orderType);
      }
    };

    window.addEventListener("branchChange", handleBranchChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("orderTypeChange", handleOrderTypeChange);

    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("orderTypeChange", handleOrderTypeChange);
    };
  }, [fetchOrderTypes]);

  // Allow all pages (HomePage, HomeMenuShowcase, MenuPage, CartPage) to request current branchSetting from Navbar
  useEffect(() => {
    const handleRequestBranchSetting = () => {
      const setting = typeof window !== "undefined" ? window.__branchSetting : null;
      const hours = typeof window !== "undefined" ? window.__branchHours : null;
      if (setting) {
        window.dispatchEvent(
          new CustomEvent("branchSettingChange", {
            detail: setting,
          })
        );
        window.dispatchEvent(
          new CustomEvent("branchSettingsLoaded", {
            detail: {
              branchSetting: setting,
              branchHours: hours,
            },
          })
        );
      }
    };

    window.addEventListener("requestBranchSetting", handleRequestBranchSetting);
    return () => {
      window.removeEventListener("requestBranchSetting", handleRequestBranchSetting);
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

  const handleSelect = (typeName) => {
    setSelectedOrderType(typeName);
    localStorage.setItem("selectedOrderType", typeName);
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent("orderTypeChange", {
        detail: { orderType: typeName },
      })
    );
  };

  if (orderTypes.length === 0) {
    return null;
  }

  const activeName = selectedOrderType || orderTypes[0]?.ordertypename || "Order Mode";

  return (
    <div
      ref={dropdownRef}
      className={`order-type-dropdown-wrapper ${className} ${isOpen ? "open" : ""}`}
    >
      <button
        type="button"
        className="order-type-trigger-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={`Order Mode: ${activeName}`}
      >
        {getOrderTypeNavIcon(activeName)}
        <span className="order-type-active-name">{activeName}</span>
        <KeyboardArrowDownIcon
          className={`order-type-chevron ${isOpen ? "rotated" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="order-type-dropdown-menu" role="listbox">
          <div className="order-type-list">
            {orderTypes.map((ot) => {
              const isSelected =
                activeName.toLowerCase() === ot.ordertypename.toLowerCase();
              return (
                <button
                  key={ot.ordertypeid || ot.ordertypename}
                  type="button"
                  className={`order-type-menu-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleSelect(ot.ordertypename)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div className="order-type-item-content">
                    <div className="order-type-item-icon">
                      {getOrderTypeNavIcon(ot.ordertypename)}
                    </div>
                    <span className="order-type-item-name">{ot.ordertypename}</span>
                  </div>
                  {isSelected && <CheckIcon className="order-type-check-icon" />}
                </button>
              );
            })}
          </div>
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
  const navigate = useNavigate();
  const { translations = {}, language } = useLanguage();
  const [cartCount, setCartCount] = useState(getCartTotalCount);

  useEffect(() => {
    const handleCartUpdated = () => {
      setCartCount(getCartTotalCount());
    };
    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, []);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (typeof window !== "undefined" && window.__selectedBranch) {
      return window.__selectedBranch;
    }
    return null;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && window.__selectedBranch) {
      setSelectedBranch(window.__selectedBranch);
    }

    const handleBranchChange = (e) => {
      if (e?.detail) {
        setSelectedBranch(e.detail);
      }
    };

    window.addEventListener("branchChange", handleBranchChange);
    window.dispatchEvent(new CustomEvent("requestBranch"));

    return () => {
      window.removeEventListener("branchChange", handleBranchChange);
    };
  }, []);

  const displayPhone = selectedBranch?.phone || "";

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

  const [announcement, setAnnouncement] = useState({
    showAnnouncement: true,
    announcementText: "",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchAnnouncement = async () => {
      const currentSubdomain = getWebsiteSubdomain();
      if (!currentSubdomain) return;
      try {
        const res = await fetch(`${adminPanelBackendPath}/Website/General/GetAnnouncement`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user": "admin",
            "x-subdomain": currentSubdomain,
          },
        });
        const data = await res.json();
        if (isMounted && res.ok && data.success && data.announcement) {
          setAnnouncement({
            showAnnouncement: data.announcement.showAnnouncement !== undefined ? Boolean(data.announcement.showAnnouncement) : true,
            announcementText: data.announcement.announcementText || "",
          });
        }
      } catch (err) {
        console.error("Error fetching announcement setting:", err);
      }
    };

    fetchAnnouncement();
    return () => {
      isMounted = false;
    };
  }, []);

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
        {(announcement.showAnnouncement || displayPhone) && (
          <div className="nav-top-bar">
            <div className="nav-top-inner">
              <div className="nav-top-left">
                <span className="top-badge">
                  <span className="live-dot"></span>
                  {translations.livekitchen}
                </span>
                {announcement.showAnnouncement && (
                  <span className="nav-top-text">
                    {announcement.announcementText}
                  </span>
                )}
              </div>

              {displayPhone && (
                <div className="nav-top-right">
                  <a href={`tel:${displayPhone}`} className="top-contact-link">
                    <PhoneInTalkIcon />
                    <span>{displayPhone}</span>
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

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
              <div className="nav-brand-selectors">
                <BranchDropdown onBranchChange={setSelectedBranch} />
                <OrderTypeDropdown />
              </div>
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
              title={translations.cart || "Cart"}
              onClick={() => navigate("/cart")}
              aria-label={translations.cart || "Cart"}
            >
              <ShoppingBagOutlinedIcon fontSize="small" />
              {cartCount > 0 && <span className="cart-count-badge">{cartCount}</span>}
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
                  <BranchDropdown className="mobile-branch-dropdown" onBranchChange={setSelectedBranch} />
                </div>
                <div className="mobile-ordertype-section">
                  <span className="mobile-section-label">{translations.ordertype || "Order Type"}</span>
                  <OrderTypeDropdown className="mobile-ordertype-dropdown" />
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
                {displayPhone && (
                  <a
                    href={`tel:${displayPhone}`}
                    className="mobile-helpline-link"
                  >
                    📞 {translations.helpline}: {displayPhone}
                  </a>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
};

export default Navbar;