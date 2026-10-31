export const getBrowserAndDeviceDetails = () => {
    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let device = "Desktop";
    let os = "Unknown OS";

    // Detect OS
    if (/windows/i.test(ua)) os = "Windows";
    else if (/macintosh|mac os x/i.test(ua)) os = "macOS";
    else if (/android/i.test(ua)) os = "Android";
    else if (/iphone|ipad|ipod/i.test(ua)) os = "iOS";
    else if (/linux/i.test(ua)) os = "Linux";

    // Detect Device Type
    if (/tablet|ipad|playbook|silk/i.test(ua)) {
        device = "Tablet";
    } else if (/mobile|iphone|ipod|android/i.test(ua)) {
        device = `Mobile (${os})`;
    } else {
        device = `Desktop (${os})`;
    }

    // Detect Browser
    if (/chrome|crios/i.test(ua) && !/edge|edg/i.test(ua) && !/opr|opera/i.test(ua)) {
        browser = "Chrome";
    } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
        browser = "Safari";
    } else if (/firefox|fxios/i.test(ua)) {
        browser = "Firefox";
    } else if (/edge|edg/i.test(ua)) {
        browser = "Edge";
    } else if (/opr|opera/i.test(ua)) {
        browser = "Opera";
    } else if (/trident/i.test(ua)) {
        browser = "Internet Explorer";
    }

    // Extract browser version
    const browserMatches = ua.match(/(chrome|safari|firefox|edge|edg|opr|opera|version)\/?\s*(\d+)/i) || [];
    const version = browserMatches[2] ? ` v${browserMatches[2]}` : "";

    return {
        browserdetails: `${browser}${version}`,
        device: device
    };
};

// Helper to get browser GPS / Wi-Fi coordinates with a short timeout
const getBrowserCoordinates = () => {
    return new Promise((resolve) => {
        if (typeof window === 'undefined' || !navigator.geolocation) {
            return resolve(null);
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                if (position?.coords) {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                } else {
                    resolve(null);
                }
            },
            () => resolve(null),
            {
                enableHighAccuracy: true,
                timeout: 3500,
                maximumAge: 300000 // 5 minutes cache
            }
        );
    });
};

// Helper to reverse geocode latitude and longitude into City, State, Country
const reverseGeocodeCoordinates = async (latitude, longitude) => {
    // Primary: BigDataCloud Reverse Geocoding API (Fast, Free, Client-side)
    try {
        const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        );
        if (response.ok) {
            const data = await response.json();
            const city = data.city || data.locality || data.principalSubdivisionLocality || '';
            const state = data.principalSubdivision || '';
            const country = data.countryName || '';
            const parts = [city, state, country].filter(Boolean);
            if (parts.length > 0) {
                return parts.join(', ');
            }
        }
    } catch (error) {
        console.warn('BigDataCloud reverse geocode failed:', error);
    }

    // Fallback: OpenStreetMap Nominatim
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`
        );
        if (response.ok) {
            const data = await response.json();
            const addr = data.address || {};
            const city = addr.city || addr.town || addr.village || addr.county || addr.state_district || '';
            const state = addr.state || '';
            const country = addr.country || '';
            const parts = [city, state, country].filter(Boolean);
            if (parts.length > 0) {
                return parts.join(', ');
            }
        }
    } catch (error) {
        console.warn('Nominatim reverse geocode failed:', error);
    }

    return null;
};

// Helper to get public IP address
const getPublicIpAddress = async () => {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        if (response.ok) {
            const data = await response.json();
            if (data.ip) return data.ip;
        }
    } catch {
        // ignore and fallback
    }

    return 'Unknown';
};

export const getIpAndLocation = async () => {
    try {
        // 1. Try accurate browser geolocation first (works on HTTPS / localhost)
        const coordsPromise = getBrowserCoordinates();
        const ipPromise = getPublicIpAddress();

        const [coords, detectedIp] = await Promise.all([coordsPromise, ipPromise]);

        if (coords) {
            const accurateLocation = await reverseGeocodeCoordinates(coords.latitude, coords.longitude);
            if (accurateLocation) {
                return {
                    ipaddress: detectedIp && detectedIp !== 'Unknown' ? detectedIp : 'Unknown',
                    location: accurateLocation
                };
            }
        }
    } catch (error) {
        console.warn('Accurate geolocation lookup failed, falling back to IP geolocation:', error);
    }

    // 2. High-accuracy IP Geolocation via ipwho.is (Correctly resolves Surat, Gujarat)
    try {
        const response = await fetch('https://ipwho.is/');
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.city) {
                const parts = [data.city, data.region, data.country].filter(Boolean);
                return {
                    ipaddress: data.ip || 'Unknown',
                    location: parts.join(', ') || 'Unknown'
                };
            }
        }
    } catch (error) {
        console.warn('Failed to get location via ipwho.is:', error);
    }

    // 3. Fallback IP Geolocation via freeipapi
    try {
        const response = await fetch('https://freeipapi.com/api/json/');
        if (response.ok) {
            const data = await response.json();
            if (data.cityName || data.countryName) {
                const parts = [data.cityName, data.regionName, data.countryName].filter(Boolean);
                return {
                    ipaddress: data.ipAddress || 'Unknown',
                    location: parts.join(', ') || 'Unknown'
                };
            }
        }
    } catch (error) {
        console.warn('Failed to get location via freeipapi:', error);
    }

    // 4. Fallback to GeoJS
    try {
        const response = await fetch('https://get.geojs.io/v1/ip/geo.json');
        if (response.ok) {
            const data = await response.json();
            if (data.city || data.country) {
                const parts = [data.city, data.region, data.country].filter(Boolean);
                return {
                    ipaddress: data.ip || 'Unknown',
                    location: parts.join(', ') || 'Unknown'
                };
            }
        }
    } catch (error) {
        console.warn('Failed to get location via geojs:', error);
    }

    return {
        ipaddress: 'Unknown',
        location: 'Unknown'
    };
};