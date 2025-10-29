import React, { createContext, useContext, ReactNode } from 'react';
import { useGeolocation as useGeolocationHook } from '@/hooks/useGeolocation';

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

const GeolocationContext = createContext<GeolocationContextType | undefined>(undefined);

export const GeolocationProvider = ({ children }: { children: ReactNode }) => {
  const geolocation = useGeolocationHook();
  return (
    <GeolocationContext.Provider value={geolocation}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = (): GeolocationContextType => {
  const context = useContext(GeolocationContext);
  if (context === undefined) {
    throw new Error('useGeolocation must be used within a GeolocationProvider');
  }
  return context;
};