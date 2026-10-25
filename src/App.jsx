import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./theme/muiTheme.js";
import { SnackbarProvider } from "./Context/SnackbarContext.jsx";
import { WebsiteStatusProvider, useWebsiteStatus, UnderMaintenance } from "./Pages/Partials/UnderMaintenance.jsx";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import Navbar from "./Pages/Partials/Navbar.jsx";
import Footer from "./Pages/Partials/Footer.jsx";
import { useLanguage } from "./Context/useLanguage.js";
import HomeRouter from "./Router/Home.jsx";
import "./App.scss";
import "./Scss/Pages/Partials/undermaintenance.scss";

const LoadingSplash = ({ business }) => {
  const { translations = {} } = useLanguage();
  const businessName = business?.businessname;
  const businessLogo = business?.imageUrl;

  return (
    <div className="website-status-loading-screen">
      <div className="loading-card">
        <div className="pulse-logo-wrap">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt={businessName}
              style={{ width: 50, height: 50, borderRadius: 10, objectFit: "fill" }}
              onError={(e) => {
                e.target.style.display = "none";
              }}
            />
          ) : (
            <RestaurantIcon />
          )}
        </div>
        {businessName && <h3 className="loading-title">{businessName}</h3>}
        <p className="loading-subtitle">{translations.preparingexperience}</p>
        <div className="loading-spinner-bar" />
      </div>
    </div>
  );
};

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname.toLowerCase() === "/signin";

  // Automatically scroll to the top of the page on route change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location.pathname]);

  return (
    <div className="user-app-container">
      {/* Top Glassmorphic Navigation Bar */}
      {!isAuthPage && <Navbar />}

      {/* Main Content Router */}
      <Box component="main" className="user-app-main">
        <HomeRouter />
      </Box>

      {/* Modern Footer */}
      {!isAuthPage && <Footer />}
    </div>
  );
};

const WebsiteGuard = () => {
  const { loading, isWebsiteEnabled, business } = useWebsiteStatus();

  if (loading) {
    return <LoadingSplash business={business} />;
  }

  if (!isWebsiteEnabled) {
    return <UnderMaintenance />;
  }

  return (
    <Routes>
      <Route path="/*" element={<AppContent />} />
    </Routes>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <BrowserRouter>
        <SnackbarProvider>
          <WebsiteStatusProvider>
            <WebsiteGuard />
          </WebsiteStatusProvider>
        </SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;