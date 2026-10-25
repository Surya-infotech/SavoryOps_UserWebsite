import { useState, useEffect, useRef } from "react";
import StarIcon from "@mui/icons-material/Star";
import StarHalfIcon from "@mui/icons-material/StarHalf";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import FormatQuoteIcon from "@mui/icons-material/FormatQuote";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import TakeoutDiningIcon from "@mui/icons-material/TakeoutDining";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ReplyIcon from "@mui/icons-material/Reply";
import SparklesIcon from "@mui/icons-material/AutoAwesome";
import { useLanguage } from "../../Context/useLanguage.js";
import { useWebsiteStatus } from "../../Pages/Partials/UnderMaintenance.jsx";
import "../../Scss/Components/Home/homereviews.scss";

// Initial Curated Guest Reviews with In-Depth Dining Details
const INITIAL_REVIEWS_DATA = [
  {
    id: 1,
    customerName: "Sophia Martinez",
    avatarInitials: "SM",
    avatarBg: "linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%)",
    verifiedBadge: "Verified Tableside Diner",
    orderNo: "SO-10842",
    date: "Yesterday, 8:45 PM",
    diningType: "dine-in",
    diningLabel: "Dine-In • Table #6",
    branch: "Downtown Heritage Bistro",
    rating: 5,
    sentiment: "Exquisite Flavor",
    headline: "Hands down the best artisanal wood-fired pizza in the city!",
    review:
      "From the moment we walked in, the ambiance was enchanting. The pizza crust was crisp with that authentic wood-fired blistered char, and the white truffle aroma with melted burrata was pure culinary perfection. The tableside QR ordering made everything effortless and quick!",
    dishOrdered: "Wood-Fired Truffle & Wild Funghi Pizza",
    helpfulCount: 42,
    ratingsBreakdown: {
      food: 5.0,
      hospitality: 5.0,
      ambiance: 4.9,
      value: 4.8,
    },
    itemsOrdered: [
      { name: "Wood-Fired Truffle & Wild Funghi Pizza", qty: 1, price: "$23.00", isVeg: true },
      { name: "Artisan Burrata & Heirloom Salad", qty: 1, price: "$14.00", isVeg: true },
      { name: "Handcrafted Passionfruit Sparkler", qty: 2, price: "$13.00", isVeg: true },
    ],
    managerResponse: {
      author: "Chef Marco • Culinary Director",
      date: "Yesterday, 10:15 PM",
      message:
        "Thank you so much, Sophia! We source our black winter truffles directly from Umbria and let our sourdough ferment for 48 hours. Delighted your anniversary evening was magical with us!",
    },
  },
  {
    id: 2,
    customerName: "Liam Henderson",
    avatarInitials: "LH",
    avatarBg: "linear-gradient(135deg, #4E65FF 0%, #92EFFD 100%)",
    verifiedBadge: "Verified Express Delivery",
    orderNo: "SO-10819",
    date: "2 days ago, 7:15 PM",
    diningType: "delivery",
    diningLabel: "Express Delivery",
    branch: "Uptown Gourmet Hub",
    rating: 5,
    sentiment: "Super Fast & Juicy",
    headline: "Arrived piping hot in 20 minutes — best smash burger I've had!",
    review:
      "I was blown away by how crispy the edges of the smash burger were while staying super juicy inside. Even through delivery, the brioche bun stayed warm and toasted without getting soggy. Live kitchen status in the app kept me updated every step of the way.",
    dishOrdered: "Prime Double Bacon Smash Burger",
    helpfulCount: 31,
    ratingsBreakdown: {
      food: 5.0,
      hospitality: 4.9,
      ambiance: 5.0, // Delivery packaging
      value: 4.9,
    },
    itemsOrdered: [
      { name: "Prime Double Bacon Smash Burger", qty: 2, price: "$33.50", isVeg: false },
      { name: "Truffle Parm Crispy French Fries", qty: 1, price: "$6.00", isVeg: true },
      { name: "Salted Caramel Shake", qty: 1, price: "$7.50", isVeg: true },
    ],
    managerResponse: {
      author: "Alex Rivera • Operations Manager",
      date: "2 days ago, 8:00 PM",
      message:
        "Awesome feedback Liam! Our custom insulated packaging was engineered specifically so smash burgers arrive in restaurant-grade condition. Enjoy your next order!",
    },
  },
  {
    id: 3,
    customerName: "Elena Rostova",
    avatarInitials: "ER",
    avatarBg: "linear-gradient(135deg, #F857A6 0%, #FF5858 100%)",
    verifiedBadge: "Verified Tableside Diner",
    orderNo: "SO-10795",
    date: "4 days ago, 9:20 PM",
    diningType: "dine-in",
    diningLabel: "Dine-In • Table #12",
    branch: "Downtown Heritage Bistro",
    rating: 5,
    sentiment: "Authentic Comfort",
    headline: "Rich 18-hour simmered broth with incredible depth",
    review:
      "You can truly taste the dedication in the 18-hour pork broth. The chashu melted in my mouth, and the ajitsuke tamago egg was cured to a soft-boiled perfection. The waitstaff were exceptionally courteous and helped recommend the best sake pairing.",
    dishOrdered: "Slow-Simmered Tonkotsu Ramen",
    helpfulCount: 54,
    ratingsBreakdown: {
      food: 5.0,
      hospitality: 5.0,
      ambiance: 4.9,
      value: 5.0,
    },
    itemsOrdered: [
      { name: "Slow-Simmered Tonkotsu Ramen", qty: 2, price: "$39.00", isVeg: false },
      { name: "Steamed Kurobuta Pork Gyoza", qty: 1, price: "$8.50", isVeg: false },
      { name: "Matcha Ceremonial Gelato", qty: 2, price: "$11.00", isVeg: true },
    ],
    managerResponse: {
      author: "Kenji Sato • Head Ramen Master",
      date: "4 days ago, 11:00 PM",
      message:
        "Arigato gozaimasu Elena! Our team starts the broth at 4 AM each morning to extract that rich collagen texture. Look forward to welcoming you back for our seasonal miso special!",
    },
  },
  {
    id: 4,
    customerName: "Marcus Sterling",
    avatarInitials: "MS",
    avatarBg: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
    verifiedBadge: "Verified Garden Patio Diner",
    orderNo: "SO-10760",
    date: "5 days ago, 1:30 PM",
    diningType: "dine-in",
    diningLabel: "Dine-In • Garden Patio Booth",
    branch: "Coastal Terrace & Garden",
    rating: 5,
    sentiment: "Fresh & Vibrant",
    headline: "Pure San Marzano tomatoes and buffalo mozzarella bliss",
    review:
      "Hosted our family Sunday brunch on the open garden terrace. Every dish arrived vibrant, fragrant, and farm-fresh. The kids loved watching the open pizza oven through the viewing glass. Outstanding hospitality from server Chloe who was attentive all afternoon!",
    dishOrdered: "Classic Neapolitan Margherita & Mocktails",
    helpfulCount: 27,
    ratingsBreakdown: {
      food: 4.9,
      hospitality: 5.0,
      ambiance: 5.0,
      value: 4.8,
    },
    itemsOrdered: [
      { name: "Classic Neapolitan Margherita Pizza", qty: 2, price: "$37.00", isVeg: true },
      { name: "Wild Berry Handcrafted Mocktail", qty: 3, price: "$19.50", isVeg: true },
      { name: "Sicilian Pistachio Gelato Cup", qty: 2, price: "$12.00", isVeg: true },
    ],
    managerResponse: {
      author: "Elena Vasquez • General Manager",
      date: "5 days ago, 3:15 PM",
      message:
        "Thank you Marcus! Sunday brunches in the garden are our pride and joy. Chloe was thrilled to hear your kind words. See you and your family again soon!",
    },
  },
  {
    id: 5,
    customerName: "Amina Al-Mansoor",
    avatarInitials: "AA",
    avatarBg: "linear-gradient(135deg, #FC466B 0%, #3F5EFB 100%)",
    verifiedBadge: "Verified Express Takeaway",
    orderNo: "SO-10733",
    date: "1 week ago, 6:40 PM",
    diningType: "takeaway",
    diningLabel: "Takeaway Pickup",
    branch: "Uptown Gourmet Hub",
    rating: 5,
    sentiment: "Unbeatable Crunch",
    headline: "Takeaway order was ready to the minute — incredible crunch!",
    review:
      "Ordered ahead on the web platform and picked it up directly from the takeaway counter. It was packaged with care, completely leak-proof, and the sweet-garlic glazed wings remained unbelievably crunchy on the drive home. Top-tier culinary standards!",
    dishOrdered: "Crispy Korean Fried Chicken & Ramen",
    helpfulCount: 36,
    ratingsBreakdown: {
      food: 5.0,
      hospitality: 4.9,
      ambiance: 4.8,
      value: 4.9,
    },
    itemsOrdered: [
      { name: "Sweet Chili Garlic Fried Chicken (10 pcs)", qty: 1, price: "$17.50", isVeg: false },
      { name: "Spicy Kimchi Tonkotsu Ramen", qty: 1, price: "$18.00", isVeg: false },
      { name: "Sparkling Yuzu Citronade", qty: 2, price: "$10.00", isVeg: true },
    ],
    managerResponse: {
      author: "Alex Rivera • Operations Manager",
      date: "1 week ago, 8:15 PM",
      message:
        "Thank you so much Amina! Double-frying the chicken at precise temperatures ensures that signature crunch. We look forward to your next visit!",
    },
  },
  {
    id: 6,
    customerName: "Julian Dubois",
    avatarInitials: "JD",
    avatarBg: "linear-gradient(135deg, #F9D423 0%, #FF4E50 100%)",
    verifiedBadge: "Verified Tableside Diner",
    orderNo: "SO-10688",
    date: "1 week ago, 8:10 PM",
    diningType: "dine-in",
    diningLabel: "Dine-In • Table #2",
    branch: "Downtown Heritage Bistro",
    rating: 5,
    sentiment: "Decadent Dessert",
    headline: "The most authentic Italian tiramisu in the area",
    review:
      "We stopped in specifically for coffee and dessert after a theatre show. The mascarpone cream was light as air, layered with espresso-soaked savoiardi ladyfingers and dusting of Valrhona cocoa. Exceptional hospitality even during peak dinner rush!",
    dishOrdered: "Tiramisu al Mascarpone & Espresso",
    helpfulCount: 45,
    ratingsBreakdown: {
      food: 5.0,
      hospitality: 4.9,
      ambiance: 4.9,
      value: 4.8,
    },
    itemsOrdered: [
      { name: "Traditional Tiramisu al Mascarpone", qty: 2, price: "$17.00", isVeg: true },
      { name: "Double Shot Ethiopian Espresso", qty: 2, price: "$7.50", isVeg: true },
    ],
    managerResponse: {
      author: "Chef Marco • Culinary Director",
      date: "1 week ago, 10:30 PM",
      message:
        "Grazie mille Julian! Our pastry team whips the mascarpone fresh twice daily. Delighted it made for a lovely post-theater treat!",
    },
  },
];

const HomeReviews = () => {
  const { translations = {} } = useLanguage();
  const { business } = useWebsiteStatus();
  const brandName = business?.businessname || "SavoryOps Kitchen";

  // State Management
  const [reviewsList, setReviewsList] = useState(INITIAL_REVIEWS_DATA);
  const [likedReviews, setLikedReviews] = useState({});

  // Modal Details State
  const [activeReviewDetails, setActiveReviewDetails] = useState(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // New Review Form State
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [newName, setNewName] = useState("");
  const [newDiningType, setNewDiningType] = useState("dine-in");
  const [newDish, setNewDish] = useState("");
  const [newReviewText, setNewReviewText] = useState("");
  const [formError, setFormError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Horizontal Carousel Scrolling & Dragging
  const scrollTrackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);

  const checkScrollState = () => {
    const el = scrollTrackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScrollLeft = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < maxScrollLeft - 10);
  };

  useEffect(() => {
    checkScrollState();
    const track = scrollTrackRef.current;
    if (!track) return;

    const onScroll = () => checkScrollState();
    const onResize = () => checkScrollState();

    track.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    const timer1 = setTimeout(checkScrollState, 150);
    const timer2 = setTimeout(checkScrollState, 500);

    return () => {
      track.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [reviewsList]);

  const handleScroll = (direction) => {
    const el = scrollTrackRef.current;
    if (!el) return;
    const clientWidth = el.clientWidth;
    const scrollAmount = clientWidth * 0.85;

    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });

    // Check periodically during and after smooth scroll completes
    setTimeout(checkScrollState, 100);
    setTimeout(checkScrollState, 250);
    setTimeout(checkScrollState, 450);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0 || !scrollTrackRef.current) return;
    setIsDragging(true);
    dragStartXRef.current = e.pageX;
    dragScrollLeftRef.current = scrollTrackRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !scrollTrackRef.current) return;
    e.preventDefault();
    const deltaX = e.pageX - dragStartXRef.current;
    scrollTrackRef.current.scrollLeft = dragScrollLeftRef.current - deltaX;
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (activeReviewDetails || isWriteModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [activeReviewDetails, isWriteModalOpen]);

  // Handle Likes / Helpful toggles
  const handleToggleHelpful = (reviewId, e) => {
    e.stopPropagation();
    setLikedReviews((prev) => {
      const isCurrentlyLiked = !!prev[reviewId];
      const updated = { ...prev, [reviewId]: !isCurrentlyLiked };
      setReviewsList((currentList) =>
        currentList.map((item) => {
          if (item.id === reviewId) {
            return {
              ...item,
              helpfulCount: isCurrentlyLiked ? item.helpfulCount - 1 : item.helpfulCount + 1,
            };
          }
          return item;
        })
      );
      return updated;
    });
  };

  // Handle New Review Submission
  const handleSubmitReview = (e) => {
    e.preventDefault();
    if (!newName.trim() || !newReviewText.trim() || newRating < 1) {
      setFormError(
        translations.fillrequiredfields || "Please provide a rating, your name, and your review text."
      );
      return;
    }

    const initials = newName
      .trim()
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "VG";

    const randomOrderNum = Math.floor(10850 + Math.random() * 500);

    const createdReview = {
      id: Date.now(),
      customerName: newName.trim(),
      avatarInitials: initials,
      avatarBg: "linear-gradient(135deg, #028802 0%, #69e869 100%)",
      verifiedBadge: `${translations.verifieddiner || "Verified Diner"} • Web Review`,
      orderNo: `SO-${randomOrderNum}`,
      date: "Just now",
      diningType: newDiningType,
      diningLabel:
        newDiningType === "dine-in"
          ? translations.dinein || "Dine-In"
          : newDiningType === "delivery"
            ? translations.delivery || "Delivery"
            : translations.takeaway || "Takeaway",
      branch: brandName,
      rating: newRating,
      sentiment: newRating >= 4 ? "Exceptional" : "Good Experience",
      headline: `${newRating}-Star Dining Experience`,
      review: newReviewText.trim(),
      dishOrdered: newDish.trim() || translations.artisanpizzas || "Specialty Dish",
      helpfulCount: 1,
      isUserSubmitted: true,
      ratingsBreakdown: {
        food: (newRating * 0.98).toFixed(1),
        hospitality: (newRating * 0.96).toFixed(1),
        ambiance: (newRating * 0.95).toFixed(1),
        value: (newRating * 0.94).toFixed(1),
      },
      itemsOrdered: [
        {
          name: newDish.trim() || "Artisan Specialty Selection",
          qty: 1,
          price: "$21.50",
          isVeg: true,
        },
      ],
      managerResponse: {
        author: `${brandName} Management`,
        date: "Just now",
        message: `Thank you ${newName.trim()}! We value your feedback and look forward to welcoming you back soon!`,
      },
    };

    setReviewsList((prev) => [createdReview, ...prev]);
    setSubmitSuccess(true);
    setFormError("");

    setTimeout(() => {
      setSubmitSuccess(false);
      setIsWriteModalOpen(false);
      setNewName("");
      setNewDish("");
      setNewReviewText("");
      setNewRating(5);
    }, 1500);
  };



  // Helper to render Star icons
  const renderStars = (ratingCount) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= ratingCount) {
        stars.push(<StarIcon key={i} className="star-gold" fontSize="inherit" />);
      } else if (i - 0.5 <= ratingCount) {
        stars.push(<StarHalfIcon key={i} className="star-gold" fontSize="inherit" />);
      } else {
        stars.push(<StarBorderIcon key={i} className="star-muted" fontSize="inherit" />);
      }
    }
    return stars;
  };

  return (
    <section className="home-reviews-section" id="guest-reviews">
      <div className="home-reviews-container">
        {/* Section Header */}
        <div className="reviews-header-block">
          <div className="reviews-pill-tag">
            <SparklesIcon fontSize="inherit" />
            <span>{translations.customerreviewstag || "Real Dining Experiences"}</span>
          </div>
          <h2 className="reviews-main-title">
            {translations.customerreviewstitle || "Loved by Thousands of Food Lovers"}
          </h2>
          <p className="reviews-subtitle">
            {translations.customerreviewssubtitle ||
              "Discover genuine dining experiences, dish ratings, and verified reviews from our valued restaurant guests."}
          </p>
        </div>


        {/* Reviews Horizontal Carousel */}
        <div className="reviews-carousel-wrapper">
          {canScrollLeft && (
            <button
              type="button"
              className="carousel-nav-btn prev-btn"
              onClick={() => handleScroll("left")}
              aria-label="Previous reviews"
            >
              <ChevronLeftIcon />
            </button>
          )}

          <div
            className={`reviews-cards-grid ${isDragging ? "is-dragging" : ""}`}
            ref={scrollTrackRef}
            onScroll={checkScrollState}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            {reviewsList.map((item) => {
              return (
                <article
                  key={item.id}
                  className="review-card"
                  id={`review-card-${item.id}`}
                >
                  {/* Card Header: Customer Info */}
                  <div className="review-card-header">
                    <div
                      className="customer-avatar"
                      style={{ background: item.avatarBg }}
                    >
                      {item.avatarInitials}
                    </div>
                    <div className="customer-text-meta">
                      <div className="customer-name-row">
                        <span className="customer-name" title={item.customerName}>
                          {item.customerName}
                        </span>
                      </div>
                      <div className="customer-sub-meta">
                        <span className="review-date">{item.date}</span>
                        <span className="meta-dot">•</span>
                        <span className="review-branch" title={item.branch}>
                          {item.branch}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="review-meta-strip">
                    <div className="rating-cluster-left">
                      <div className="stars-cluster">{renderStars(item.rating)}</div>
                      <span className="rating-numeric">{item.rating}.0</span>
                    </div>
                  </div>

                  {/* Body Text */}
                  <p className="review-body-text">{item.review}</p>
                </article>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              className="carousel-nav-btn next-btn"
              onClick={() => handleScroll("right")}
              aria-label="Next reviews"
            >
              <ChevronRightIcon />
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================
          DETAILED REVIEW MODAL DIALOG (SHOWS FULL REVIEW DETAILS)
          ======================================================================== */}
      {activeReviewDetails && (
        <div
          className="review-modal-backdrop"
          onClick={() => setActiveReviewDetails(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="review-modal-title"
        >
          <div
            className="review-modal-card"
            onClick={(e) => e.stopPropagation()}
            id="review-details-modal"
          >
            {/* Modal Header */}
            <div className="modal-header">
              <div className="modal-header-left">
                <div
                  className="modal-avatar"
                  style={{ background: activeReviewDetails.avatarBg }}
                >
                  {activeReviewDetails.avatarInitials}
                </div>
                <div className="modal-customer-info">
                  <div className="modal-name-row">
                    <h3 id="review-modal-title" className="modal-customer-name">
                      {activeReviewDetails.customerName}
                    </h3>
                    <span className="modal-verified-pill">
                      <CheckCircleIcon fontSize="inherit" />
                      <span>{activeReviewDetails.verifiedBadge}</span>
                    </span>
                  </div>
                  <div className="modal-meta-row">
                    <span>
                      <ReceiptLongIcon fontSize="inherit" />
                      {translations.orderno || "Order"}: #{activeReviewDetails.orderNo}
                    </span>
                    <span className="meta-separator">•</span>
                    <span>
                      <AccessTimeIcon fontSize="inherit" />
                      {activeReviewDetails.date}
                    </span>
                    <span className="meta-separator">•</span>
                    <span>
                      <LocationOnIcon fontSize="inherit" />
                      {activeReviewDetails.branch}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setActiveReviewDetails(null)}
                aria-label="Close review details"
              >
                <CloseIcon fontSize="inherit" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="modal-body-scrollable">
              {/* Overall Score & Dining Channel */}
              <div className="modal-score-banner">
                <div className="modal-score-left">
                  <div className="modal-stars-wrap">
                    {renderStars(activeReviewDetails.rating)}
                  </div>
                  <span className="modal-rating-num">{activeReviewDetails.rating}.0 / 5.0</span>
                  <span className="modal-sentiment-tag">{activeReviewDetails.sentiment}</span>
                </div>

                <div className="modal-channel-badge">
                  {activeReviewDetails.diningType === "dine-in" && (
                    <TableRestaurantIcon fontSize="inherit" />
                  )}
                  {activeReviewDetails.diningType === "delivery" && (
                    <DeliveryDiningIcon fontSize="inherit" />
                  )}
                  {activeReviewDetails.diningType === "takeaway" && (
                    <TakeoutDiningIcon fontSize="inherit" />
                  )}
                  <span>{activeReviewDetails.diningLabel}</span>
                </div>
              </div>

              {/* Full Review Text with Headline */}
              <div className="modal-review-text-section">
                <h4 className="modal-headline">{activeReviewDetails.headline}</h4>
                <div className="modal-quote-wrapper">
                  <FormatQuoteIcon className="modal-quote-icon" />
                  <p className="modal-full-review-content">{activeReviewDetails.review}</p>
                </div>
              </div>

              {/* Experience Criteria Ratings Breakdown */}
              <div className="modal-criteria-section">
                <h5 className="section-title">
                  {translations.ratingsbreakdown || "Experience Breakdown"}
                </h5>
                <div className="criteria-grid">
                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.foodquality || "Food Taste & Quality"}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.food} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill green-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.food / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.servicehospitality || "Service & Hospitality"}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.hospitality} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill blue-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.hospitality / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.ambiance || "Ambiance & Cleanliness"}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.ambiance} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill purple-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.ambiance / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="criteria-item">
                    <div className="criteria-label-row">
                      <span>{translations.valueformoney || "Value for Money"}</span>
                      <strong>{activeReviewDetails.ratingsBreakdown.value} ★</strong>
                    </div>
                    <div className="criteria-bar-bg">
                      <div
                        className="criteria-bar-fill amber-fill"
                        style={{
                          width: `${(activeReviewDetails.ratingsBreakdown.value / 5) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items in this Order */}
              {activeReviewDetails.itemsOrdered && activeReviewDetails.itemsOrdered.length > 0 && (
                <div className="modal-items-section">
                  <h5 className="section-title">
                    {translations.itemsordered || "Items in this Order"}
                  </h5>
                  <div className="items-list">
                    {activeReviewDetails.itemsOrdered.map((dish, idx) => (
                      <div key={idx} className="item-row">
                        <div className="item-left">
                          <span
                            className={`diet-dot ${dish.isVeg ? "veg" : "non-veg"}`}
                            title={dish.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                          />
                          <span className="dish-qty">{dish.qty}x</span>
                          <span className="dish-name">{dish.name}</span>
                        </div>
                        <span className="dish-price">{dish.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Official Restaurant Manager / Chef Response */}
              {activeReviewDetails.managerResponse && (
                <div className="modal-response-box">
                  <div className="response-header-row">
                    <div className="response-author-col">
                      <ReplyIcon fontSize="inherit" className="reply-icon" />
                      <span className="response-title">
                        {translations.restaurantresponse || "Official Restaurant Response"}
                      </span>
                      <span className="author-pill">
                        {activeReviewDetails.managerResponse.author}
                      </span>
                    </div>
                    <span className="response-date">
                      {activeReviewDetails.managerResponse.date}
                    </span>
                  </div>
                  <p className="response-message-text">
                    "{activeReviewDetails.managerResponse.message}"
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className={`modal-helpful-btn ${likedReviews[activeReviewDetails.id] ? "liked" : ""
                  }`}
                onClick={(e) => handleToggleHelpful(activeReviewDetails.id, e)}
              >
                {likedReviews[activeReviewDetails.id] ? (
                  <ThumbUpIcon fontSize="inherit" />
                ) : (
                  <ThumbUpOutlinedIcon fontSize="inherit" />
                )}
                <span>
                  {translations.helpful || "Helpful"} ({activeReviewDetails.helpfulCount})
                </span>
              </button>

              <button
                type="button"
                className="modal-done-btn"
                onClick={() => setActiveReviewDetails(null)}
              >
                {translations.closereview || "Close Details"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================
          "WRITE A REVIEW" INTERACTIVE MODAL DIALOG
          ======================================================================== */}
      {isWriteModalOpen && (
        <div
          className="review-modal-backdrop"
          onClick={() => setIsWriteModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="write-review-title"
        >
          <div
            className="write-modal-card"
            onClick={(e) => e.stopPropagation()}
            id="write-review-modal"
          >
            <div className="write-modal-header">
              <div>
                <h3 id="write-review-title" className="write-modal-title">
                  {translations.shareyourfeedback || "Share Your Dining Experience"}
                </h3>
                <p className="write-modal-desc">
                  {translations.sharefeedbacksubtitle ||
                    "Your feedback helps our culinary team maintain top standards and craft delicious moments."}
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsWriteModalOpen(false)}
                aria-label="Close"
              >
                <CloseIcon fontSize="inherit" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="write-success-state">
                <CheckCircleIcon className="success-icon" />
                <h4>{translations.reviewsubmittedsuccess || "Thank you! Your dining review has been posted successfully."}</h4>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="write-review-form" noValidate>
                {formError && <div className="form-error-banner">{formError}</div>}

                {/* Rating Picker */}
                <div className="form-rating-picker-block">
                  <label className="field-label">
                    {translations.yourrating || "Your Overall Rating"} <span className="req">*</span>
                  </label>
                  <div className="rating-interactive-stars">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        className={`star-pick-btn ${(hoverRating || newRating) >= val ? "filled" : ""
                          }`}
                        onMouseEnter={() => setHoverRating(val)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setNewRating(val)}
                        aria-label={`${val} Star`}
                      >
                        <StarIcon fontSize="large" />
                      </button>
                    ))}
                    <span className="rating-hint-text">
                      {hoverRating || newRating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name & Dining Type Row */}
                <div className="form-two-col-row">
                  <div className="form-field-group">
                    <label className="field-label" htmlFor="review-name">
                      {translations.yourname || "Full Name"} <span className="req">*</span>
                    </label>
                    <input
                      type="text"
                      id="review-name"
                      placeholder={translations.enteryourname || "Enter your full name"}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="form-text-input"
                      required
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label" htmlFor="review-dining-type">
                      {translations.diningtype || "Dining Channel"}
                    </label>
                    <select
                      id="review-dining-type"
                      className="form-select-input"
                      value={newDiningType}
                      onChange={(e) => setNewDiningType(e.target.value)}
                    >
                      <option value="dine-in">{translations.dinein || "Dine-In (At Restaurant)"}</option>
                      <option value="delivery">{translations.delivery || "Express Delivery"}</option>
                      <option value="takeaway">{translations.takeaway || "Takeaway Pickup"}</option>
                    </select>
                  </div>
                </div>

                {/* Favorite Dish */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="review-dish">
                    {translations.yourfavoritedish || "Favorite Dish Ordered"}
                  </label>
                  <input
                    type="text"
                    id="review-dish"
                    placeholder={
                      translations.enteryourfavoritedish || "e.g., Artisan Truffle Funghi Pizza"
                    }
                    value={newDish}
                    onChange={(e) => setNewDish(e.target.value)}
                    className="form-text-input"
                  />
                </div>

                {/* Review Text */}
                <div className="form-field-group">
                  <label className="field-label" htmlFor="review-text">
                    {translations.yourreviewtext || "Your Review"} <span className="req">*</span>
                  </label>
                  <textarea
                    id="review-text"
                    rows={4}
                    placeholder={
                      translations.enteryourreview ||
                      "Tell us about the flavors, presentation, staff hospitality, and overall experience..."
                    }
                    value={newReviewText}
                    onChange={(e) => setNewReviewText(e.target.value)}
                    className="form-textarea-input"
                    required
                  />
                </div>

                {/* Submit Action */}
                <div className="write-form-actions">
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setIsWriteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" id="submit-review-action">
                    <span>{translations.submitreview || "Submit Dining Review"}</span>
                    <ArrowForwardIcon fontSize="inherit" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default HomeReviews;