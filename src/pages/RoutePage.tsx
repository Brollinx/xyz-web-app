import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/config";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const containerStyle = {
  width: "100%",
  height: "100%", // Changed to fill parent
};

const fallbackContainerStyle = {
  width: "100%",
  height: "400px",
  minHeight: "300px",
};

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // --- Diagnostics State ---
  const [permissionStatus, setPermissionStatus] = useState('checking...');
  const [useFallbackStyle, setUseFallbackStyle] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // --- Diagnostic Effects ---
  useEffect(() => {
    console.log("RoutePage mounted. Checking Google Maps script...");
    if (window.google) {
      console.log("Google Maps script already loaded.");
    }
  }, []);

  useEffect(() => {
    if ('geolocation' in navigator && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((status) => {
        setPermissionStatus(status.state);
        status.onchange = () => setPermissionStatus(status.state);
      });
    } else {
      setPermissionStatus('not available');
    }
  }, []);

  useEffect(() => {
    if (isLoaded && !loadError) {
      const timer = setTimeout(() => {
        if (mapContainerRef.current) {
          console.log(`Map container ref found. Height: ${mapContainerRef.current.clientHeight}px`);
          if (mapContainerRef.current.clientHeight === 0) {
            console.warn("Map container has zero height. Applying fallback style.");
            setUseFallbackStyle(true);
          }
        } else {
          console.error("Map container ref not found after load.");
        }
      }, 500); // Delay to allow CSS to apply
      return () => clearTimeout(timer);
    }
  }, [isLoaded, loadError]);

  // --- Core Functionality Effects ---
  useEffect(() => {
    const destLat = searchParams.get("lat");
    const destLng = searchParams.get("lng");

    if (destLat && destLng) {
      setDestination({ lat: parseFloat(destLat), lng: parseFloat(destLng) });
    } else {
      toast.error("Destination coordinates are missing.");
      setLoading(false);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLoading(false);
        },
        () => {
          toast.error("Could not get your location. Cannot calculate route.");
          setLoading(false);
        }
      );
    } else {
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, [searchParams]);

  const directionsCallback = useCallback((response: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === "OK" && response) {
      setDirectionsResponse(response);
    } else {
      console.error(`Error fetching directions: ${status}`);
      toast.error("Could not calculate walking directions.");
    }
  }, []);

  const DebugPanel = () => (
    <div className="fixed bottom-2 left-2 bg-gray-900 bg-opacity-80 text-white p-3 rounded-lg z-50 text-xs font-mono shadow-lg">
      <h4 className="font-bold text-sm mb-2 border-b border-gray-600 pb-1">Dev Debug Panel</h4>
      <p>Geolocation API: <span className="font-bold">{'geolocation' in navigator ? 'Available' : 'Not Available'}</span></p>
      <p>Permission: <span className="font-bold">{permissionStatus}</span></p>
      <p>Maps Script Loaded: <span className="font-bold">{isLoaded ? 'Yes' : 'No'}</span></p>
      <p>window.google: <span className="font-bold">{window.google ? 'Loaded' : 'Not Loaded'}</span></p>
      <p>Map Load Error: <span className="font-bold text-red-400">{loadError ? 'Yes' : 'None'}</span></p>
      {loadError && <p className="pl-2">- {loadError.message}</p>}
      <p>Container Height: <span className="font-bold">{mapContainerRef.current?.clientHeight ?? 'N/A'}px</span></p>
      <p>Using Fallback Style: <span className="font-bold">{useFallbackStyle ? 'Yes' : 'No'}</span></p>
    </div>
  );

  if (loadError) {
    console.error("Google Maps script failed to load:", loadError);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {import.meta.env.DEV && <DebugPanel />}
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center" role="alert">
          <strong className="font-bold text-lg block">Map failed to load!</strong>
          <span className="block mt-1">Check API key & browser console for errors.</span>
        </div>
      </div>
    );
  }

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading map and calculating route...</p>
      </div>
    );
  }

  return (
    <div ref={mapContainerRef} className="w-full h-full flex-grow">
      {import.meta.env.DEV && <DebugPanel />}
      <GoogleMap
        mapContainerStyle={useFallbackStyle ? fallbackContainerStyle : containerStyle}
        center={userLocation || destination || { lat: 0, lng: 0 }}
        zoom={15}
      >
        {userLocation && destination && (
          <DirectionsService
            options={{
              destination: destination,
              origin: userLocation,
              travelMode: google.maps.TravelMode.WALKING,
            }}
            callback={directionsCallback}
          />
        )}
        {directionsResponse && (
          <DirectionsRenderer
            options={{
              directions: directionsResponse,
            }}
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default RoutePage;