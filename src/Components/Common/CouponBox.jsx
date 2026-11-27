import { useState, useEffect, useCallback } from "react";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import CloseIcon from "@mui/icons-material/Close";
import ConfirmationNumberOutlinedIcon from "@mui/icons-material/ConfirmationNumberOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
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
  const { translations = {} } = useLanguage();
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [isApplying, setIsApplying] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState([]);

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

  const formatDiscountBadge = (c) => {
    if (!c) return "";
    if (String(c.discounttype || "").toLowerCase() === "percentage") {
      return `${Number(c.discountvalue || 0)}% ${translations.offdiscount}`;
    }
    return `${formatPriceFromBranch(Number(c.discountvalue || 0), selectedBranch)} ${translations.offdiscount}`;
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
                {translations.youSaved || translations.yousaved}{" "}
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

      {isModalOpen && (
        <div
          className="coupon-modal-overlay"
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
              ) : availableCoupons.length === 0 ? (
                <div className="coupon-modal-empty">
                  <LocalOfferOutlinedIcon className="empty-coupon-icon" />
                  <p>{translations.nocouponsavailable}</p>
                </div>
              ) : (
                <div className="coupon-modal-list">
                  {availableCoupons.map((c) => {
                    const isEligible = c.isEligible !== false;
                    return (
                      <div
                        key={c.couponid || c.couponcode}
                        className={`coupon-offer-item ${!isEligible ? "is-ineligible" : ""}`}
                      >
                        <div className="coupon-offer-top">
                          <div className="coupon-offer-code-group">
                            <span className="coupon-code-chip">{c.couponcode}</span>
                            <span className="coupon-discount-pill">{formatDiscountBadge(c)}</span>
                          </div>
                          <button
                            type="button"
                            className="coupon-offer-apply-btn"
                            disabled={!isEligible || isApplying || disabled}
                            onClick={() => handleApplyCode(c.couponcode)}
                          >
                            {translations.apply}
                          </button>
                        </div>

                        {c.couponname && <h4 className="coupon-offer-title">{c.couponname}</h4>}
                        {c.description && <p className="coupon-offer-desc">{c.description}</p>}

                        <div className="coupon-offer-meta">
                          {Number(c.minorderamount) > 0 && (
                            <span className="coupon-meta-chip">
                              {translations.minorder}: {formatPriceFromBranch(c.minorderamount, selectedBranch)}
                            </span>
                          )}
                          {String(c.discounttype || "").toLowerCase() === "percentage" &&
                            Number(c.maxdiscountamount) > 0 && (
                              <span className="coupon-meta-chip">
                                {translations.maxdiscount}: {formatPriceFromBranch(c.maxdiscountamount, selectedBranch)}
                              </span>
                            )}
                          {c.endDate && (
                            <span className="coupon-meta-chip">
                              {translations.validuntil}: {String(c.endDate).slice(0, 10)}
                            </span>
                          )}
                        </div>

                        {!isEligible && c.ineligibleReason && (
                          <p className="coupon-ineligible-note">{c.ineligibleReason}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CouponBox;