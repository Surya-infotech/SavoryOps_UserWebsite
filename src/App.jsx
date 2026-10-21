import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { muiTheme } from "./theme/muiTheme.js";
import Navbar from "./Pages/Partials/Navbar.jsx";
import Footer from "./Pages/Partials/Footer.jsx";
import HomeRouter from "./Router/Home.jsx";
import "./App.scss";

const AppContent = () => {
  return (
    <div className="user-app-container">
      {/* Top Glassmorphic Navigation Bar */}
      <Navbar />

      {/* Main Content Router */}
      <Box component="main" className="user-app-main">
        <HomeRouter />
      </Box>

      {/* Modern Footer */}
      <Footer />
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;