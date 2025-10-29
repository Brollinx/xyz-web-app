import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { toast } from 'sonner';

interface Location {
  lat: number;
  lng: number;
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'error';

interface GeolocationContextType {
  location: Location | null;
  status: LocationStatus;
  error: GeolocationPositionError | null;
  retry: () => void;
}

// The actual hook logic that powers the provider
function useGeolocationHook() {
  const [location, setLocation] = useState<Location | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const [trigger, setTrigger] = useState(0);

  const retry = useCallback(() => {
    setLocation(null);
    setStatus('loading');
    setError(null);
    setTrigger(t => t + 1);
  }, []);

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
      setError(null);
    };

    const handleError = (err: GeolocationPositionError) => {
      setError(err);
      if (err.code === err.PERMISSION_DENIED) {
        setStatus('denied');
        toast.warning("Location access denied. Features requiring location will be limited.");
      } else {
        setStatus('error');
        toast.error(`Error getting your location: ${err.message}`);
      }
    };

    setStatus('loading');
    watcher = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watcher) {
        navigator.geolocation.clearWatch(watcher);
      }
    };
  }, [trigger]);

  return { location, status, error, retry };
}

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

// The Provider component to wrap your app
export const GeolocationProvider = ({ children }: { children: ReactNode }) => {
  const geolocation = useGeolocationHook();
  return (
    <GeolocationContext.Provider value={geolocation}>
      {children}
    </GeolocationContext.Provider>
  );
};

// The context consumer hook for components
export const useGeolocation = (): GeolocationContextType => {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
};