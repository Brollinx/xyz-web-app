import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "@/config";
import { Loader2, Clock, Milestone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [destination, setDestination] = useState<google.maps.LatLngLiteral | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  // State for directions details
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [steps, setSteps] = useState<google.maps.DirectionsStep[]>([]);

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
      const route = response.routes[0];
      if (route && route.legs[0]) {
        const leg = route.legs[0];
        setDistance(leg.distance?.text || null);
        setDuration(leg.duration?.text || null);
        setSteps(leg.steps || []);
      }
    } else {
      console.error(`Error fetching directions: ${status}`);
      toast.error("Could not calculate walking directions.");
    }
  }, []);

  if (loadError) {
    console.error("Google Maps script failed to load:", loadError);
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
    <div className="w-full flex-grow relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || destination || { lat: 0, lng: 0 }}
        zoom={15}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        {userLocation && destination && !directionsResponse && (
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

      {directionsResponse && (
        <Card className="absolute top-4 left-4 right-4 w-auto max-w-md m-auto bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Walking Directions</CardTitle>
            <div className="flex items-center justify-around text-sm text-gray-700 pt-2">
              {duration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-bold">{duration}</span>
                </div>
              )}
              {distance && (
                <div className="flex items-center gap-2">
                  <Milestone className="h-5 w-5 text-green-600" />
                  <span className="font-bold">{distance}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <ol className="space-y-3 list-decimal list-inside">
                {steps.map((step, index) => (
                  <li key={index} className="text-sm" dangerouslySetInnerHTML={{ __html: step.instructions }} />
                ))}
              </ol>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RoutePage;