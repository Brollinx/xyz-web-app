import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl"; // Import mapboxgl
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions"; // Import MapboxDirections
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css"; // Import directions CSS
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone, Footprints } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import DevDebugOverlay from "@/components/DevDebugOverlay"; // Import the new debug overlay

// Set Mapbox access token globally for the Directions plugin
mapboxgl.accessToken = MAPBOX_TOKEN;

const containerStyle = {
  width: "100%",
  minHeight: "360px", // Ensure map is visible
  height: "60vh", // Ensure map is visible
};

interface UserLocation {
  lat: number;
  lng: number;
}

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [lastDirectionsResponseSummary, setLastDirectionsResponseSummary] = useState<any>(null);
  const [routeError, setRouteError] = useState(false);
  const [directionsPluginActive, setDirectionsPluginActive] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null); // Ref to get map instance
  const directionsRef = useRef<MapboxDirections | null>(null);

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

  // Effect for Mapbox Directions plugin
  useEffect(() => {
    if (mapRef.current && userLocation && destination) {
      let directionsInstance = directionsRef.current;

      if (!directionsInstance) {
        console.log("Mapbox Directions: Initializing plugin.");
        directionsInstance = new MapboxDirections({
          accessToken: MAPBOX_TOKEN,
          unit: "metric",
          profile: "mapbox/walking",
          alternatives: false,
          geometries: "geojson",
          controls: { inputs: false, instructions: false, profileSwitcher: false }, // Hide input fields and instruction panel
          flyTo: false, // Prevent map from flying to route on initial load
        });

        mapRef.current.addControl(directionsInstance, "top-left");
        directionsRef.current = directionsInstance;
        setDirectionsPluginActive(true);

        // Add the route event listener only once when the plugin is initialized
        directionsInstance.on('route', (event) => {
          console.log("Mapbox Directions 'route' event:", event);
          if (event.route && event.route[0] && mapRef.current) {
            const route = event.route[0];
            const bounds = directionsInstance?.getBounds();
            if (bounds) {
              mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
            }
            setDistance(`${(route.distance / 1000).toFixed(1)} km`);
            setDuration(`${Math.round(route.duration / 60)} min`);
            setRouteError(false); // Route successfully rendered
          } else {
            console.warn("Mapbox Directions 'route' event: No route found in event data.");
            setRouteError(true); // Indicate route rendering issue
            setDistance(null);
            setDuration(null);
          }
          setLastDirectionsResponseSummary({
            code: event.code,
            uuid: event.uuid,
            waypoints: event.waypoints?.length,
            routes: event.route?.length,
            message: event.message,
          });
          setLoading(false); // Route calculation finished
        });

        directionsInstance.on('error', (event) => {
          console.error("Mapbox Directions 'error' event:", event);
          toast.error("Error calculating route.");
          setRouteError(true);
          setLoading(false);
        });

      } else {
        console.log("Mapbox Directions: Clearing existing routes and setting new origin/destination.");
        directionsInstance.removeRoutes(); // Clear existing routes
        setLoading(true); // Set loading true again for new route calculation
        setRouteError(false); // Reset error for new attempt
      }

      console.log("Mapbox Directions: Setting origin and destination.");
      directionsInstance.setOrigin([userLocation.lng, userLocation.lat]);
      directionsInstance.setDestination([destination.lng, destination.lat]);
    } else if (!userLocation || !destination) {
      // If userLocation or destination is missing, and we're not loading, then we're in an error state
      if (!loading) {
        setRouteError(true);
      }
    }

    return () => {
      if (mapRef.current && directionsRef.current) {
        console.log("Mapbox Directions: Removing plugin control.");
        // The 'route' event listener is implicitly cleaned up when the directions instance is removed.
        mapRef.current.removeControl(directionsRef.current);
        directionsRef.current = null;
        setDirectionsPluginActive(false);
      }
    };
  }, [mapRef.current, userLocation, destination]);

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
            directionsPluginActive={directionsPluginActive}
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
      </Map>

      {(distance && duration) && (
        <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm shadow-lg z-10 p-2">
          <CardContent className="flex items-center gap-4 p-0">
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <Footprints className="h-4 w-4 text-blue-600" />
              <span className="font-bold">{duration}</span>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <Milestone className="h-4 w-4 text-green-600" />
              <span className="font-bold">{distance}</span>
            </div>
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
          directionsPluginActive={directionsPluginActive}
          origin={userLocation}
          destination={destination}
          onOpenGoogleMaps={handleOpenGoogleMaps}
        />
      )}
    </div>
  );
};

export default RoutePage;