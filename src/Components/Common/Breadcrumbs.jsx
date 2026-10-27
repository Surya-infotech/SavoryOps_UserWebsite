import { Link } from "react-router-dom";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Components/breadcrumbs.scss";

/**
 * Reusable Breadcrumbs Component
 *
 * Usage:
 * <Breadcrumbs currentPage="About Us" />
 *
 * OR
 *
 * <Breadcrumbs
 *   items={[
 *     { label: "Home", path: "/" },
 *     { label: "Settings", path: "/settings" },
 *     { label: "Date & Time" },
 *   ]}
 * />
 */
const Breadcrumbs = ({
  items,
  currentPage,
  showHomeIcon = true,
  separator = null,
  variant = "pill", // "pill" (default) | "inline"
  className = "",
}) => {
  const { translations = {}, isRtl } = useLanguage();

  // If items array is not passed, generate standard Home -> currentPage
  const breadcrumbList = items || [
    { label: translations.home || "Home", path: "/" },
    ...(currentPage ? [{ label: currentPage }] : []),
  ];

  return (
    <nav
      className={`app-breadcrumbs app-breadcrumbs--${variant} ${isRtl ? "is-rtl" : ""} ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="breadcrumbs-list">
        {breadcrumbList.map((item, index) => {
          const isLast = index === breadcrumbList.length - 1;
          const isFirst = index === 0;

          return (
            <li
              key={item.label || index}
              className={`breadcrumb-item ${isLast ? "is-current" : ""}`}
            >
              {index > 0 && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  {separator || (
                    <ChevronRightIcon className="breadcrumb-separator-icon" />
                  )}
                </span>
              )}

              {isLast || !item.path ? (
                <span className="breadcrumb-text" aria-current="page">
                  {isFirst && showHomeIcon && (
                    <HomeOutlinedIcon className="breadcrumb-home-icon" />
                  )}
                  <span>{item.label}</span>
                </span>
              ) : (
                <Link to={item.path} className="breadcrumb-link">
                  {isFirst && showHomeIcon && (
                    <HomeOutlinedIcon className="breadcrumb-home-icon" />
                  )}
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumbs;
