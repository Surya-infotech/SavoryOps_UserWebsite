import React, { useState, useEffect, useRef } from "react";
import FlagModule from "react-world-flags";
import CheckIcon from "@mui/icons-material/Check";
import { getLanguageOptions } from "../../constants/languages";

const Flag = typeof FlagModule === "function" ? FlagModule : (FlagModule?.default || FlagModule);

const DEFAULT_LANGUAGE = "English";

const LanguageDropdown = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(
    () => localStorage.getItem("selectedLanguage") || DEFAULT_LANGUAGE
  );
  const dropdownRef = useRef(null);
  const languages = getLanguageOptions();

  const selectedLang =
    languages.find((lang) => lang.name === selectedLanguage) ||
    languages.find((lang) => lang.name === "English") ||
    languages[0];

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

  const handleLanguageSelect = (lang) => {
    setSelectedLanguage(lang.name);
    localStorage.setItem("selectedLanguage", lang.name);
    setIsOpen(false);

    // Dispatch event in case other components listen to language change
    window.dispatchEvent(
      new CustomEvent("languageChange", { detail: { language: lang.name, code: lang.code } })
    );
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
            {languages.map((language) => {
              const isSelected = language.name === selectedLanguage;
              return (
                <li
                  key={language.code}
                  className={`language-menu-item ${isSelected ? "selected" : ""}`}
                  onClick={() => handleLanguageSelect(language)}
                  role="option"
                  aria-selected={isSelected}
                >
                  <span className="lang-flag-container">
                    <Flag code={language.code} className="flag-icon" alt={language.name} />
                  </span>
                  <span className="language-item-name">{language.name}</span>
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