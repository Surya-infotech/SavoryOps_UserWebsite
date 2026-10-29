/**
 * Centralized Cart Service for SavoryOps User Website
 * 100% Compatible with SavoryOps_UserApp Cart Architecture
 * Handles cart persistence, item comparison, quantity aggregation, and reactive updates.
 */

const CART_STORAGE_KEY = "cart";

/**
 * Generate unique cart item ID
 * Format: cartitem_{timestamp}_{random}
 */
export const generateCartItemId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000000);
  return `cartitem_${timestamp}_${random}`;
};

/**
 * Get current cart array from localStorage
 */
export const getCart = () => {
  try {
    if (typeof localStorage === "undefined") return [];
    const cartData = localStorage.getItem(CART_STORAGE_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error("Error reading cart from localStorage:", error);
    return [];
  }
};

/**
 * Save cart array to localStorage
 */
export const saveCart = (cart) => {
  try {
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error("Error saving cart to localStorage:", error);
    return false;
  }
};

/**
 * Helper to get a sorted comma-separated string of selected addon IDs
 */
export const getSelectedAddonsKey = (addons = []) => {
  if (!Array.isArray(addons)) return "";
  return addons
    .filter((addon) => addon && addon.selected !== false && (addon.addonid || addon.id || addon._id))
    .map((addon) => String(addon.addonid || addon.id || addon._id))
    .sort()
    .join(",");
};

/**
 * Compare two cart items for equality based on:
 * - itemId
 * - selected addons
 * - specialInstructions
 */
export const areCartItemsEqual = (itemA, itemB) => {
  if (!itemA || !itemB) return false;

  const idA = String(itemA.itemId || itemA.itemid || itemA.id || "");
  const idB = String(itemB.itemId || itemB.itemid || itemB.id || "");
  if (!idA || !idB || idA !== idB) return false;

  const addonsA = getSelectedAddonsKey(itemA.addons);
  const addonsB = getSelectedAddonsKey(itemB.addons);
  if (addonsA !== addonsB) return false;

  const instrA = String(itemA.specialInstructions || "").trim().toLowerCase();
  const instrB = String(itemB.specialInstructions || "").trim().toLowerCase();
  return instrA === instrB;
};

/**
 * Merges duplicate items in a cart array by combining their quantities
 */
export const mergeDuplicateCartItems = (cart = []) => {
  if (!Array.isArray(cart) || cart.length <= 1) return cart || [];

  const merged = [];
  for (const item of cart) {
    const existingIndex = merged.findIndex((existing) => areCartItemsEqual(existing, item));
    if (existingIndex > -1) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: (merged[existingIndex].quantity || 1) + (item.quantity || 1),
      };
    } else {
      merged.push({ ...item });
    }
  }
  return merged;
};

/**
 * Add item to cart matching SavoryOps_UserApp specification:
 * If an item with identical itemId, addons, and special instructions exists, increments quantity.
 * Otherwise, creates a new cart entry with unique cartItemId.
 */
export const addItemToCart = (item, options = {}) => {
  try {
    const {
      addons = [],
      image = null,
      description = null,
      specialInstructions = "",
      quantity = 1,
      showToast = null,
    } = options;

    const existingCart = getCart();

    const itemToAdd = {
      itemId: item.itemid || item.id || item.itemId || item.dealsbundlesid,
      addons: addons,
      specialInstructions: specialInstructions || item.specialInstructions || "",
    };

    const existingItemIndex = existingCart.findIndex((cartItem) =>
      areCartItemsEqual(cartItem, itemToAdd)
    );

    let newCart;
    let resultingCartItem;
    const addQty = typeof quantity === "number" && quantity > 0 ? quantity : 1;

    if (existingItemIndex > -1) {
      // Same item and customizations already in cart -> increment quantity
      newCart = existingCart.map((cartItem, index) => {
        if (index === existingItemIndex) {
          resultingCartItem = {
            ...cartItem,
            quantity: (cartItem.quantity || 1) + addQty,
          };
          return resultingCartItem;
        }
        return cartItem;
      });
    } else {
      // New unique cart item entry
      resultingCartItem = {
        cartItemId: generateCartItemId(),
        itemId: item.itemid || item.id || item.itemId || item.dealsbundlesid,
        name: item.itemname || item.name || item.title || item.dealsbundlesname || "Delicious Item",
        price: Number(item.price || 0),
        rawPrice: item.rawPrice ?? item.price ?? 0,
        taxes: item.taxes || [],
        quantity: addQty,
        image: image || item.image || item.imageUrl || "",
        description: description || item.description || item.desc || "",
        itemtype: item.itemtype || item.itemType || (item.isVeg ? "Veg" : "Non-Veg"),
        addons: addons,
        specialInstructions: specialInstructions || item.specialInstructions || "",
      };
      newCart = [...existingCart, resultingCartItem];
    }

    const saved = saveCart(newCart);

    if (saved) {
      // Broadcast event for all components (Navbar, Menupage, Showcase) to re-render reactively
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: newCart }));
      }

      // Show user feedback toast/snackbar
      if (typeof showToast === "function") {
        const itemName = item.itemname || item.name || item.title || item.dealsbundlesname || "Item";
        showToast(`${itemName} added to cart!`, "success", 3000);
      }

      return { success: true, cart: newCart, cartItem: resultingCartItem };
    }

    return { success: false, cart: existingCart };
  } catch (error) {
    console.error("Error adding item to cart:", error);
    if (typeof options.showToast === "function") {
      options.showToast("Failed to add item to cart", "error", 3000);
    }
    return { success: false, error };
  }
};

/**
 * Get total quantity count of all items in cart
 */
export const getCartTotalCount = () => {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
};

/**
 * Get map of { [itemId]: totalQuantity }
 */
export const getItemQuantitiesMap = () => {
  const cart = getCart();
  const map = {};
  cart.forEach((item) => {
    const id = String(item.itemId || item.itemid || item.id);
    if (id) {
      map[id] = (map[id] || 0) + (Number(item.quantity) || 1);
    }
  });
  return map;
};

/**
 * Update quantity for a specific cart item
 */
export const updateCartItemQuantity = (cartItemId, newQuantity) => {
  try {
    const cart = getCart();
    let updated;
    if (newQuantity <= 0) {
      updated = cart.filter((i) => i.cartItemId !== cartItemId);
    } else {
      updated = cart.map((i) => (i.cartItemId === cartItemId ? { ...i, quantity: newQuantity } : i));
    }
    saveCart(updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updated }));
    }
    return updated;
  } catch (error) {
    console.error("Error updating cart quantity:", error);
    return getCart();
  }
};

/**
 * Remove a specific cart item
 */
export const removeCartItem = (cartItemId) => {
  return updateCartItemQuantity(cartItemId, 0);
};

/**
 * Update special instructions for a specific cart item
 */
export const updateCartItemInstructions = (cartItemId, instructions) => {
  try {
    const cart = getCart();
    const updated = cart.map((i) =>
      i.cartItemId === cartItemId ? { ...i, specialInstructions: instructions } : i
    );
    saveCart(updated);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updated }));
    }
    return updated;
  } catch (error) {
    console.error("Error updating cart item instructions:", error);
    return getCart();
  }
};

/**
 * Clear the entire cart
 */
export const clearCart = () => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: [] }));
    }
    return { success: true };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return { success: false, error };
  }
};

export default {
  getCart,
  saveCart,
  addItemToCart,
  getCartTotalCount,
  getItemQuantitiesMap,
  updateCartItemQuantity,
  removeCartItem,
  clearCart,
};