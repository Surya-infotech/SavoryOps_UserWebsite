import { useState, useEffect, useRef } from "react";
import FlagModule from "react-world-flags";
import CheckIcon from "@mui/icons-material/Check";
import { useLanguage } from "../../Context/useLanguage.js";
import { getLanguageOptions } from "../../constants/languages";

const Flag = typeof FlagModule === "function" ? FlagModule : (FlagModule?.default || FlagModule);

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

export default LanguageDropdown;