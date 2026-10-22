import { Route, Routes } from "react-router-dom";
import HomePage from "../Pages/Home/HomePage.jsx";
import SigninPage from "../Pages/Auth/SigninPage.jsx";
import PageNotFound from "../Pages/Partials/PageNotFound.jsx";
import SubpagePlaceholder from "../Pages/Partials/SubpagePlaceholder.jsx";

const HomeRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SigninPage />} />
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
        path="/orders"
        element={
          <SubpagePlaceholder
            icon="🧾"
            title="Orders"
            subtitle="View, reorder, and track your active delivery orders and dining receipts."
          />
        }
      />
      <Route
        path="/settings"
        element={
          <SubpagePlaceholder
            icon="⚙️"
            title="Setting"
            subtitle="Manage your profile settings, dining notifications, and account preferences."
          />
        }
      />
      <Route
        path="/manage-address"
        element={
          <SubpagePlaceholder
            icon="📍"
            title="Manage Address"
            subtitle="Save and organize your favorite home, office, and delivery addresses for quick ordering."
          />
        }
      />
      <Route
        path="/my-reviews"
        element={
          <SubpagePlaceholder
            icon="⭐"
            title="My Reviews"
            subtitle="Check your past dining reviews, dish ratings, and culinary feedback."
          />
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default HomeRouter;
