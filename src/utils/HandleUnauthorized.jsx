import { removeCustomerFcmToken } from './firebase';
import { clearStorageOnLogout } from './authUtils';

const HandleUnauthorized = (result, logoutUser, navigate) => {
    const currentUrl = window.location.href;
    const URL = import.meta.env.VITE_URL || "/signin";

    const unauthorizedMessages = [
        "Unauthorized, Token Not Get",
        "Unauthorized, Token does not match",
        "Token expired, please log in again",
        "Invalid token, please log in again",
        "Unauthorized HTTP, Token not provided",
    ];

    if (unauthorizedMessages.includes(result?.message) || result?.status === 401) {
        console.log("Unauthorized / Token expired. Cleaning FCM and redirecting to Signin...");
        try {
            removeCustomerFcmToken();
        } catch { /* ignore */ }

        if (typeof logoutUser === "function") {
            try {
                logoutUser();
            } catch { /* ignore */ }
        } else {
            clearStorageOnLogout();
            if (typeof window !== "undefined") {
                window.dispatchEvent(
                    new CustomEvent("customerAuthChange", {
                        detail: { isLoggedIn: false, customerId: null },
                    })
                );
            }
        }

        if (!currentUrl.includes(URL) && !window.location.pathname.includes("/signin")) {
            if (typeof navigate === "function") {
                navigate("/signin");
            } else {
                window.location.href = URL;
            }
            return true;
        }
        return true;
    }
    return false;
};

export default HandleUnauthorized;