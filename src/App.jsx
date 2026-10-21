import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./theme/muiTheme.js";
import Navbar from "./Components/Navbar/Navbar.jsx";
import Footer from "./Components/Footer/Footer.jsx";
import HomeRouter from "./Router/Home.jsx";
import "./App.scss";

const AppContent = ({ userdomain }) => {
  return (
    <div className="user-app-container">
      {/* Top Glassmorphic Navigation Bar */}
      <Navbar userdomain={userdomain} />

      {/* Main Content Router */}
      <Box component="main" className="user-app-main">
        <HomeRouter userdomain={userdomain} />
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