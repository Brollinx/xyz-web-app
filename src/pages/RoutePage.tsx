import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone, Car, Walk } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg";
import NavIcon from "@/assets/nav.svg";
import mapboxgl, { LinePaint } from "mapbox-gl";
import DevDebugOverlay from "@/components/DevDebugOverlay"; // Import DevDebugOverlay

const containerStyle = {
  width: "100%",
  minHeight: "360px",
  height: "100vh",
};

type TravelMode = 'walking' | 'driving';

const getBounds = (geometry: Geometry) => {
  if (geometry.type !== 'LineString') {
    return null;
  }
  const coordinates = geometry.coordinates as [number, number][];
  if (coordinates.length === 0) {
    return null;
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLng = Math.max(maxLng, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  }

  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
};

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [loading, setLoading] = useState(true);
  const [travelMode, setTravelMode] = useState<TravelMode>('walking'); // Default to walking

  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const watchId = useRef<number | null>(null);

  // Debug states
  const [lastDirectionsResponseSummary, setLastDirectionsResponseSummary] = useState<any>(null);
  const [routeError, setRouteError] = useState(false);
  const [geolocationAvailable, setGeolocationAvailable] = useState(false);

  const fetchDirections = useCallback(async (origin: { lat: number; lng: number }, dest: { lat: number; lng: number }, mode: TravelMode) => {
    setLoading(true);
    setRouteError(false);
    const url = `https://api.mapbox.com/directions/v5/mapbox/${mode}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    console.log("Directions API Request URL (token redacted):", url.replace(`access_token=${MAPBOX_TOKEN}`, "access_token=REDACTED"));

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Create a summary for debugging
      const summary = {
        code: data.code,
        message: data.message,
        routesCount: data.routes?.length,
        waypointsCount: data.waypoints?.length,
      };
      setLastDirectionsResponseSummary(summary);
      console.log("Directions API Response:", data);

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };
        setRouteGeoJson(newRouteGeoJson);

        if (mapRef.current && newRouteGeoJson.geometry) {
          const bounds = getBounds(newRouteGeoJson.geometry);
          if (bounds) {
            mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
          }
        }

        const distanceInMeters = route.distance;
        const distanceInMiles = distanceInMeters / 1609.34;

        let formattedDistance: string;
        if (distanceInMiles < 1000) {
          formattedDistance = `${distanceInMiles.toFixed(1)} miles`;
        } else {
          const distanceInKm = distanceInMeters / 1000;
          formattedDistance = `${distanceInKm.toFixed(1)} km`;
        }
        setDistance(formattedDistance);
        setDuration(`${Math.round(route.duration / 60)} min`);
      } else {
        toast.error("Could not find a route for the selected mode.");
        setRouteGeoJson(null);
        setDistance(null);
        setDuration(null);
        setRouteError(true);
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      toast.error("Failed to fetch directions.");
      setRouteGeoJson(null);
      setDistance(null);
      setDuration(null);
      setRouteError(true);
    } finally {
      setLoading(false);
    }
  }, [MAPBOX_TOKEN]);

  useEffect(() => {
    const destLat = searchParams.get("lat");
    const destLng = searchParams.get("lng");

    if (destLat && destLng) {
      setDestination({ lat: parseFloat(destLat), lng: parseFloat(destLng) });
    } else {
      toast.error("Destination coordinates are missing.");
      setLoading(false);
      return;
    }

    if (navigator.geolocation) {
      setGeolocationAvailable(true);
      watchId.current = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          console.log("User location updated:", newLocation.lat, newLocation.lng);
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast.error("Could not get your live location. Route might not be accurate.");
          setLoading(false);
          setGeolocationAvailable(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocation is not supported by your browser.");
      toast.error("Geolocation is not supported by your browser. Cannot calculate live route.");
      setLoading(false);
      setGeolocationAvailable(false);
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [searchParams]);

  useEffect(() => {
    if (userLocation && destination) {
      fetchDirections(userLocation, destination, travelMode);
    }
  }, [userLocation, destination, travelMode, fetchDirections]);

  const handleOpenGoogleMaps = () => {
    if (userLocation && destination) {
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=${travelMode}`;
      window.open(googleMapsUrl, '_blank');
    } else {
      toast.error("Cannot open Google Maps without both origin and destination.");
    }
  };

  if (loading && !routeGeoJson) { // Only show full loading spinner if no route has been rendered yet
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading map and calculating route...</p>
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
        {userLocation && (
          <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="bottom">
            <img src={NavIcon} alt="User Location" className="h-10 w-10" />
          </Marker>
        )}
        {destination && (
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <img src={StoreIcon} alt="Store Destination" className="h-10 w-10" />
          </Marker>
        )}
        {routeGeoJson && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                "line-color": "#007cbf",
                "line-width": 4,
                "line-join": "round",
                "line-cap": "round",
              } as LinePaint}
            />
          </Source>
        )}
      </Map>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <ToggleGroup type="single" value={travelMode} onValueChange={(value: TravelMode) => value && setTravelMode(value)} className="bg-white rounded-lg shadow-lg p-1">
          <ToggleGroupItem value="walking" aria-label="Toggle walking">
            <Walk className="h-5 w-5 mr-2" /> Walking
          </ToggleGroupItem>
          <ToggleGroupItem value="driving" aria-label="Toggle driving">
            <Car className="h-5 w-5 mr-2" /> Driving
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {(distance || duration) && (
        <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-xs bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-4 z-10">
          <CardContent className="flex items-center justify-around p-0">
            {duration && (
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Clock className="h-5 w-5 text-blue-600" />
                <span>{duration}</span>
              </div>
            )}
            {distance && (
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Milestone className="h-5 w-5 text-green-600" />
                <span>{distance}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <DevDebugOverlay
        mapboxTokenPresent={!!MAPBOX_TOKEN}
        geolocationAvailable={geolocationAvailable}
        mapInstanceExists={!!mapRef.current}
        lastDirectionsResponseSummary={lastDirectionsResponseSummary}
        routeError={routeError}
        origin={userLocation}
        destination={destination}
        onOpenGoogleMaps={handleOpenGoogleMaps}
      />
    </div>
  );
};

export default RoutePage;