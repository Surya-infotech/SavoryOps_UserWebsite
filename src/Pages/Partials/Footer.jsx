import { useState } from "react";
import { Link } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import "../../Scss/Pages/Partials/footer.scss";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const brandDisplayName = "SavoryOps";

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    }
  };

  return (
    <footer className="savory-footer">
      <div className="footer-inner">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo-row">
              <img src="/logo.png" alt="Logo" className="footer-logo" />
              <span className="footer-brand-title">{brandDisplayName}</span>
            </div>
            <p className="footer-brand-text">
              Delivering exquisite flavors crafted with farm-fresh organic ingredients, artisanal passion, and culinary mastery.
            </p>
            <div className="footer-contact-items">
              <div className="footer-contact-item">
                <LocationOnIcon fontSize="small" style={{ color: "#69e869" }} />
                <span>452 Gourmet Blvd, Culinary District</span>
              </div>
              <div className="footer-contact-item">
                <PhoneIcon fontSize="small" style={{ color: "#69e869" }} />
                <span>+1 (800) 555-FOOD (3663)</span>
              </div>
              <div className="footer-contact-item">
                <AccessTimeIcon fontSize="small" style={{ color: "#69e869" }} />
                <span>Mon - Sun: 10:00 AM - 11:30 PM</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Explore Menu</h4>
            <ul className="footer-nav-list">
              <li><Link to="/menu" className="footer-nav-link">🍕 Artisanal Pizzas</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍔 Gourmet Smash Burgers</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍜 Ramen & Asian Bowls</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍰 Desserts & Gelato</Link></li>
              <li><Link to="/menu" className="footer-nav-link">🍹 Handcrafted Mocktails</Link></li>
            </ul>
          </div>

          {/* Service Links */}
          <div className="footer-col">
            <h4 className="footer-col-title">Services</h4>
            <ul className="footer-nav-list">
              <li><Link to="/reservation" className="footer-nav-link">Table Reservation</Link></li>
              <li><Link to="/offers" className="footer-nav-link">Special Offers & Deals</Link></li>
              <li><Link to="/about" className="footer-nav-link">About Our Kitchen</Link></li>
              <li><Link to="/contact" className="footer-nav-link">Catering & Events</Link></li>
              <li><Link to="/contact" className="footer-nav-link">Customer Support</Link></li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="footer-col footer-newsletter-box">
            <h4 className="footer-col-title">Stay Inspired</h4>
            <p className="footer-newsletter-text">
              Subscribe to get secret chef recipes, exclusive discounts, and invitations to tasting events.
            </p>
            <form className="footer-newsletter-form" onSubmit={handleSubscribe}>
              <input
                type="email"
                className="footer-newsletter-input"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit" className="footer-newsletter-btn">
                Join
              </button>
            </form>
            {subscribed && (
              <span style={{ color: "#69e869", fontSize: "0.85rem", fontWeight: 600 }}>
                🎉 Thank you for subscribing! Check your inbox soon.
              </span>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom-bar">
          <div>
            © {new Date().getFullYear()} {brandDisplayName}. Powered by{" "}
            <strong style={{ color: "#69e869" }}>SavoryOps</strong> SaaS Restaurant Suite.
          </div>
          <div className="footer-bottom-links">
            <Link to="/about">About Us</Link>
            <Link to="/contact">Contact</Link>
            <Link to="#">Privacy Policy</Link>
            <Link to="#">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
