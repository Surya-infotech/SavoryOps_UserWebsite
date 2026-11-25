import { removeCustomerFcmToken } from './firebase';
import { clearStorageOnLogout } from './authUtils';

const HandleUnauthorized = (result, logoutUser, navigate) => {
    const unauthorizedMessages = [
        "Unauthorized, Token Not Get",
        "Unauthorized, Token does not match",
        "Token expired, please log in again",
        "Invalid token, please log in again",
        "Unauthorized HTTP, Token not provided",
    ];

    if (unauthorizedMessages.includes(result?.message) || result?.status === 401) {
        console.log("Unauthorized / Token expired. Cleaning FCM and redirecting to Home...");
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

        if (typeof window !== "undefined" && window.location.pathname !== "/") {
            if (typeof navigate === "function") {
                navigate("/", { replace: true });
            } else {
                const homeUrl = `${window.location.origin}/`;
                window.location.replace(homeUrl);
            }
        }
        return true;
    }
    return false;
};

export default HandleUnauthorized;