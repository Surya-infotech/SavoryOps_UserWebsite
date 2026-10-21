import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import PhoneInTalkIcon from "@mui/icons-material/PhoneInTalk";
import LoginIcon from "@mui/icons-material/Login";

const ProfileDropdown = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Check if a customer name is saved in storage (or default to Guest)
  const customerName = localStorage.getItem("customer_name") || "Guest User";
  const customerEmail = localStorage.getItem("customer_email") || "Sign in for orders & rewards";
  const isLoggedIn = Boolean(localStorage.getItem("customer_name"));

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
    localStorage.removeItem("customer_name");
    localStorage.removeItem("customer_email");
    setIsOpen(false);
    window.location.reload();
  };

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
        title="Account & Profile"
      >
        <PersonOutlinedIcon className="nav-profile-icon" />
      </button>

      {isOpen && (
        <div className="profile-dropdown-menu" role="menu">
          {/* User Info Header */}
          <div className="profile-menu-header">
            <div className="profile-avatar">
              <PersonOutlinedIcon />
            </div>
            <div className="profile-user-details">
              <span className="profile-name">{customerName}</span>
              <span className="profile-subtitle">{customerEmail}</span>
            </div>
          </div>

          <div className="profile-menu-divider" />

          {/* Quick Nav Links */}
          <div className="profile-menu-links">
            <Link
              to="/menu"
              className="profile-menu-item"
              onClick={() => setIsOpen(false)}
            >
              <RestaurantMenuIcon fontSize="small" />
              <span>Explore Menu</span>
            </Link>

            <Link
              to="/reservation"
              className="profile-menu-item"
              onClick={() => setIsOpen(false)}
            >
              <TableRestaurantIcon fontSize="small" />
              <span>Table Reservations</span>
            </Link>

            <Link
              to="/offers"
              className="profile-menu-item"
              onClick={() => setIsOpen(false)}
            >
              <LocalOfferIcon fontSize="small" />
              <span>Special Offers & Deals</span>
            </Link>

            <Link
              to="/contact"
              className="profile-menu-item"
              onClick={() => setIsOpen(false)}
            >
              <PhoneInTalkIcon fontSize="small" />
              <span>Customer Helpline</span>
            </Link>
          </div>

          <div className="profile-menu-divider" />

          {/* Action Button */}
          <div className="profile-menu-footer">
            {isLoggedIn ? (
              <button
                type="button"
                className="profile-action-btn logout"
                onClick={handleSignOut}
              >
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                type="button"
                className="profile-action-btn login"
                onClick={() => {
                  setIsOpen(false);
                  const name = prompt("Enter your name to sign in as guest:");
                  if (name && name.trim()) {
                    localStorage.setItem("customer_name", name.trim());
                    localStorage.setItem(
                      "customer_email",
                      `${name.toLowerCase().replace(/\s+/g, "")}@example.com`
                    );
                    window.location.reload();
                  }
                }}
              >
                <LoginIcon fontSize="small" />
                <span>Sign In / Join</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
