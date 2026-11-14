import { clearStorageOnLogout } from './authUtils';

const CheckToken = (token, logoutUser, navigate) => {
    const URL = import.meta.env.VITE_URL || "/signin";
    const currentUrl = window.location.href;
    const customerTokenName = import.meta.env.VITE_CUSTOMERTOKEN_NAME;
    const activeToken =
        token ||
        (typeof localStorage !== "undefined" && customerTokenName
            ? localStorage.getItem(customerTokenName)
            : null);

    if (!activeToken && !currentUrl.includes(URL) && !window.location.pathname.includes("/signin")) {
        console.log("Token not found in localStorage. Redirecting to login...");
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
        if (typeof navigate === "function") {
            navigate("/signin");
        } else {
            window.location.href = URL;
        }
        return false;
    }
    return true;
};

export default CheckToken;