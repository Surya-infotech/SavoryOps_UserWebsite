export const DEFAULT_BRANCHES = [
  {
    id: "branch-downtown",
    name: "Downtown Flagship",
    tagline: "Main Kitchen & Dine-in",
    address: "108 Grand Avenue, Central District",
    timing: "10:00 AM - 11:00 PM",
    status: "Open Now",
    phone: "+1 (800) 555-0101",
    isDefault: true,
  },
  {
    id: "branch-uptown",
    name: "Uptown Bistro & Patio",
    tagline: "Outdoor Dining & Bar",
    address: "452 Lexington Boulevard, Uptown",
    timing: "11:00 AM - 10:30 PM",
    status: "Open Now",
    phone: "+1 (800) 555-0102",
  },
  {
    id: "branch-westside",
    name: "Westside Express Kitchen",
    tagline: "Fast Delivery & Takeout Hub",
    address: "88 West Coast Highway, Westside",
    timing: "11:00 AM - Midnight",
    status: "Open Now",
    phone: "+1 (800) 555-0103",
  },
  {
    id: "branch-harbor",
    name: "Harbor Point Waterfront",
    tagline: "Scenic Waterfront Dining",
    address: "22 Marina Way, Harborfront",
    timing: "12:00 PM - 11:30 PM",
    status: "Open Now",
    phone: "+1 (800) 555-0104",
  },
];

export const getStoredBranch = (branches = DEFAULT_BRANCHES) => {
  const savedId = localStorage.getItem("selectedBranchId");
  if (savedId) {
    const found = branches.find((b) => b.id === savedId);
    if (found) return found;
  }
  return branches[0];
};

export default DEFAULT_BRANCHES;