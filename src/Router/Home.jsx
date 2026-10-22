import { Route, Routes } from "react-router-dom";
import { useLanguage } from "../Context/useLanguage.js";
import HomePage from "../Pages/Home/HomePage.jsx";
import SigninPage from "../Pages/Auth/SigninPage.jsx";
import PageNotFound from "../Pages/Partials/PageNotFound.jsx";
import SubpagePlaceholder from "../Pages/Partials/SubpagePlaceholder.jsx";
import SettingsPage from "../Pages/Settings/SettingsPage.jsx";

const HomeRouter = () => {
  const { translations = {} } = useLanguage();

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/signin" element={<SigninPage />} />
      <Route
        path="/menu"
        element={
          <SubpagePlaceholder
            icon="🍕"
            title={translations.fullculinarymenu || "Full Culinary Menu"}
            subtitle={translations.menusubtitle || "Browse through our wide selection of artisan wood-fired pizzas, gourmet smash burgers, Asian noodle bowls, and handcrafted desserts."}
          />
        }
      />
      <Route
        path="/offers"
        element={
          <SubpagePlaceholder
            icon="🔥"
            title={translations.specialoffers || "Special Offers & Deals"}
            subtitle={translations.offerssubtitle || "Exclusive dining discounts, midweek feast packages, and promo vouchers crafted for our food lovers."}
          />
        }
      />
      <Route
        path="/reservation"
        element={
          <SubpagePlaceholder
            icon="🍷"
            title={translations.tablebooking || "Book A Table"}
            subtitle={translations.bookingsubtitle || "Reserve your table online in seconds with instant confirmation and contactless dining preferences."}
          />
        }
      />
      <Route
        path="/about"
        element={
          <SubpagePlaceholder
            icon="🌿"
            title={translations.aboutkitchen || "About Our Kitchen"}
            subtitle={translations.aboutsubtitle || "Passionate chefs, farm-fresh local produce, and centuries-old culinary traditions reimagined for modern gastronomy."}
          />
        }
      />
      <Route
        path="/contact"
        element={
          <SubpagePlaceholder
            icon="📞"
            title={translations.contactcatering || "Contact & Catering"}
            subtitle={translations.contactsubtitle || "Have a question or planning a catering event? Reach out to our dedicated support team."}
          />
        }
      />
      <Route
        path="/orders"
        element={
          <SubpagePlaceholder
            icon="🧾"
            title={translations.orders || "Orders"}
            subtitle={translations.orderssubtitle || "View, reorder, and track your active delivery orders and dining receipts."}
          />
        }
      />
      <Route path="/settings" element={<SettingsPage />} />
      <Route
        path="/manage-address"
        element={
          <SubpagePlaceholder
            icon="📍"
            title={translations.manageaddress || "Manage Address"}
            subtitle={translations.addresssubtitle || "Save and organize your favorite home, office, and delivery addresses for quick ordering."}
          />
        }
      />
      <Route
        path="/my-reviews"
        element={
          <SubpagePlaceholder
            icon="⭐"
            title={translations.myreviews || "My Reviews"}
            subtitle={translations.reviewssubtitle || "Check your past dining reviews, dish ratings, and culinary feedback."}
          />
        }
      />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default HomeRouter;
