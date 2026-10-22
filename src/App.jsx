import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./theme/muiTheme.js";
import { SnackbarProvider } from "./Context/SnackbarContext.jsx";
import Navbar from "./Pages/Partials/Navbar.jsx";
import Footer from "./Pages/Partials/Footer.jsx";
import HomeRouter from "./Router/Home.jsx";
import "./App.scss";

const AppContent = () => {
  const location = useLocation();
  const isAuthPage = location.pathname.toLowerCase() === "/signin";

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

const App = () => {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <BrowserRouter>
        <SnackbarProvider>
          <Routes>
            <Route path="/*" element={<AppContent />} />
          </Routes>
        </SnackbarProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;