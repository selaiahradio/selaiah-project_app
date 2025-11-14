import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

let googleMapsLoaded = false;
let googleMapsLoadPromise = null;

// Cargar Google Maps API
export const loadGoogleMaps = async () => {
  if (googleMapsLoaded) return true;
  if (googleMapsLoadPromise) return googleMapsLoadPromise;

  googleMapsLoadPromise = new Promise(async (resolve, reject) => {
    try {
      // Obtener API key del backend usando base44 SDK
      const response = await base44.functions.invoke('getGoogleMapsConfig');
      
      if (!response.data || !response.data.apiKey) {
        throw new Error("No se pudo obtener la API key de Google Maps");
      }

      const config = response.data;

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
        reject(new Error("Error cargando Google Maps"));
      };

      document.head.appendChild(script);
    } catch (error) {
      googleMapsLoadPromise = null;
      reject(error);
    }
  });

  return googleMapsLoadPromise;
};

// Hook para geolocalización
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
        reject(new Error("Geolocalización no soportada"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          let message = "Error obteniendo ubicación";
          switch(error.code) {
            case error.PERMISSION_DENIED:
              message = "Permisos de ubicación denegados. Por favor, permite el acceso a tu ubicación.";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Ubicación no disponible en este momento";
              break;
            case error.TIMEOUT:
              message = "Tiempo de espera agotado obteniendo ubicación";
              break;
          }
          reject(new Error(message));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    });
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      await loadGoogleMaps();
      
      const geocoder = new window.google.maps.Geocoder();
      const latlng = { lat, lng };

      return new Promise((resolve, reject) => {
        geocoder.geocode({ location: latlng }, (results, status) => {
          if (status === "OK" && results[0]) {
            const addressComponents = results[0].address_components;
            const locationData = {
              formatted_address: results[0].formatted_address,
              city: addressComponents.find(c => c.types.includes("locality"))?.long_name || 
                    addressComponents.find(c => c.types.includes("administrative_area_level_2"))?.long_name || null,
              state: addressComponents.find(c => c.types.includes("administrative_area_level_1"))?.long_name || null,
              country: addressComponents.find(c => c.types.includes("country"))?.long_name || null,
              postal_code: addressComponents.find(c => c.types.includes("postal_code"))?.long_name || null,
            };
            resolve(locationData);
          } else {
            reject(new Error("No se pudo obtener la dirección"));
          }
        });
      });
    } catch (error) {
      console.error("Error en geocoding:", error);
      // Retornar ubicación básica si falla el geocoding
      return {
        formatted_address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        city: null,
        state: null,
        country: null,
        postal_code: null
      };
    }
  };

  const getLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log("Obteniendo posición GPS...");
      const position = await getCurrentPosition();
      console.log("Posición obtenida:", position);
      
      console.log("Obteniendo dirección...");
      const addressInfo = await reverseGeocode(position.latitude, position.longitude);
      console.log("Dirección obtenida:", addressInfo);

      const locationData = {
        latitude: position.latitude,
        longitude: position.longitude,
        ...addressInfo,
        location_type: "gps"
      };

      setLocation(locationData);
      return locationData;
    } catch (err) {
      const errorMessage = err.message || "Error desconocido obteniendo ubicación";
      setError(errorMessage);
      console.error("Error obteniendo ubicación:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const saveLocation = async (locationData) => {
    try {
      const user = await base44.auth.me();
      
      // Marcar otras ubicaciones como no primarias
      const existing = await base44.entities.UserLocation.filter({
        created_by: user.email,
        is_primary: true
      });

      for (const loc of existing) {
        await base44.entities.UserLocation.update(loc.id, { is_primary: false });
      }

      // Guardar nueva ubicación
      await base44.entities.UserLocation.create({
        ...locationData,
        user_email: user.email,
        is_primary: true
      });

      return true;
    } catch (error) {
      console.error("Error guardando ubicación:", error);
      throw error;
    }
  };

  return {
    location,
    error,
    loading,
    isSupported,
    getLocation,
    saveLocation
  };
};

export default useGeolocation;