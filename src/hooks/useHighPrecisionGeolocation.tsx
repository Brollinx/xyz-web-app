import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

interface UserLocation {
  lat: number;
  lng: number;
  accuracy_meters: number;
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error' | 'prompt';

export function useHighPrecisionGeolocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
  const [watchId, setWatchId] = useState<number | null>(null);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setLocationStatus('error');
      setLoading(false);
      return;
    }

    setLoading(true);
    setLocationStatus('loading');

    // Clear any existing watch before starting a new one
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy_meters: position.coords.accuracy,
        };
        setUserLocation(newLocation);
        setLocationStatus('success');
        setLoading(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location access denied. Please enable location services for this site.");
            setLocationStatus('denied');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information is unavailable.");
            setLocationStatus('error');
            break;
          case error.TIMEOUT:
            toast.warning("The request to get user location timed out.");
            setLocationStatus('error');
            break;
          default:
            toast.error("An unknown error occurred while getting location.");
            setLocationStatus('error');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0, // No cached position
      }
    );
    setWatchId(newWatchId);
  }, [watchId]);

  useEffect(() => {
    getLocation();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [getLocation]); // Re-run when getLocation changes (which it won't due to useCallback dependencies)

  const refreshLocation = useCallback(() => {
    // Simply call getLocation again to restart the watch
    getLocation();
  }, [getLocation]);

  return { userLocation, loading, locationStatus, refreshLocation };
}