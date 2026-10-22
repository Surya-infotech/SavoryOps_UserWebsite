import { createContext, useContext, useState, useCallback, useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";

const SnackbarContext = createContext({
  showSnackbar: () => {},
  hideSnackbar: () => {},
});

export const useSnackbar = () => useContext(SnackbarContext);

export const SnackbarProvider = ({ children }) => {
  const [snackbarState, setSnackbarState] = useState({
    open: false,
    message: "",
    severity: "success",
    duration: 3500,
  });

  const showSnackbar = useCallback((message, severity = "success", duration = 3500) => {
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
        showSnackbar(message, severity || "success", duration || 3500);
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

  const getAlertBackgroundColor = () => {
    switch (snackbarState.severity) {
      case "error":
        return "#d32f2f";
      case "warning":
        return "#ed6c02";
      case "info":
        return "#0288d1";
      case "success":
      default:
        return "#028802";
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
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        style={{ zIndex: 999999, top: "25px", right: "25px" }}
      >
        <Alert
          onClose={hideSnackbar}
          severity={snackbarState.severity}
          variant="filled"
          icon={getAlertIcon()}
          sx={{
            background: getAlertBackgroundColor(),
            color: "#ffffff",
            fontSize: "0.95rem",
            fontWeight: 600,
            boxShadow:
              snackbarState.severity === "success"
                ? "0 10px 25px -5px rgba(2, 136, 2, 0.4), 0 8px 10px -6px rgba(2, 136, 2, 0.2)"
                : "0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)",
            borderRadius: "12px",
            alignItems: "center",
            py: 1,
            px: 2.2,
            "& .MuiAlert-icon": {
              color: "#ffffff",
              fontSize: "1.25rem",
            },
          }}
        >
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  );
};

export default SnackbarContext;