import { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { useLanguage } from "../../Context/useLanguage.js";
import { formatPriceFromBranch } from "../../utils/formatCurrency.js";
import { fetchAvailableCoupons, validateCouponCode } from "../../utils/couponService.js";
import "../../Scss/Components/couponbox.scss";

const CouponBox = ({
  branchId,
  customerId = null,
  selectedBranch = null,
  orderType = "",
  subtotal = 0,
  subdomain = "",
  couponEnabled = false,
  appliedCoupon = null,
  discountAmount = 0,
  onApplyCoupon,
  onRemoveCoupon,
  disabled = false,
  showSnackbar,
}) => {
  const { translations = {}, isRtl } = useLanguage();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState("");

  const loadCoupons = useCallback(async () => {
    if (!couponEnabled || !branchId) return;
    setLoadingCoupons(true);
    try {
      const res = await fetchAvailableCoupons({
        branchId,
        customerId,
        orderType,
        subtotalprice: subtotal,
        subdomain,
      });
      setAvailableCoupons(Array.isArray(res.coupons) ? res.coupons : []);
    } catch (err) {
      console.error("Error loading available coupons:", err);
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  }, [couponEnabled, branchId, customerId, orderType, subtotal, subdomain]);

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    if (!isModalOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isModalOpen]);

  const estimateCouponSavings = useCallback(
    (c) => {
      if (!c) return 0;
      const sub = Number(subtotal || 0);
      if (sub <= 0) return 0;
      const val = Number(c.discountvalue || 0);
      if (String(c.discounttype || "").toLowerCase() === "percentage") {
        const raw = (sub * val) / 100;
        const maxDisc = Number(c.maxdiscountamount || 0);
        return maxDisc > 0 ? Math.min(raw, maxDisc) : raw;
      }
      return Math.min(sub, val);
    },
    [subtotal]
  );

  const bestCouponCode = useMemo(() => {
    const eligible = availableCoupons.filter((c) => c && c.isEligible !== false && c.eligible !== false);
    if (eligible.length < 2) return null;
    let bestCode = null;
    let maxSavings = 0;
    for (const c of eligible) {
      const savings = estimateCouponSavings(c);
      if (savings > maxSavings) {
        maxSavings = savings;
        bestCode = c.couponcode;
      }
    }
    return maxSavings > 0 ? bestCode : null;
  }, [availableCoupons, estimateCouponSavings]);

  const sortedCoupons = useMemo(() => {
    return [...availableCoupons].sort((a, b) => {
      const aLocked = a?.isEligible === false || a?.eligible === false ? 1 : 0;
      const bLocked = b?.isEligible === false || b?.eligible === false ? 1 : 0;
      if (aLocked !== bLocked) return aLocked - bLocked;
      const aEst = Number(a?.estimatedDiscount ?? estimateCouponSavings(a)) || 0;
      const bEst = Number(b?.estimatedDiscount ?? estimateCouponSavings(b)) || 0;
      return bEst - aEst;
    });
  }, [availableCoupons, estimateCouponSavings]);

  const handleCopyCode = async (code) => {
    const clean = String(code || "").trim().toUpperCase();
    if (!clean) return;
    try {
      await navigator.clipboard?.writeText(clean);
      setCopiedCode(clean);
      if (typeof showSnackbar === "function") {
        showSnackbar(`${clean} - ${translations.couponcopied}`, "info", 2000);
      }
      setTimeout(() => {
        setCopiedCode((prev) => (prev === clean ? "" : prev));
      }, 1800);
    } catch {
      /* ignore clipboard errors */
    }
  };

  if (!couponEnabled) return null;

  const handleApplyCode = async (codeToApply) => {
    const cleanCode = String(codeToApply ?? couponInput ?? "").trim().toUpperCase();
    if (!cleanCode) {
      setCouponError(translations.entercouponcode);
      return;
    }
    if (disabled || isApplying) return;

    setCouponError("");
    setIsApplying(true);
    try {
      const result = await validateCouponCode({
        branchId,
        customerId,
        couponCode: cleanCode,
        orderType,
        subtotalprice: subtotal,
        subdomain,
        translations,
      });

      if (!result.valid || !result.coupon) {
        const msg = result.message || translations.invalidcouponcode;
        setCouponError(msg);
        if (typeof showSnackbar === "function") {
          showSnackbar(msg, "error", 3500);
        }
        return;
      }

      onApplyCoupon(result.coupon);
      setCouponInput("");
      setCouponError("");
      setIsModalOpen(false);
      if (typeof showSnackbar === "function") {
        showSnackbar(`${result.coupon.couponcode} - ${translations.couponapplied}`, "success", 3000);
      }
    } catch (err) {
      console.error("Coupon validation error:", err);
      const errMsg = translations.failedtoapplycoupon;
      setCouponError(errMsg);
      if (typeof showSnackbar === "function") {
        showSnackbar(errMsg, "error", 3500);
      }
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemove = () => {
    onRemoveCoupon();
    setCouponError("");
    if (typeof showSnackbar === "function") {
      showSnackbar(translations.couponremoved, "info", 2500);
    }
  };

  const formatDiscountStub = (c) => {
    if (!c) return { main: "", sub: "" };
    const isPct = String(c.discounttype || "").toLowerCase() === "percentage";
    const main = isPct
      ? `${Number(c.discountvalue || 0)}%`
      : formatPriceFromBranch(Number(c.discountvalue || 0), selectedBranch);
    return {
      main,
      sub: translations.offdiscount,
    };
  };

  const formatDiscountBadge = (c) => {
    const { main, sub } = formatDiscountStub(c);
    return main ? `${main} ${sub}` : "";
  };

  return (
    <div className="website-coupon-box">
      {appliedCoupon && appliedCoupon.couponcode ? (
        <div className="applied-coupon-card">
          <div className="applied-coupon-left">
            <div className="applied-coupon-icon">
              <CheckCircleOutlinedIcon fontSize="small" />
            </div>
            <div className="applied-coupon-info">
              <div className="applied-coupon-title-row">
                <span className="applied-coupon-code">{appliedCoupon.couponcode}</span>
                <span className="applied-coupon-badge">
                  {formatDiscountBadge(appliedCoupon)}
                </span>
              </div>
              <span className="applied-coupon-savings">
                {translations.yousaved}{" "}
                <strong>{formatPriceFromBranch(discountAmount, selectedBranch)}</strong>
              </span>
            </div>
          </div>
          <button
            type="button"
            className="remove-coupon-btn"
            onClick={handleRemove}
            disabled={disabled}
            title={translations.removecoupon}
          >
            <CloseIcon fontSize="small" />
            <span>{translations.remove}</span>
          </button>
        </div>
      ) : (
        <div className="coupon-entry-card">
          <div className="coupon-entry-header">
            <div className="coupon-header-label">
              <LocalOfferOutlinedIcon className="coupon-label-icon" fontSize="small" />
              <span>{translations.applycoupon}</span>
            </div>
            <button
              type="button"
              className="view-coupons-link-btn"
              onClick={handleOpenModal}
              disabled={disabled}
            >
              <span>{translations.viewcoupons}</span>
              <ChevronRightIcon fontSize="small" />
            </button>
          </div>

          <div className="coupon-input-row">
            <input
              type="text"
              className="coupon-code-input"
              placeholder={translations.entercouponcode}
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value.toUpperCase());
                if (couponError) setCouponError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleApplyCode();
                }
              }}
              disabled={disabled || isApplying}
            />
            <button
              type="button"
              className="apply-coupon-btn"
              onClick={() => handleApplyCode()}
              disabled={disabled || isApplying || !couponInput.trim()}
            >
              {isApplying ? <CircularProgress size={16} color="inherit" /> : translations.apply}
            </button>
          </div>

          {couponError && <p className="coupon-error-text">{couponError}</p>}
        </div>
      )}

      {isModalOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className={`coupon-modal-overlay ${isRtl ? "is-rtl" : ""}`.trim()}
            onClick={() => !isApplying && setIsModalOpen(false)}
            role="dialog"
            aria-modal="true"
          >
            <div className="coupon-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="coupon-modal-header">
                <div className="coupon-modal-title-wrap">
                  <ConfirmationNumberOutlinedIcon className="coupon-modal-icon" />
                  <h3>{translations.availablecoupons}</h3>
                </div>
                <button
                  type="button"
                  className="coupon-modal-close"
                  onClick={() => setIsModalOpen(false)}
                  aria-label={translations.close}
                >
                  <CloseIcon fontSize="small" />
                </button>
              </div>

              <div className="coupon-modal-body">
                {loadingCoupons ? (
                  <div className="coupon-modal-loading">
                    <CircularProgress size={28} color="success" />
                    <span>{translations.loading}</span>
                  </div>
                ) : sortedCoupons.length === 0 ? (
                  <div className="coupon-modal-empty">
                    <LocalOfferOutlinedIcon className="empty-coupon-icon" />
                    <p>{translations.nocouponsavailable}</p>
                  </div>
                ) : (
                  <div className="coupon-modal-list">
                    {sortedCoupons.map((c) => {
                      const isEligible = c.isEligible !== false && c.eligible !== false;
                      const isApplied =
                        appliedCoupon?.couponcode &&
                        String(appliedCoupon.couponcode).toUpperCase() ===
                        String(c.couponcode || "").toUpperCase();
                      const isCopied = copiedCode === String(c.couponcode || "").toUpperCase();
                      const isBestOffer = isEligible && bestCouponCode === c.couponcode;
                      const stub = formatDiscountStub(c);
                      const estimatedSavings = isEligible ? estimateCouponSavings(c) : 0;
                      const minOrder = Number(c.minorderamount || 0);
                      const maxDiscount =
                        String(c.discounttype || "").toLowerCase() === "percentage"
                          ? Number(c.maxdiscountamount || 0)
                          : 0;
                      const unlockProgress =
                        !isEligible && minOrder > 0
                          ? Math.min(100, Math.max(6, Math.round((Number(subtotal || 0) / minOrder) * 100)))
                          : 0;

                      const summaryParts = [];
                      if (maxDiscount > 0) {
                        summaryParts.push(
                          `${translations.maxdiscount}: ${formatPriceFromBranch(maxDiscount, selectedBranch)}`
                        );
                      }
                      if (minOrder > 0) {
                        summaryParts.push(
                          `${translations.minorder}: ${formatPriceFromBranch(minOrder, selectedBranch)}`
                        );
                      }

                      return (
                        <div
                          key={c.couponid || c.couponcode}
                          className={`coupon-ticket-card ${!isEligible ? "is-ineligible" : ""} ${isApplied ? "is-applied" : ""
                            }`.trim()}
                        >
                          {/* Left Ticket Stub */}
                          <div className="coupon-ticket-stub">
                            <span className="coupon-stub-value">{stub.main}</span>
                            <span className="coupon-stub-label">{stub.sub}</span>
                          </div>

                          {/* Right Ticket Details */}
                          <div className="coupon-ticket-main">
                            <div className="coupon-ticket-top">
                              <div className="coupon-ticket-code-row">
                                <button
                                  type="button"
                                  className={`coupon-code-pill-btn ${isCopied ? "is-copied" : ""}`}
                                  onClick={() => handleCopyCode(c.couponcode)}
                                  title={translations.copycode}
                                >
                                  <span className="coupon-code-text">{c.couponcode}</span>
                                  {isCopied ? (
                                    <CheckIcon className="coupon-copy-icon" />
                                  ) : (
                                    <ContentCopyIcon className="coupon-copy-icon" />
                                  )}
                                </button>
                                {isBestOffer && (
                                  <span className="coupon-best-tag">{translations.bestoffer}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                className={`coupon-ticket-apply-btn ${isApplied ? "is-applied" : ""}`}
                                disabled={!isEligible || isApplying || disabled || isApplied}
                                onClick={() => handleApplyCode(c.couponcode)}
                              >
                                {isApplied ? (
                                  <>
                                    <CheckIcon className="apply-check-icon" />
                                    <span>{translations.applied}</span>
                                  </>
                                ) : (
                                  translations.apply
                                )}
                              </button>
                            </div>

                            <div className="coupon-ticket-heading-row">
                              {c.couponname && (
                                <h4 className="coupon-ticket-title">{c.couponname}</h4>
                              )}
                              {isEligible && estimatedSavings > 0 && (
                                <span className="coupon-savings-hint">
                                  {translations.yousaved}{" "}
                                  {formatPriceFromBranch(estimatedSavings, selectedBranch)}
                                </span>
                              )}
                            </div>

                            {c.description && (
                              <p className="coupon-ticket-desc">{c.description}</p>
                            )}

                            {summaryParts.length > 0 && (
                              <p className="coupon-ticket-terms">{summaryParts.join(" · ")}</p>
                            )}

                            {!isEligible && c.ineligibleReason && (
                              <div className="coupon-unlock-box">
                                {minOrder > 0 && (
                                  <div className="coupon-unlock-track">
                                    <div
                                      className="coupon-unlock-fill"
                                      style={{ width: `${unlockProgress}%` }}
                                    />
                                  </div>
                                )}
                                <p className="coupon-ineligible-note">{c.ineligibleReason}</p>
                              </div>
                            )}

                            {c.endDate && (
                              <div className="coupon-ticket-footer">
                                <ScheduleOutlinedIcon className="coupon-expiry-icon" />
                                <span>
                                  {translations.validuntil}: {String(c.endDate).slice(0, 10)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default CouponBox;