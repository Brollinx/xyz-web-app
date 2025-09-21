import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import DevDebugOverlay from "@/components/DevDebugOverlay"; // Import the new debug overlay

const containerStyle = {
  width: "100%",
  minHeight: "360px", // Ensure map is visible
  height: "60vh", // Ensure map is visible
};

interface MapboxStep {
  maneuver: {
    instruction: string;
  };
}

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [loading, setLoading] = useState(true);

  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [steps, setSteps] = useState<MapboxStep[]>([]);
  const [lastDirectionsResponseSummary, setLastDirectionsResponseSummary] = useState<any>(null);
  const [routeError, setRouteError] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null); // Ref to get map instance

  useEffect(() => {
    const destLat = searchParams.get("lat");
    const destLng = searchParams.get("lng");

    if (destLat && destLng) {
      setDestination({ lat: parseFloat(destLat), lng: parseFloat(destLng) });
    } else {
      toast.error("Destination coordinates are missing.");
      setLoading(false);
      setRouteError(true);
    }

    if (navigator.geolocation) {
      console.log("Geolocation is available.");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          console.log("User location obtained:", position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast.error("Could not get your location. Cannot calculate route.");
          setLoading(false);
          setRouteError(true);
        }
      );
    } else {
      console.warn("Geolocation is not supported by your browser.");
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
      setRouteError(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!userLocation || !destination) return;

    const fetchDirections = async () => {
      setRouteError(false); // Reset error
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      // Log the request URL (redacting token for safety in logs)
      console.log("Directions API Request URL (token redacted):", url.replace(`access_token=${MAPBOX_TOKEN}`, "access_token=REDACTED"));

      try {
        const response = await fetch(url);
        const data = await response.json();

        // Log the full JSON response
        console.log("Directions API Response:", data);
        setLastDirectionsResponseSummary({
          code: data.code,
          uuid: data.uuid,
          waypoints: data.waypoints?.length,
          routes: data.routes?.length,
          message: data.message, // Include error message if present
        });

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteGeoJson({
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          });
          const leg = route.legs[0];
          setDistance(`${(route.distance / 1000).toFixed(2)} km`);
          setDuration(`${Math.round(route.duration / 60)} min`);
          setSteps(leg.steps.filter((step: any) => step.maneuver && step.maneuver.instruction));
        } else {
          toast.error("Could not find a walking route.");
          setRouteError(true);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        toast.error("Failed to fetch walking directions.");
        setRouteError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDirections();
  }, [userLocation, destination]);

  const handleOpenGoogleMaps = () => {
    if (userLocation && destination) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=walking`;
      window.open(googleMapsUrl, "_blank");
    } else {
      toast.error("Cannot open Google Maps: origin or destination is missing.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading map and calculating route...</p>
        {import.meta.env.DEV && (
          <DevDebugOverlay
            mapboxTokenPresent={!!MAPBOX_TOKEN}
            geolocationAvailable={!!navigator.geolocation}
            mapInstanceExists={!!mapRef.current}
            origin={userLocation}
            destination={destination}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex-grow relative">
      <Map
        initialViewState={{
          longitude: userLocation?.lng || destination?.lng || 0,
          latitude: userLocation?.lat || destination?.lat || 0,
          zoom: 15,
        }}
        style={containerStyle}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        ref={(instance) => {
          if (instance) {
            mapRef.current = instance.getMap();
          }
        }}
      >
        {userLocation && <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />}
        {destination && <Marker longitude={destination.lng} latitude={destination.lat} color="#FF0000" />}
        {routeGeoJson && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                "line-color": "#007cbf",
                "line-width": 5,
              }}
            />
          </Source>
        )}
      </Map>

      {steps.length > 0 && (
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
                  <li key={index} className="text-sm" dangerouslySetInnerHTML={{ __html: step.maneuver.instruction }} />
                ))}
              </ol>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {import.meta.env.DEV && (
        <DevDebugOverlay
          mapboxTokenPresent={!!MAPBOX_TOKEN}
          geolocationAvailable={!!navigator.geolocation}
          mapInstanceExists={!!mapRef.current}
          lastDirectionsResponseSummary={lastDirectionsResponseSummary}
          routeError={routeError}
          origin={userLocation}
          destination={destination}
          onOpenGoogleMaps={handleOpenGoogleMaps}
        />
      )}
    </div>
  );
};

export default RoutePage;