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
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      setStatus('error');
      return;
    }

    setStatus('loading');
    const watcher = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus('success');
      },
      (err) => {
        setError(err);
        if (err.code === err.PERMISSION_DENIED) {
          setStatus('denied');
          toast.warning("Location access denied. Features requiring location will be limited.");
        } else {
          setStatus('error');
          toast.error("Error getting your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, []); // Empty dependency array ensures this runs only once

  return { location, status, error };
}