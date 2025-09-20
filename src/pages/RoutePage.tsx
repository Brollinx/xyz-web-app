import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/config";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const containerStyle = {
  width: "100%",
  height: "calc(100vh - 4rem)", // Adjust height to account for layout header
};

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

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
      console.error(`error fetching directions ${response}`);
      toast.error("Could not calculate walking directions.");
    }
  }, []);

  if (loadError) return <div>Error loading map.</div>;
  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading map and calculating route...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
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