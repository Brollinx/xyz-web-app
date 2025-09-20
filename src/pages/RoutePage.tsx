import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl"; // Import mapboxgl for LngLatBounds
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import DevDebugOverlay from "@/components/DevDebugOverlay";

const containerStyle = {
  width: "100%",
  minHeight: "360px", // Ensure map is visible
  height: "60vh", // Ensure map is visible
};

interface MapboxStep {
  maneuver: {
    instruction: string;
  };
  distance: number; // Distance in meters for this step
  duration: number; // Duration in seconds for this step
}

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [loading, setLoading] = useState(true);

  const [totalDistance, setTotalDistance] = useState<string | null>(null);
  const [totalDuration, setTotalDuration] = useState<string | null>(null);
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
    if (!userLocation || !destination || !mapRef.current) return; // Ensure map is loaded

    const fetchDirections = async () => {
      setRouteError(false); // Reset error
      // Build the Mapbox Directions request URL exactly: lon,lat order
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?alternatives=false&geometries=geojson&overview=full&steps=true&access_token=${MAPBOX_TOKEN}`;
      
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
          console.debug('Mapbox directions response', route); // Debug log for troubleshooting

          const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          };
          setRouteGeoJson(newRouteGeoJson);

          const map = mapRef.current;
          if (map) {
            // Update or add source and layer
            if (map.getSource('route')) {
              (map.getSource('route') as mapboxgl.GeoJSONSource).setData(newRouteGeoJson);
            } else {
              map.addSource('route', { type: 'geojson', data: newRouteGeoJson });
              map.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                paint: {
                  'line-color': '#3b82f6', // Tailwind blue-500
                  'line-width': 6,
                },
              });
            }

            // Fit map to route bounds
            const coordinates = route.geometry.coordinates;
            const bounds = new mapboxgl.LngLatBounds();
            for (const coord of coordinates) {
              bounds.extend(coord as [number, number]);
            }
            map.fitBounds(bounds, { padding: 60, duration: 1000 });
          }

          const leg = route.legs[0];
          setTotalDistance(`${(route.distance / 1000).toFixed(1)} km`); // Total distance in km, 1 decimal
          setTotalDuration(`${Math.round(route.duration / 60)} min`); // Total duration in minutes, rounded
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
  }, [userLocation, destination, mapRef.current]); // Depend on mapRef.current to ensure map is loaded

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
        {/* Route layer is added/updated dynamically via mapRef.current */}
      </Map>

      {(steps.length > 0 || routeGeoJson) && ( // Show card if route line exists or steps are available
        <Card className="absolute top-4 left-4 right-4 w-auto max-w-md m-auto bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Walking Directions</CardTitle>
            <div className="flex items-center justify-around text-sm text-gray-700 pt-2">
              {totalDuration && (
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-bold">{totalDuration}</span>
                </div>
              )}
              {totalDistance && (
                <div className="flex items-center gap-2">
                  <Milestone className="h-5 w-5 text-green-600" />
                  <span className="font-bold">{totalDistance}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <ol className="space-y-3 list-decimal list-inside">
                {steps.length > 0 ? (
                  steps.map((step, index) => (
                    <li key={index} className="text-sm">
                      <span dangerouslySetInnerHTML={{ __html: step.maneuver.instruction }} />
                      {step.distance > 0 && <span className="text-gray-500 ml-2">({step.distance.toFixed(0)} m)</span>}
                    </li>
                  ))
                ) : (
                  routeGeoJson && <p className="text-center text-gray-500">Route found but no step-by-step details available.</p>
                )}
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