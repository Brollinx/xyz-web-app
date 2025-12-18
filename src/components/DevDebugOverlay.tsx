import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes"; // Import useTheme

interface DevDebugOverlayProps {
  mapboxTokenPresent: boolean;
  geolocationAvailable: boolean;
  mapInstanceExists: boolean;
  lastDirectionsResponseSummary?: any; // Console-safe summary
  directionsPluginActive?: boolean; // For StoreDetailsPage
  routeError?: boolean; // For RoutePage
  origin?: { lat: number; lng: number } | null;
  destination?: { lat: number; lng: number } | null;
  onOpenGoogleMaps?: () => void; // Callback for Google Maps button
}

const DevDebugOverlay: React.FC<DevDebugOverlayProps> = ({
  mapboxTokenPresent,
  geolocationAvailable,
  mapInstanceExists,
  lastDirectionsResponseSummary,
  directionsPluginActive,
  routeError,
  origin,
  destination,
  onOpenGoogleMaps,
}) => {
  if (import.meta.env.PROD) {
    return null; // Only show in development
  }

  const { theme } = useTheme(); // Get current theme

  return (
    <Card className="absolute bottom-4 right-4 w-80 bg-yellow-100/90 backdrop-blur-sm shadow-lg z-50 text-xs dark:bg-yellow-900/90 dark:text-yellow-50">
      <CardHeader className="p-2 pb-0">
        <CardTitle className="text-sm">Dev Debug Info</CardTitle>
      </CardHeader>
      <CardContent className="p-2 pt-1 space-y-1">
        <p>Current Theme: <span className="font-semibold">{theme}</span></p> {/* Display current theme */}
        <p>Mapbox Token: <span className={mapboxTokenPresent ? "text-green-600" : "text-red-600"}>{mapboxTokenPresent ? "Present" : "MISSING!"}</span></p>
        <p>Geolocation: <span className={geolocationAvailable ? "text-green-600" : "text-red-600"}>{geolocationAvailable ? "Available" : "Unavailable"}</span></p>
        <p>Map Instance: <span className={mapInstanceExists ? "text-green-600" : "text-red-600"}>{mapInstanceExists ? "Exists" : "Not loaded"}</span></p>
        {directionsPluginActive !== undefined && (
          <p>Directions Plugin: <span className={directionsPluginActive ? "text-green-600" : "text-red-600"}>{directionsPluginActive ? "Active" : "Inactive"}</span></p>
        )}
        {origin && <p>Origin: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}</p>}
        {destination && <p>Dest: {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}</p>}
        {lastDirectionsResponseSummary && (
          <div>
            <p>Last Directions Response:</p>
            <pre className="bg-gray-50 p-1 rounded overflow-auto max-h-20 dark:bg-gray-800 dark:text-gray-200">{JSON.stringify(lastDirectionsResponseSummary, null, 2)}</pre>
          </div>
        )}
        {routeError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-2 py-1 rounded relative mt-2 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200">
            <p className="font-bold">ROUTE ERROR: No route returned!</p>
            {onOpenGoogleMaps && (
              <Button variant="destructive" size="sm" className="mt-1 w-full" onClick={onOpenGoogleMaps}>
                Open external directions
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DevDebugOverlay;