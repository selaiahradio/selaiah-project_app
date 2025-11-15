
import { useState, useEffect } from "react";
import { appParams } from "@/lib/app-params";

const API_BASE_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/api";
const GOOGLE_MAPS_CONFIG_URL = "https://us-central1-selaiah-radio.cloudfunctions.net/getGoogleMapsConfig";
const token = appParams.token;

let googleMapsLoaded = false;
let googleMapsLoadPromise = null;

// --- START: New API Functions ---

const fetcher = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error(`API Error on ${url}:`, errorBody);
    throw new Error(`Request failed with status ${response.status}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return null;
};

const getMe = () => {
    if (!token) return Promise.resolve(null);
    return fetcher(`${API_BASE_URL}/auth/me`).catch(() => null);
};

export const loadGoogleMaps = async () => {
  if (googleMapsLoaded) return true;
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise(async (resolve, reject) => {
    try {
      const config = await fetcher(GOOGLE_MAPS_CONFIG_URL);
      if (!config || !config.apiKey) {
        throw new Error("Could not retrieve Google Maps API key");
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=places,geocoding`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        googleMapsLoaded = true;
        resolve(true);
      };
      
      script.onerror = () => {
        googleMapsLoadPromise = null;
        reject(new Error("Error loading Google Maps script"));
      };

      document.head.appendChild(script);
    } catch (error) {
      googleMapsLoadPromise = null;
      reject(error);
    }
  });

  return googleMapsLoadPromise;
};

// --- END: New API Functions ---

export const useGeolocation = () => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported('geolocation' in navigator);
  }, []);

  const getCurrentPosition = () => {
     return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocalización no soportada"));
      }
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const reverseGeocode = async (lat, lng) => {
    await loadGoogleMaps();
    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };
    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK" && results[0]) {
          const addressComponents = results[0].address_components;
          const locationData = {
            formatted_address: results[0].formatted_address,
            city: addressComponents.find(c => c.types.includes("locality"))?.long_name || null,
            state: addressComponents.find(c => c.types.includes("administrative_area_level_1"))?.long_name || null,
            country: addressComponents.find(c => c.types.includes("country"))?.long_name || null,
          };
          resolve(locationData);
        } else {
          reject(new Error("Reverse geocoding failed"));
        }
      });
    });
  };

  const getLocation = async () => {
    setLoading(true);
    setError(null);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const addressInfo = await reverseGeocode(latitude, longitude);
      const locationData = { latitude, longitude, ...addressInfo, location_type: "gps" };
      setLocation(locationData);
      return locationData;
    } catch (err) {
      const errorMessage = err.code === 1 ? "Permisos de ubicación denegados." : "No se pudo obtener la ubicación.";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async (locationData) => {
    const user = await getMe();
    if (!user) throw new Error("User not authenticated");

    // In a real-world scenario, this logic might be better handled in the backend
    // to avoid multiple client-side requests.
    const existingLocations = await fetcher(`${API_BASE_URL}/user_locations?user_email=${user.email}&is_primary=true`);

    for (const loc of existingLocations) {
      await fetcher(`${API_BASE_URL}/user_locations/${loc.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_primary: false })
      });
    }

    const newLocationPayload = {
      ...locationData,
      user_email: user.email,
      is_primary: true
    };
    
    return fetcher(`${API_BASE_URL}/user_locations`, {
      method: 'POST',
      body: JSON.stringify(newLocationPayload)
    });
  };
  
    const hasPrimaryLocation = async () => {
        const user = await getMe();
        if (!user) return false;
        try {
            const locations = await fetcher(`${API_BASE_URL}/user_locations?user_email=${user.email}&is_primary=true&limit=1`);
            return locations && locations.length > 0;
        } catch (error) {
            console.error("Error checking for primary location:", error);
            return false;
        }
    };


  return { location, error, loading, isSupported, getLocation, saveLocation, hasPrimaryLocation };
};

export default useGeolocation;
