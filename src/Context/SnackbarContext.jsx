import { createContext, useContext, useState, useCallback, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { useLanguage } from "./useLanguage.js";
import "../Scss/Components/snackbar.scss";

const SnackbarContext = createContext({
  showSnackbar: () => {},
  hideSnackbar: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }) => {
  const { isRtl } = useLanguage();
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: "",
    severity: "success",
    duration: 5000,
  });

  const showSnackbar = useCallback((message, severity = "success", duration = 5000) => {
    if (!message) return;
    setSnackbarState({
      open: true,
      message,
      severity,
      duration,
    });
  }, []);

  const hideSnackbar = useCallback((event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarState((prev) => ({ ...prev, open: false }));
  }, []);

  // Support window-level custom event for trigger-from-anywhere
  useEffect(() => {
    const handleGlobalToast = (event) => {
      const { message, severity, duration } = event.detail || {};
      if (message) {
        showSnackbar(message, severity || "success", duration || 5000);
      }
    };

    window.addEventListener("appSnackbar", handleGlobalToast);
    return () => {
      window.removeEventListener("appSnackbar", handleGlobalToast);
    };
  }, [showSnackbar]);

  const getAlertIcon = () => {
    switch (snackbarState.severity) {
      case "error":
        return <ErrorOutlineIcon fontSize="inherit" />;
      case "warning":
        return <WarningAmberOutlinedIcon fontSize="inherit" />;
      case "info":
        return <InfoOutlinedIcon fontSize="inherit" />;
      case "success":
      default:
        return <CheckCircleOutlinedIcon fontSize="inherit" />;
    }
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, hideSnackbar }}>
      {children}

      {/* Centralized Global Snackbar */}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={snackbarState.duration}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: isRtl ? "left" : "right" }}
        className={`savory-global-snackbar ${isRtl ? "is-rtl" : ""}`}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbarState.severity}
          variant="filled"
          icon={getAlertIcon()}
          dir={isRtl ? "rtl" : "ltr"}
          className={`savory-snackbar-alert severity-${snackbarState.severity} ${isRtl ? "is-rtl" : ""}`}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export default SnackbarContext;