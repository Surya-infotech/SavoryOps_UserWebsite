import React from "react";
import { BrowserRouter, Route, Routes, Link } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./theme/muiTheme.js";
import Navbar from "./components/Navbar/Navbar.jsx";
import Footer from "./components/Footer/Footer.jsx";
import HomePage from "./pages/Home/HomePage.jsx";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import "./App.css";

const SubpagePlaceholder = ({ title, subtitle, icon }) => (
  <div className="subpage-container">
    <div className="subpage-hero">
      <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>{icon}</div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <Link to="/" className="subpage-back-btn">
        <ArrowBackIcon fontSize="small" />
        <span>Return to Home</span>
      </Link>
    </div>
  </div>
);

const AppContent = ({ userdomain }) => {
  return (
    <div className="user-app-container">
      {/* Top Glassmorphic Navigation Bar */}
      <Navbar userdomain={userdomain} />

      {/* Main Content Router */}
      <Box component="main" className="user-app-main">
        <Routes>
          <Route path="/" element={<HomePage userdomain={userdomain} />} />
          <Route
            path="/menu"
            element={
              <SubpagePlaceholder
                icon="🍕"
                title="Full Culinary Menu"
                subtitle="Browse through our wide selection of artisan wood-fired pizzas, gourmet smash burgers, Asian noodle bowls, and handcrafted desserts."
              />
            }
          />
          <Route
            path="/offers"
            element={
              <SubpagePlaceholder
                icon="🔥"
                title="Special Offers & Deals"
                subtitle="Exclusive dining discounts, midweek feast packages, and promo vouchers crafted for our food lovers."
              />
            }
          />
          <Route
            path="/reservation"
            element={
              <SubpagePlaceholder
                icon="🍷"
                title="Book A Table"
                subtitle="Reserve your table online in seconds with instant confirmation and contactless dining preferences."
              />
            }
          />
          <Route
            path="/about"
            element={
              <SubpagePlaceholder
                icon="🌿"
                title="About Our Kitchen"
                subtitle="Passionate chefs, farm-fresh local produce, and centuries-old culinary traditions reimagined for modern gastronomy."
              />
            }
          />
          <Route
            path="/contact"
            element={
              <SubpagePlaceholder
                icon="📞"
                title="Contact & Catering"
                subtitle="Have a question or planning a catering event? Reach out to our dedicated support team."
              />
            }
          />
          <Route
            path="*"
            element={
              <SubpagePlaceholder
                icon="🔍"
                title="Page Not Found"
                subtitle="The page you requested does not exist or has been moved."
              />
            }
          />
        </Routes>
      </Box>

      {/* Modern Footer */}
      <Footer userdomain={userdomain} />
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