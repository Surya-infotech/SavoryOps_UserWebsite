import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import CloseIcon from "@mui/icons-material/Close";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import RefreshIcon from "@mui/icons-material/Refresh";
import jsQR from "jsqr";
import { useLanguage } from "../../Context/useLanguage.js";
import { useSnackbar } from "../../Context/SnackbarContext.jsx";
import { processTableQrCode } from "../../utils/qrTableService.js";

const QrScannerModal = ({ isOpen, onClose }) => {
  const { translations = {} } = useLanguage();
  const { showSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [cameraError, setCameraError] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Stop camera stream & scan loop cleanly
  const stopCamera = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track) => track.stop());
      } catch (err) {
        console.error("Error stopping camera track:", err);
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const isProcessingRef = useRef(false);

  // Handle successful QR detection
  const handleQrSuccess = useCallback(
    async (scannedText) => {
      if (!scannedText || isProcessingRef.current) return;
      isProcessingRef.current = true;

      // Haptic feedback on phone
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch {
          // ignore vibration errors
        }
      }

      stopCamera();
      onClose();

      try {
        const result = await processTableQrCode(scannedText);

        if (result && result.success && result.tableNo) {
          const branchPart = result.branchName ? ` (${result.branchName})` : "";
          const msg = `${translations.connectedtotable} ${result.tableNo}!${branchPart}`;
          showSnackbar(msg, "success");

          // If user was on the cart page, remain on cart page so they see updated table card & branch
          const currentPath = window.location.pathname;
          if (currentPath === "/cart" || currentPath === "/cart/") {
            window.dispatchEvent(
              new CustomEvent("tableChange", {
                detail: {
                  tableNo: result.tableNo,
                  tableId: result.tableId,
                  tableno: result.tableNo,
                  tableid: result.tableId,
                },
              })
            );
          } else {
            navigate(`/menu?table=${encodeURIComponent(result.tableNo)}`);
          }
        } else {
          showSnackbar(`Scanned: ${scannedText}`, "info");
        }
      } catch (err) {
        console.error("Error processing scanned QR code:", err);
        showSnackbar(translations.errorprocessingtableqrcode || translations.somethingwentwrong, "error");
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false;
        }, 1000);
      }
    },
    [navigate, onClose, showSnackbar, stopCamera, translations]
  );

  // Start mobile camera stream and scanning loop
  const startCamera = useCallback(async () => {
    setCameraError(null);
    stopCamera();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError(
        translations.cameranotavailable
      );
      return;
    }

    try {
      // Prefer rear environment-facing camera on phones and tablets
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch {
        // Fallback to any available video stream if environment camera request fails
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Check if native BarcodeDetector is supported
      const hasBarcodeDetector =
        typeof window !== "undefined" && "BarcodeDetector" in window;
      let barcodeDetector = null;
      if (hasBarcodeDetector) {
        try {
          barcodeDetector = new window.BarcodeDetector({ formats: ["qr_code"] });
        } catch {
          barcodeDetector = null;
        }
      }

      // Setup hidden canvas for jsQR analysis
      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });

      const scanLoop = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2) {
          animationFrameRef.current = requestAnimationFrame(scanLoop);
          return;
        }

        // Try BarcodeDetector first
        if (barcodeDetector) {
          try {
            const barcodes = await barcodeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              handleQrSuccess(barcodes[0].rawValue);
              return;
            }
          } catch {
            // Fall through to jsQR
          }
        }

        // Fast jsQR canvas frame analysis
        if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
          });

          if (code && code.data) {
            handleQrSuccess(code.data);
            return;
          }
        }

        animationFrameRef.current = requestAnimationFrame(scanLoop);
      };

      animationFrameRef.current = requestAnimationFrame(scanLoop);
    } catch (err) {
      console.warn("Mobile camera access error:", err);
      let errorMsg =
        translations.cameranotavailable;
      if (err.name === "NotAllowedError") {
        errorMsg =
          "Camera permission was denied. Please allow camera permissions in your browser to scan QR codes.";
      }
      setCameraError(errorMsg);
    }
  }, [handleQrSuccess, stopCamera, translations]);

  // Modal open/close lifecycle
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setCameraError(null);
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="qr-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="qr-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="qr-modal-header">
          <div className="qr-modal-title-group">
            <div className="qr-modal-badge">
              <QrCodeScannerIcon className="qr-badge-icon" />
            </div>
            <div>
              <h3 className="qr-modal-title">
                {translations.scanqr}
              </h3>
              <p className="qr-modal-subtitle">
                {translations.positionqrinframe}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="qr-modal-close-btn"
            onClick={onClose}
            aria-label="Close scanner"
          >
            <CloseIcon fontSize="small" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="qr-modal-body">
          <div className="qr-camera-viewport">
            {cameraError ? (
              <div className="qr-camera-fallback">
                <QrCodeScannerIcon className="qr-fallback-icon" />
                <p className="qr-fallback-msg">{cameraError}</p>
                <button
                  type="button"
                  className="qr-action-btn primary"
                  onClick={startCamera}
                >
                  <RefreshIcon fontSize="small" />
                  <span>{translations.tryagain}</span>
                </button>
              </div>
            ) : (
              <div className="qr-video-wrapper">
                <video
                  ref={videoRef}
                  className="qr-video-feed"
                  playsInline
                  muted
                  autoPlay
                />

                {/* Viewfinder Overlay with Animated Scanning Laser */}
                <div className="qr-viewfinder">
                  <div className="qr-corner qr-corner-tl" />
                  <div className="qr-corner qr-corner-tr" />
                  <div className="qr-corner qr-corner-bl" />
                  <div className="qr-corner qr-corner-br" />
                  <div className="qr-laser-line" />
                </div>

                <p className="qr-viewfinder-hint">
                  {translations.positionqrinframe}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QrScannerModal;
