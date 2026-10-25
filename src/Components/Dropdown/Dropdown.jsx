import { useEffect, useRef, useState } from "react";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Components/General/dropdown.scss";

/**
 * Dropdown Component with polished fixed search header
 */
const Dropdown = ({
  selectedValue,
  onValueChange,
  label,
  required = false,
  hint,
  options = [],
  labelKey = "label",
  valueKey = "value",
  placeholder,
  disabled = false,
  showSearch = true,
  className = "",
  id,
}) => {
  const [selected, setSelected] = useState(selectedValue || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [openUpward, setOpenUpward] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const { translations = {}, isRtl } = useLanguage();

  const instanceId = useRef(id || `dropdown-${Math.random().toString(36).substr(2, 9)}`).current;

  // Ensure only one dropdown is open at any time across the app
  useEffect(() => {
    const handleCloseOthers = (e) => {
      if (e.detail?.id !== instanceId) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener("close-other-dropdowns", handleCloseOthers);
    return () => {
      window.removeEventListener("close-other-dropdowns", handleCloseOthers);
    };
  }, [instanceId]);

  const handleDropdownToggle = () => {
    if (!disabled) {
      if (!isDropdownOpen) {
        // Broadcast to immediately close all other dropdowns
        window.dispatchEvent(
          new CustomEvent("close-other-dropdowns", { detail: { id: instanceId } })
        );
        if (dropdownRef.current) {
          const rect = dropdownRef.current.getBoundingClientRect();
          const spaceBelow = window.innerHeight - rect.bottom;
          const spaceAbove = rect.top;
          if (spaceBelow < 280 && spaceAbove > spaceBelow) {
            setOpenUpward(true);
          } else {
            setOpenUpward(false);
          }
        }
        setIsDropdownOpen(true);
      } else {
        setIsDropdownOpen(false);
      }
    }
  };

  const handleSelect = (item) => {
    const val = typeof item === "object" && item !== null ? item[valueKey] : item;
    setSelected(val);
    if (onValueChange) {
      onValueChange(val);
    }
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    setSelected(selectedValue);
  }, [selectedValue]);

  useEffect(() => {
    if (!isDropdownOpen) {
      setSearchTerm("");
      setOpenUpward(false);
    } else if (showSearch) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDropdownOpen, showSearch]);

  const filteredOptions = (options || []).filter((item) => {
    const val = typeof item === "object" && item !== null ? item[labelKey] : item;
    return val ? String(val).toLowerCase().includes(searchTerm.toLowerCase()) : false;
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const isSelectedValid = selected != null && String(selected).trim() !== "";

  let displayLabel = placeholder || translations.selectoption || "";
  let isPlaceholder = true;

  if (isSelectedValid) {
    const found = (options || []).find((item) => {
      const itemVal = typeof item === "object" && item !== null ? item[valueKey] : item;
      return itemVal === selected || String(itemVal) === String(selected);
    });

    if (found) {
      displayLabel = typeof found === "object" && found !== null ? found[labelKey] : found;
      isPlaceholder = false;
    } else if (valueKey === labelKey && selected) {
      displayLabel = selected;
      isPlaceholder = false;
    } else {
      displayLabel = placeholder || translations.selectoption || selected;
      isPlaceholder = displayLabel === placeholder || displayLabel === translations.selectoption;
    }
  }

  return (
    <div className={`dropdown-container ${className}`.trim()}>
      {(label || hint) && (
        <div className="dropdown-label-wrapper">
          {label && (
            <label htmlFor={id} className="dropdown-label">
              {label} {required && <span className="req">*</span>}
            </label>
          )}
          {hint && <span className="dropdown-hint">{hint}</span>}
        </div>
      )}
      <div
        className={`dropdown ${isRtl ? "rtl-dropdown" : ""} ${
          isDropdownOpen ? "open is-open" : ""
        } ${openUpward ? "dropup open-upward" : ""}`}
        ref={dropdownRef}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <button
          id={id}
          className={`btn dropdown-toggle dropdownbtn ${isPlaceholder ? "has-placeholder" : ""} ${isDropdownOpen ? "is-open" : ""}`}
          type="button"
          onClick={handleDropdownToggle}
          aria-expanded={isDropdownOpen ? "true" : "false"}
          disabled={disabled}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <span className={`dropdown-selected-label ${isPlaceholder ? "placeholder-text" : ""}`}>
            {displayLabel}
          </span>
          {isDropdownOpen ? (
            <KeyboardArrowUpIcon className="dropdown-icon" />
          ) : (
            <KeyboardArrowDownIcon className="dropdown-icon" />
          )}
        </button>

        {isDropdownOpen && (
          <div
            className={`dropdown-menu dropdown-menu-panel dropdownul ${
              isRtl ? "rtl-dropdownul" : ""
            }`}
            dir={isRtl ? "rtl" : "ltr"}
            aria-labelledby={id || "dropdownMenuButton"}
          >
            {/* Dedicated Fixed Search Bar Header */}
            {showSearch && (
              <div className="dropdown-search-wrapper" onClick={(e) => e.stopPropagation()}>
                <div className="dropdown-search-box">
                  <SearchIcon className="dropdown-search-icon" fontSize="small" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    className="dropdown-search-input"
                    placeholder={translations.search}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoComplete="off"
                    dir={isRtl ? "rtl" : "ltr"}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="dropdown-search-clear-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSearchTerm("");
                        searchInputRef.current?.focus();
                      }}
                      aria-label={translations.clearsearch}
                    >
                      <CloseIcon className="dropdown-clear-icon" fontSize="inherit" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Items List */}
            <ul className="dropdown-items-list" role="listbox">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((item, index) => {
                  const itemVal =
                    typeof item === "object" && item !== null ? item[valueKey] : item;
                  const itemLbl =
                    typeof item === "object" && item !== null ? item[labelKey] : item;
                  const isSelected =
                    selected === itemVal ||
                    (selected != null && String(selected) === String(itemVal));

                  return (
                    <li key={index} role="presentation">
                      <a
                        className={`dropdown-item ${isSelected ? "selected" : ""}`}
                        title={String(itemLbl)}
                        onClick={() => handleSelect(item)}
                        role="option"
                        aria-selected={isSelected}
                      >
                        {itemLbl}
                      </a>
                    </li>
                  );
                })
              ) : (
                <li className="dropdown-no-record">{translations.norecordfound}</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dropdown;