import React, { useState, useEffect, useRef } from "react";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import { DEFAULT_BRANCHES, getStoredBranch } from "../../constants/branches";

const BranchDropdown = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [branches, setBranches] = useState(DEFAULT_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState(() => getStoredBranch(DEFAULT_BRANCHES));
  const dropdownRef = useRef(null);

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
    localStorage.setItem("selectedBranchId", branch.id);
    localStorage.setItem("selectedBranchName", branch.name);
    setIsOpen(false);
    setSearch("");

    // Notify other components (HomePage, Reservation, etc.) about branch change
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
        title={`Current Branch: ${selectedBranch?.name}`}
      >
        <span className="branch-icon-pin">
          <LocationOnIcon fontSize="small" />
        </span>
        <div className="branch-text-block">
          <span className="branch-caption">Branch</span>
          <span className="branch-active-name">{selectedBranch?.name || "Select Branch"}</span>
        </div>
        <KeyboardArrowDownIcon
          className={`branch-chevron ${isOpen ? "rotated" : ""}`}
          fontSize="small"
        />
      </button>

      {isOpen && (
        <div className="branch-dropdown-menu" role="listbox">
          <div className="branch-menu-header">
            <div className="branch-menu-header-text">
              <span className="branch-menu-title">Select Location</span>
              <span className="branch-menu-subtitle">
                {branches.length} available {branches.length === 1 ? "branch" : "branches"}
              </span>
            </div>
          </div>

          <div className="branch-search-container">
            <SearchIcon className="branch-search-icon" fontSize="small" />
            <input
              type="text"
              className="branch-search-input"
              placeholder="Search branch or area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div className="branch-list-scroller">
            {filteredBranches.length === 0 ? (
              <div className="branch-empty-state">
                <p>No branches found matching "{search}"</p>
              </div>
            ) : (
              filteredBranches.map((branch) => {
                const isSelected = selectedBranch?.id === branch.id;
                return (
                  <div
                    key={branch.id}
                    className={`branch-item-card ${isSelected ? "selected" : ""}`}
                    onClick={() => handleBranchSelect(branch)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="branch-item-icon-wrapper">
                      <StorefrontIcon fontSize="small" />
                    </div>

                    <div className="branch-item-details">
                      <div className="branch-item-name-row">
                        <span className="branch-item-name">{branch.name}</span>
                        {branch.status && (
                          <span className="branch-item-status-pill">{branch.status}</span>
                        )}
                      </div>
                      {branch.address && (
                        <span className="branch-item-address">{branch.address}</span>
                      )}
                      {branch.timing && (
                        <div className="branch-item-timing">
                          <AccessTimeIcon style={{ fontSize: "0.75rem" }} />
                          <span>{branch.timing}</span>
                        </div>
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

export default BranchDropdown;
