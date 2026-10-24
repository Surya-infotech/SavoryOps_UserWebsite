import { useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import PolicyOutlinedIcon from "@mui/icons-material/PolicyOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import AccessTimeOutlinedIcon from "@mui/icons-material/AccessTimeOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import { useWebsiteStatus } from "./UnderMaintenance.jsx";
import { useLanguage } from "../../Context/useLanguage.js";
import "../../Scss/Pages/Partials/policypage.scss";

const POLICY_TYPE_LABELS = {
  general: "General Policy",
  order: "Order & Delivery Policy",
  table_reservation: "Table Reservation Policy",
};

const PolicyPage = () => {
  const { policyId } = useParams();
  const navigate = useNavigate();
  const { business, policies = [], loading } = useWebsiteStatus();
  const { translations = {}, isRtl } = useLanguage();

  // Active policies for this business
  const activePolicies = useMemo(() => {
    return (policies || []).filter((p) => p.status !== false);
  }, [policies]);

  // Find targeted policy by title, slug, policyType, ID, or policyid
  const currentPolicy = useMemo(() => {
    if (!activePolicies.length) return null;

    if (!policyId) {
      // Default to first general policy, or first available policy
      const firstGeneral = activePolicies.find((p) => p.policyType === "general");
      return firstGeneral || activePolicies[0];
    }

    let decodedId = "";
    try {
      decodedId = decodeURIComponent(String(policyId)).trim().toLowerCase();
    } catch {
      decodedId = String(policyId).trim().toLowerCase();
    }
    const cleanId = String(policyId).trim().toLowerCase();

    // 1. Direct title match (case-insensitive) e.g. "Order Cancellation Policy", "Terms & Condition"
    let found = activePolicies.find(
      (p) => p.title?.trim().toLowerCase() === decodedId || p.title?.trim().toLowerCase() === cleanId
    );
    if (found) return found;

    // 2. Title slug match (e.g. "terms-condition", "privacy-policy")
    found = activePolicies.find((p) => {
      const slug = p.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return slug === decodedId || slug === cleanId;
    });
    if (found) return found;

    // 3. Match policyType (e.g. "general", "order", "table_reservation")
    found = activePolicies.find(
      (p) => p.policyType?.toLowerCase() === decodedId || p.policyType?.toLowerCase() === cleanId
    );
    if (found) return found;

    // 4. Fallback: match MongoDB _id or numeric policyid
    found = activePolicies.find(
      (p) => String(p._id) === cleanId || String(p.policyid) === cleanId
    );
    if (found) return found;

    return activePolicies[0] || null;
  }, [activePolicies, policyId]);

  const businessName = business?.businessname || "";
  const logoUrl = business?.imageUrl;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const cleanContent = useMemo(() => {
    if (!currentPolicy?.content) return "";
    let html = currentPolicy.content;
    // Replace non-breaking spaces (&nbsp; and \u00a0) with regular spaces so text wraps properly
    html = html.replace(/&nbsp;/gi, " ").replace(/\u00a0/g, " ");
    return html;
  }, [currentPolicy?.content]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="policy-page-loading">
        <CircularProgress size={36} color="success" />
        <p>Loading policy details...</p>
      </div>
    );
  }

  return (
    <div className={`policy-page-wrapper ${isRtl ? "is-rtl" : ""}`}>
      <div className="policy-container">
        {/* Breadcrumb Navigation */}
        <nav className="policy-breadcrumbs" aria-label="Breadcrumb">
          <Link to="/" className="breadcrumb-link">
            {businessName || "Home"}
          </Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-active">
            {currentPolicy ? currentPolicy.title : "Policy Details"}
          </span>
        </nav>

        {/* Hero Header */}
        <header className="policy-hero-header">
          <div className="policy-hero-top">
            <div className="policy-icon-badge">
              <ShieldOutlinedIcon />
            </div>
            <div className="policy-hero-meta">
              <div className="policy-badges-row">
                <span className="policy-type-badge">
                  {currentPolicy ? POLICY_TYPE_LABELS[currentPolicy.policyType] || currentPolicy.policyType : "Official Policy"}
                </span>
                {currentPolicy?.updatedAt && (
                  <span className="policy-updated-badge">
                    <AccessTimeOutlinedIcon fontSize="inherit" />
                    <span>Updated {formatDate(currentPolicy.updatedAt)}</span>
                  </span>
                )}
              </div>
              <h1 className="policy-hero-title">
                {currentPolicy ? currentPolicy.title : "Business Policy"}
              </h1>
              {businessName && (
                <p className="policy-business-tag">
                  {businessName} • Official Restaurant Policy
                </p>
              )}
            </div>
          </div>

          <div className="policy-hero-actions no-print">
            <button
              type="button"
              className="policy-action-btn"
              onClick={handlePrint}
              title="Print Policy"
            >
              <PrintOutlinedIcon fontSize="small" />
              <span>Print</span>
            </button>
            <button
              type="button"
              className="policy-action-btn secondary"
              onClick={() => navigate("/")}
              title="Return to Home"
            >
              <ArrowBackOutlinedIcon fontSize="small" />
              <span>Back to Dining</span>
            </button>
          </div>
        </header>

        {/* Multi-Policy Navigation Tabs */}
        {activePolicies.length > 1 && (
          <div className="policy-tabs-bar no-print">
            <span className="tabs-label">All Policies:</span>
            <div className="policy-tabs-scroll">
              {activePolicies.map((p) => {
                const isActive = currentPolicy && (currentPolicy._id === p._id || currentPolicy.policyid === p.policyid);
                return (
                  <Link
                    key={p._id || p.policyid}
                    to={`/policy/${encodeURIComponent(p.title.toLowerCase())}`}
                    className={`policy-tab-chip ${isActive ? "active" : ""}`}
                  >
                    <PolicyOutlinedIcon fontSize="inherit" />
                    <span>{p.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Policy Content Card */}
        <main className="policy-content-card">
          {currentPolicy ? (
            <>
              {cleanContent ? (
                <div
                  className="policy-html-body"
                  dangerouslySetInnerHTML={{ __html: cleanContent }}
                />
              ) : (
                <div className="policy-empty-body">
                  <p>No written terms available for this policy yet.</p>
                </div>
              )}

              {/* Bottom Card Footer */}
              <div className="policy-card-footer">
                <div className="policy-footer-brand">
                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={businessName}
                      className="policy-footer-logo"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="policy-footer-logo-fallback">
                      <RestaurantIcon fontSize="small" />
                    </div>
                  )}
                  <div className="brand-info">
                    <strong>{businessName}</strong>
                    <span>Committed to transparent and exceptional guest hospitality.</span>
                  </div>
                </div>

                <div className="policy-footer-contact">
                  {business?.email && (
                    <a href={`mailto:${business.email}`} className="contact-link">
                      {business.email}
                    </a>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="policy-not-found-state">
              <ShieldOutlinedIcon className="not-found-icon" />
              <h2>Policy Not Found</h2>
              <p>The policy you are looking for is currently unavailable or has been updated.</p>
              <Link to="/" className="policy-home-btn">
                Return to Homepage
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default PolicyPage;