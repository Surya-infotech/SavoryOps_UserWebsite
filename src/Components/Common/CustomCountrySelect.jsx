import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import { getCountryCallingCode } from "react-phone-number-input";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import SearchIcon from "@mui/icons-material/Search";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import PublicIcon from "@mui/icons-material/Public";
import "../../Scss/Components/General/customcountryselect.scss";

/**
 * Helper to safely extract calling code without throwing
 */
const safeCallingCode = (countryCode) => {
  if (!countryCode || countryCode === "ZZ") return "";
  try {
    return getCountryCallingCode(countryCode);
  } catch {
    return "";
  }
};

/**
 * Custom Country Select Component for PhoneInput
 * Provides a responsive, searchable dropdown with flags and dial codes for Phone, Tablet, and Laptop screens.
 */
export const CustomCountrySelect = ({
  value,
  options = [],
  onChange,
  iconComponent: Icon,
  disabled = false,
  readOnly = false,
  "aria-label": ariaLabel,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const dropdownMenuRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input when opened
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        clearTimeout(timer);
      };
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Position adjustment to guarantee the menu stays within viewport on any screen resolution (phone, tablet, laptop)
  useEffect(() => {
    if (isOpen && dropdownMenuRef.current) {
      const menu = dropdownMenuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;

      if (rect.right > viewportWidth - 12) {
        const offset = rect.right - (viewportWidth - 12);
        menu.style.left = `-${offset}px`;
      } else if (rect.left < 12) {
        const offset = 12 - rect.left;
        menu.style.left = `${offset}px`;
      }
    }
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value) || options[0];
  }, [options, value]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const query = search.trim().toLowerCase().replace(/^\+/, "");
    return options.filter((opt) => {
      if (!opt.value) {
        return (opt.label || "").toLowerCase().includes(query);
      }
      const label = (opt.label || "").toLowerCase();
      const code = opt.value.toLowerCase();
      const dial = safeCallingCode(opt.value);
      return (
        label.includes(query) ||
        code.includes(query) ||
        dial.includes(query)
      );
    });
  }, [options, search]);

  const handleSelect = (countryValue) => {
    if (onChange) {
      onChange(countryValue === "ZZ" ? undefined : countryValue);
    }
    setIsOpen(false);
    setSearch("");
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter" && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0].value);
    }
  };

  const dialCode = safeCallingCode(selectedOption?.value);

  return (
    <div
      ref={dropdownRef}
      className={`custom-country-select-wrapper ${isOpen ? "open" : ""} ${disabled ? "disabled" : ""} ${className}`}
    >
      <button
        type="button"
        className="custom-country-btn"
        onClick={() => !disabled && !readOnly && setIsOpen((prev) => !prev)}
        disabled={disabled || readOnly}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={ariaLabel || "Select country"}
        title={selectedOption ? `${selectedOption.label} (+${dialCode})` : "Select country"}
      >
        <div className="custom-country-flag-icon">
          {selectedOption?.value && Icon ? (
            <Icon country={selectedOption.value} label={selectedOption.label} />
          ) : (
            <PublicIcon fontSize="inherit" />
          )}
        </div>
        <KeyboardArrowDownIcon className={`custom-country-arrow ${isOpen ? "open" : ""}`} />
      </button>

      {isOpen && (
        <div
          ref={dropdownMenuRef}
          className="custom-country-dropdown-menu"
          role="listbox"
        >
          <div className="custom-country-search-header">
            <div className="custom-country-search-box">
              <SearchIcon className="country-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                className="country-search-input"
                placeholder="Search country or code (+91)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
              />
              {search && (
                <button
                  type="button"
                  className="country-search-clear-btn"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <CloseIcon fontSize="inherit" />
                </button>
              )}
            </div>
          </div>

          <div className="custom-country-list" ref={listRef}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value || (!opt.value && !value);
                const dial = safeCallingCode(opt.value);

                return (
                  <button
                    key={opt.value || "international"}
                    type="button"
                    className={`custom-country-item ${isSelected ? "selected" : ""}`}
                    onClick={() => handleSelect(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="country-item-flag">
                      {opt.value && Icon ? (
                        <Icon country={opt.value} label={opt.label} />
                      ) : (
                        <PublicIcon fontSize="inherit" />
                      )}
                    </div>
                    <span className="country-item-name">{opt.label}</span>
                    {dial && <span className="country-item-code">+{dial}</span>}
                    {isSelected && <CheckIcon className="country-item-check" />}
                  </button>
                );
              })
            ) : (
              <div className="custom-country-empty">
                <span>No countries matching "{search}"</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

CustomCountrySelect.propTypes = {
  value: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
      divider: PropTypes.bool,
    })
  ),
  onChange: PropTypes.func.isRequired,
  iconComponent: PropTypes.elementType,
  disabled: PropTypes.bool,
  readOnly: PropTypes.bool,
  "aria-label": PropTypes.string,
  className: PropTypes.string,
};

export default CustomCountrySelect;