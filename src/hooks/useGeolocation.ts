import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';

export function useGeolocation() {
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<GeolocationPositionError | null>(null);

  useEffect(() => {
    let watcher: number;

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setStatus('error');
      return;
    }

    const handleSuccess = (position: GeolocationPosition) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
      setStatus('success');
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err);
      if (err.code === err.PERMISSION_DENIED) {
        setStatus('denied');
        toast.warning("Location access denied. Features requiring location will be limited.");
      } else {
        setStatus('error');
        // Provide a more detailed error message
        toast.error(`Error getting your location: ${err.message}`);
      }
    };

    setStatus('loading');
    watcher = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 20000, // Increased timeout to 20 seconds
        maximumAge: 0,
      }
    );

    return () => {
      if (watcher) {
        navigator.geolocation.clearWatch(watcher);
      }
    };
  }, []); // Empty dependency array ensures this runs only once

  return { location, status, error };
}