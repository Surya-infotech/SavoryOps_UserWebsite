import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./theme/muiTheme.js";
import './App.css';

const AppContent = ({ userdomain }) => {
  return (
    <div className="user-app-container">
      <header className="user-app-header">
        <div className="brand-wrapper">
          <img src="/logo.png" alt="SavoryOps Logo" className="brand-logo" />
          <h1 className="brand-title">SavoryOps</h1>
        </div>
        <div>
          {userdomain ? (
            <span className="subdomain-pill">
              Subdomain: <strong>{userdomain}</strong>
            </span>
          ) : (
            <span className="subdomain-pill" style={{ opacity: 0.8 }}>
              Base Domain
            </span>
          )}
        </div>
      </header>

      <Box component="main" className="user-app-main">
        <Routes>
          <Route
            path="/"
            element={
              <div className="hero-card">
                <h2>{userdomain ? `Welcome to ${userdomain}` : "SavoryOps User Website"}</h2>
                <p>
                  {userdomain
                    ? `You are currently browsing the dedicated tenant website on subdomain "${userdomain}".`
                    : "No subdomain detected. Please navigate to a specific restaurant subdomain (e.g., restaurant.savoryops.website)."}
                </p>

                <div className="subdomain-details-box">
                  <div className="detail-row">
                    <span className="detail-label">Current Hostname:</span>
                    <span className="detail-value">{window.location.hostname}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Detected Subdomain:</span>
                    <span className="detail-value">{userdomain || "None (Base Host / Localhost)"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Configured Base Host:</span>
                    <span className="detail-value">{import.meta.env.VITE_HOST || "Not Set"}</span>
                  </div>
                </div>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="hero-card">
                <h2>Page Not Found</h2>
                <p>The page you requested could not be found.</p>
              </div>
            }
          />
        </Routes>
      </Box>
    </div>
  );
};

const getSubdomain = () => {
  const host = window.location.hostname;
  const envHost = import.meta.env.VITE_HOST;

  if (host.includes("localhost") || host === envHost) return null;
  const parts = host.split(".");
  return parts.length > 2 ? parts[0] : null;
};

const App = () => {
  const userdomain = getSubdomain();

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AppContent userdomain={userdomain} />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;