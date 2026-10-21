import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import LanguageDropdown from "./LanguageDropdown.jsx";
import ProfileDropdown from "./ProfileDropdown.jsx";
import BranchDropdown from "./BranchDropdown.jsx";
import "./Navbar.css";

const Navbar = ({ userdomain }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
    { label: "Menu", path: "/menu", icon: <RestaurantMenuIcon fontSize="inherit" /> },
    { label: "Offers", path: "/offers", badge: "Hot", icon: <LocalOfferIcon fontSize="inherit" /> },
    { label: "Book Table", path: "/reservation", icon: <TableRestaurantIcon fontSize="inherit" /> },
  ];

  const brandDisplayName = userdomain
    ? userdomain.charAt(0).toUpperCase() + userdomain.slice(1)
    : "SavoryOps";

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
                Live Kitchen
              </span>
              <span className="nav-top-text">
                ✨ Free Express Delivery on orders over $30 • Use code <strong>FEAST20</strong> for 20% OFF
              </span>
            </div>

            <div className="nav-top-right">
              <a href="tel:+18005553663" className="top-contact-link">
                <PhoneInTalkIcon style={{ fontSize: "0.95rem" }} />
                <span>+1 (800) 555-FOOD</span>
              </a>
            </div>
          </div>
        </div>

        {/* --- Main Navigation Bar --- */}
        <nav className="nav-main">
          {/* Brand Logo & Name */}
          <Link to="/" className="nav-brand-link">
            <img src="/logo.png" alt="SavoryOps Logo" className="nav-brand-logo" />
            <div className="nav-brand-info">
              <span className="nav-brand-name">{brandDisplayName}</span>
            </div>
          </Link>

          {/* Branch Selector Dropdown */}
          <BranchDropdown />

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
          <form className="nav-search-box" onSubmit={handleSearchSubmit}>
            <SearchIcon className="nav-search-icon" />
            <input
              type="text"
              className="nav-search-input"
              placeholder="Search pizza, burgers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Action Buttons: Language, Cart & Profile */}
          <div className="nav-actions">
            <LanguageDropdown />

            <button
              type="button"
              className="nav-cart-btn"
              title="View Cart"
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
                <div className="nav-brand-info">
                  <span className="nav-brand-name">{brandDisplayName}</span>
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
                  <span className="mobile-section-label">Selected Branch</span>
                  <BranchDropdown className="mobile-branch-dropdown" />
                </div>

                <form className="mobile-search-box" onSubmit={handleSearchSubmit}>
                  <SearchIcon className="nav-search-icon" />
                  <input
                    type="text"
                    className="nav-search-input"
                    placeholder="Search dishes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                        <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
                  to="/reservation"
                  className="nav-cta-btn"
                  style={{ justifyContent: "center", width: "100%", display: "flex" }}
                >
                  <TableRestaurantIcon fontSize="small" />
                  <span>Book A Table</span>
                </Link>
                <a
                  href="tel:+18005553663"
                  style={{
                    textAlign: "center",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    paddingTop: "0.5rem",
                  }}
                >
                  📞 Helpline: +1 (800) 555-FOOD
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