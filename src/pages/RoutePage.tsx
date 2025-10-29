import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone, Car, Footprints } from "lucide-react"; // Added Footprints
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg";
import NavIcon from "@/assets/nav.svg";
import mapboxgl, { LinePaint } from "mapbox-gl";
import DevDebugOverlay from "@/components/DevDebugOverlay";

const containerStyle = {
  width: "100%",
  minHeight: "360px",
  height: "100vh",
};

interface RouteSummary {
  geojson: Feature<Geometry, GeoJsonProperties> | null;
  distance: string | null;
  duration: string | null;
  error: boolean;
}

// Helper function to calculate bounding box from GeoJSON LineString
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
  
  const [selectedTravelMode, setSelectedTravelMode] = useState<'walking' | 'driving'>('walking');
  const [walkingRouteSummary, setWalkingRouteSummary] = useState<RouteSummary>({ geojson: null, distance: null, duration: null, error: false });
  const [drivingRouteSummary, setDrivingRouteSummary] = useState<RouteSummary>({ geojson: null, distance: null, duration: null, error: false });
  
  const [loadingInitial, setLoadingInitial] = useState(true); // For initial page load
  const [loadingRoute, setLoadingRoute] = useState(false); // For active route fetching
  
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // States for DevDebugOverlay
  const [mapboxTokenPresent] = useState(!!MAPBOX_TOKEN);
  const [geolocationAvailable, setGeolocationAvailable] = useState(false);
  const [mapInstanceExists, setMapInstanceExists] = useState(false);
  const [lastDirectionsResponseSummary, setLastDirectionsResponseSummary] = useState<any>(null);

  // Effect for continuous user location tracking
  useEffect(() => {
    if (navigator.geolocation) {
      setGeolocationAvailable(true);
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          if (mapRef.current) {
            mapRef.current.flyTo({ center: [newLocation.lng, newLocation.lat], zoom: 15, speed: 1.2 });
          }
        },
        (error) => {
          console.error("Error watching user location:", error);
          toast.error("Could not track your location. Please check permissions.");
          setGeolocationAvailable(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 }
      );

      return () => {
        navigator.geolocation.clearWatch(watchId);
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    } else {
      setGeolocationAvailable(false);
      toast.error("Geolocation is not supported by your browser.");
      setLoadingInitial(false);
    }
  }, []);

  // Effect to get destination from search parameters
  useEffect(() => {
    const destLat = searchParams.get("lat");
    const destLng = searchParams.get("lng");

    if (destLat && destLng) {
      setDestination({ lat: parseFloat(destLat), lng: parseFloat(destLng) });
    } else {
      toast.error("Destination coordinates are missing.");
      setLoadingInitial(false);
    }
  }, [searchParams]);

  // Debounced function to fetch directions
  const fetchDirections = useCallback(async (
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    mode: 'walking' | 'driving'
  ) => {
    setLoadingRoute(true);
    // Reset error for the mode being fetched
    if (mode === 'walking') setWalkingRouteSummary(prev => ({ ...prev, error: false }));
    else setDrivingRouteSummary(prev => ({ ...prev, error: false }));

    const profile = mode === 'walking' ? 'walking' : 'driving';
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();

      setLastDirectionsResponseSummary({
        code: data.code,
        message: data.message,
        routesCount: data.routes?.length,
        waypointsCount: data.waypoints?.length,
        mode: mode,
      });

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };

        const distanceInMeters = route.distance;
        const distanceInMiles = distanceInMeters / 1609.34;

        let formattedDistance: string;
        if (distanceInMiles < 1000) {
          formattedDistance = `${distanceInMiles.toFixed(1)} miles`;
        } else {
          const distanceInKm = distanceInMeters / 1000;
          formattedDistance = `${distanceInKm.toFixed(1)} km`;
        }
        const formattedDuration = `${Math.round(route.duration / 60)} min`;

        const newSummary = { geojson: newRouteGeoJson, distance: formattedDistance, duration: formattedDuration, error: false };

        if (mode === 'walking') {
          setWalkingRouteSummary(newSummary);
        } else {
          setDrivingRouteSummary(newSummary);
        }

        // Fit map to route bounds if this is the currently selected mode
        if (selectedTravelMode === mode && mapRef.current && newRouteGeoJson.geometry) {
          const bounds = getBounds(newRouteGeoJson.geometry);
          if (bounds) {
            mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
          }
        }
      } else {
        toast.error(`Could not find a ${mode} route.`);
        if (mode === 'walking') setWalkingRouteSummary(prev => ({ ...prev, geojson: null, distance: null, duration: null, error: true }));
        else setDrivingRouteSummary(prev => ({ ...prev, geojson: null, distance: null, duration: null, error: true }));
      }
    } catch (error) {
      console.error(`Error fetching ${mode} directions:`, error);
      toast.error(`Failed to fetch ${mode} directions.`);
      if (mode === 'walking') setWalkingRouteSummary(prev => ({ ...prev, geojson: null, distance: null, duration: null, error: true }));
      else setDrivingRouteSummary(prev => ({ ...prev, geojson: null, distance: null, duration: null, error: true }));
    } finally {
      setLoadingRoute(false);
      setLoadingInitial(false); // Ensure initial loading is false after first fetch attempt
    }
  }, [MAPBOX_TOKEN, selectedTravelMode]);

  // Effect to trigger debounced fetch directions when userLocation or destination changes
  useEffect(() => {
    if (userLocation && destination) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(() => {
        // Fetch for the currently selected mode
        fetchDirections(userLocation, destination, selectedTravelMode);
        
        // Also fetch for the other mode in the background if not already successful or errored
        const otherMode = selectedTravelMode === 'walking' ? 'driving' : 'walking';
        const otherModeSummary = otherMode === 'walking' ? walkingRouteSummary : drivingRouteSummary;
        if (!otherModeSummary.geojson && !otherModeSummary.error) {
          fetchDirections(userLocation, destination, otherMode);
        }
      }, 2000); // Debounce for 2 seconds
    }
  }, [userLocation, destination, fetchDirections, selectedTravelMode, walkingRouteSummary, drivingRouteSummary]);

  // Callback for map load to update debug state
  const handleMapLoad = useCallback((instance: mapboxgl.Map) => {
    mapRef.current = instance;
    setMapInstanceExists(true);
  }, []);

  const openGoogleMapsDirections = () => {
    if (userLocation && destination) {
        const originStr = `${userLocation.lat},${userLocation.lng}`;
        const destinationStr = `${destination.lat},${destination.lng}`;
        const travelModeParam = selectedTravelMode === 'walking' ? 'walking' : 'driving';
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destinationStr}&travelmode=${travelModeParam}`;
        window.open(googleMapsUrl, '_blank');
    } else {
        toast.error("Cannot open Google Maps: origin or destination missing.");
    }
  };

  const currentRouteGeoJson = selectedTravelMode === 'walking' ? walkingRouteSummary.geojson : drivingRouteSummary.geojson;
  const currentRouteError = selectedTravelMode === 'walking' ? walkingRouteSummary.error : drivingRouteSummary.error;

  if (loadingInitial && (!userLocation || !destination)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading map and calculating route...</p>
      </div>
    );
  }

  return (
    <div className="w-full flex-grow relative">
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <Button
          variant={selectedTravelMode === 'walking' ? 'default' : 'outline'}
          onClick={() => setSelectedTravelMode('walking')}
          disabled={loadingRoute && selectedTravelMode === 'walking'}
        >
          {loadingRoute && selectedTravelMode === 'walking' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Footprints className="mr-2 h-4 w-4" />}
          Walk {walkingRouteSummary.duration ? `(${walkingRouteSummary.duration})` : ''}
        </Button>
        <Button
          variant={selectedTravelMode === 'driving' ? 'default' : 'outline'}
          onClick={() => setSelectedTravelMode('driving')}
          disabled={loadingRoute && selectedTravelMode === 'driving'}
        >
          {loadingRoute && selectedTravelMode === 'driving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Car className="mr-2 h-4 w-4" />}
          Drive {drivingRouteSummary.duration ? `(${drivingRouteSummary.duration})` : ''}
        </Button>
      </div>

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
            handleMapLoad(instance.getMap());
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
        {currentRouteGeoJson && (
          <Source id="route" type="geojson" data={currentRouteGeoJson}>
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

      <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-xs bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-4">
        <CardContent className="flex flex-col items-center justify-around p-0">
          {loadingRoute && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating route...</span>
            </div>
          )}
          {walkingRouteSummary.duration && (
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Footprints className="h-5 w-5 text-blue-600" />
              <span>Walk: {walkingRouteSummary.duration} ({walkingRouteSummary.distance})</span>
            </div>
          )}
          {drivingRouteSummary.duration && (
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <Car className="h-5 w-5 text-green-600" />
              <span>Drive: {drivingRouteSummary.duration} ({drivingRouteSummary.distance})</span>
            </div>
          )}
          {(!walkingRouteSummary.duration && !drivingRouteSummary.duration && !loadingRoute) && (
            <p className="text-sm text-gray-500">No route data available.</p>
          )}
        </CardContent>
      </Card>

      <DevDebugOverlay
        mapboxTokenPresent={mapboxTokenPresent}
        geolocationAvailable={geolocationAvailable}
        mapInstanceExists={mapInstanceExists}
        lastDirectionsResponseSummary={lastDirectionsResponseSummary}
        routeError={currentRouteError}
        origin={userLocation}
        destination={destination}
        onOpenGoogleMaps={openGoogleMapsDirections}
      />
    </div>
  );
};

export default RoutePage;