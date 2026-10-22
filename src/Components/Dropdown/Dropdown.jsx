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
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const { translations = {}, isRtl } = useLanguage();

  const handleDropdownToggle = () => {
    if (!disabled) {
      setIsDropdownOpen((prev) => !prev);
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

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const selectedDisplayLabel = () => {
    if (selected != null) {
      const found = (options || []).find((item) => {
        const itemVal = typeof item === "object" && item !== null ? item[valueKey] : item;
        return itemVal === selected || String(itemVal) === String(selected);
      });
      if (found) {
        return typeof found === "object" && found !== null ? found[labelKey] : found;
      }
      return selected;
    }
    return placeholder || translations.selectoption;
  };

  return (
    <div className={`dropdown-container ${className}`.trim()}>
      {(label || hint) && (
        <div className="dropdown-label-wrapper">
          {label && (
            <label htmlFor={id} className="dropdown-label">
              {label}
            </label>
          )}
          {hint && <span className="dropdown-hint">{hint}</span>}
        </div>
      )}
      <div
        className={`dropdown ${isRtl ? "rtl-dropdown" : ""}`}
        ref={dropdownRef}
        dir={isRtl ? "rtl" : "ltr"}
      >
        <button
          id={id}
          className="btn dropdown-toggle dropdownbtn"
          type="button"
          onClick={handleDropdownToggle}
          aria-expanded={isDropdownOpen ? "true" : "false"}
          disabled={disabled}
        >
          <span>{selectedDisplayLabel()}</span>
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
                      aria-label="Clear search"
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