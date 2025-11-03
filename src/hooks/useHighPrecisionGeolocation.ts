import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

interface UserLocationData {
  lat: number;
  lng: number;
  accuracy_meters: number;
  timestamp: number;
}

const LOCATION_CACHE_KEY = "highPrecisionUserLocation";
const MAX_AGE_MS = 5 * 60 * 1000; // Cache location for 5 minutes

async function getHighPrecisionUserLocation(samples = 5, interval = 600): Promise<UserLocationData> {
  return new Promise((resolve, reject) => {
    const readings: UserLocationData[] = [];
    let count = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const success = (pos: GeolocationPosition) => {
      readings.push({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy_meters: pos.coords.accuracy,
        timestamp: pos.timestamp,
      });
      count++;

      if (count >= samples) {
        readings.sort((a, b) => a.accuracy_meters - b.accuracy_meters);
        if (timeoutId) clearTimeout(timeoutId);
        resolve(readings[0]);
      } else {
        timeoutId = setTimeout(() => {
          navigator.geolocation.getCurrentPosition(success, reject, {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 10000,
          });
        }, interval);
      }
    };

    navigator.geolocation.getCurrentPosition(success, reject, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    });
  });
}

export function useHighPrecisionGeolocation() {
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [locationStatus, setLocationStatus] = useState<"idle" | "loading" | "success" | "denied">("idle");

  const fetchLocation = useCallback(async (showToast = true) => {
    setLoading(true);
    setError(null);
    setLocationStatus("loading");

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser.");
      }

      const cachedLocation = localStorage.getItem(LOCATION_CACHE_KEY);
      if (cachedLocation) {
        const parsedLocation: UserLocationData = JSON.parse(cachedLocation);
        if (Date.now() - parsedLocation.timestamp < MAX_AGE_MS) {
          setUserLocation(parsedLocation);
          setLocationStatus("success");
          setLoading(false);
          if (showToast) toast.success(`Using cached location (Accuracy: ${Math.round(parsedLocation.accuracy_meters)} m)`);
          return;
        }
      }

      if (showToast) toast.loading("Getting high-precision location...", { id: "location-fetch" });
      const newLocation = await getHighPrecisionUserLocation();
      
      setUserLocation(newLocation);
      localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(newLocation));
      setLocationStatus("success");
      if (showToast) toast.success(`Location updated (Accuracy: ${Math.round(newLocation.accuracy_meters)} m)`, { id: "location-fetch" });
    } catch (err) {
      console.error("Error fetching high-precision location:", err);
      setError(err as GeolocationPositionError);
      setLocationStatus("denied");
      if (showToast) toast.error(`Failed to get location: ${(err as Error).message || "Permission denied."}`, { id: "location-fetch" });
      setUserLocation(null); // Clear location on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation(false); // Fetch on mount, but don't show toast initially
  }, [fetchLocation]);

  const refreshLocation = useCallback(() => {
    fetchLocation(true); // Show toast on manual refresh
  }, [fetchLocation]);

  return { userLocation, loading, error, locationStatus, refreshLocation };
}