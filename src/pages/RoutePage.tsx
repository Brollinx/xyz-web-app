import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN, MAPBOX_LIGHT_STYLE, MAPBOX_DARK_STYLE } from "@/config";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import mapboxgl, { LinePaint } from "mapbox-gl";
import { formatDistance } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useTheme } from "next-themes";
import RoutePageLayout from "@/components/RoutePageLayout"; // Import RoutePageLayout

interface OpeningHour {
  day: string;
  open: string;
  close: string;
}

interface StoreDetails {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
  opening_hours: OpeningHour[] | null;
  phone_number?: string;
}

interface RouteSummary {
  geojson: Feature<Geometry, GeoJsonProperties> | null;
  distance: number | null;
  duration: number | null;
  error: boolean;
}

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
  const { resolvedTheme } = useTheme();
  const [searchParams] = useSearchParams();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  
  const [selectedTravelMode, setSelectedTravelMode] = useState<'driving' | 'walking'>('walking'); // Only driving and walking
  const [walkingRouteSummary, setWalkingRouteSummary] = useState<RouteSummary>({ geojson: null, distance: null, duration: null, error: false });
  const [drivingRouteSummary, setDrivingRouteSummary] = useState<RouteSummary>({ geojson: null, distance: null, duration: null, error: false });
  
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          if (mapRef.current && !walkingRouteSummary.geojson && !drivingRouteSummary.geojson) {
            mapRef.current.flyTo({ center: [newLocation.lng, newLocation.lat], zoom: 15, speed: 1.2 });
          }
        },
        (error) => {
          console.error("Error watching user location:", error);
          toast.error("Could not track your location. Please check permissions.");
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
      toast.error("Geolocation is not supported by your browser.");
      setLoadingInitial(false);
    }
  }, [walkingRouteSummary.geojson, drivingRouteSummary.geojson]);

  useEffect(() => {
    const id = searchParams.get("storeId");
    const destLat = searchParams.get("lat");
    const destLng = searchParams.get("lng");

    if (id) {
      setStoreId(id);
    } else {
      toast.error("Store ID is missing for route page.");
      setLoadingInitial(false);
    }

    if (destLat && destLng) {
      setDestination({ lat: parseFloat(destLat), lng: parseFloat(destLng) });
    } else {
      toast.error("Destination coordinates are missing.");
      setLoadingInitial(false);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchStoreDetails = async () => {
      if (!storeId) return;
      try {
        const { data, error } = await supabase
          .from('stores')
          .select('id, store_name, address, latitude, longitude, opening_hours, phone_number')
          .eq('id', storeId)
          .single();

        if (error) throw error;
        setStoreDetails(data);
      } catch (error) {
        console.error("Error fetching store details:", error);
        toast.error("Failed to load store details for the route.");
      }
    };
    fetchStoreDetails();
  }, [storeId]);

  const fetchDirections = useCallback(async (
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    mode: 'walking' | 'driving'
  ): Promise<RouteSummary> => { // Return RouteSummary
    setLoadingRoute(true);
    if (mode === 'walking') setWalkingRouteSummary(prev => ({ ...prev, error: false }));
    else setDrivingRouteSummary(prev => ({ ...prev, error: false }));

    const profile = mode === 'walking' ? 'walking' : 'driving';
    const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${origin.lng},${origin.lat};${dest.lng},${dest.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
    
    let newSummary: RouteSummary = { geojson: null, distance: null, duration: null, error: false };

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };
        newSummary = { geojson: newRouteGeoJson, distance: route.distance, duration: route.duration, error: false };
      } else {
        newSummary = { geojson: null, distance: null, duration: null, error: true };
      }
    } catch (error) {
      console.error(`Error fetching ${mode} directions:`, error);
      toast.error(`Failed to fetch ${mode} directions due to a network error.`);
      newSummary = { geojson: null, distance: null, duration: null, error: true };
    } finally {
      setLoadingRoute(false);
      setLoadingInitial(false); // Ensure initial loading is turned off
    }
    return newSummary;
  }, [MAPBOX_TOKEN]); // Dependencies for fetchDirections

  // Effect to trigger route fetching
  useEffect(() => {
    if (userLocation && destination) {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(async () => {
        const currentModeSummary = await fetchDirections(userLocation, destination, selectedTravelMode);
        if (selectedTravelMode === 'walking') setWalkingRouteSummary(currentModeSummary);
        else setDrivingRouteSummary(currentModeSummary);

        // Fetch for the other supported mode if not already fetched or errored
        const otherMode = selectedTravelMode === 'walking' ? 'driving' : 'walking';
        const otherModeSummaryState = otherMode === 'walking' ? walkingRouteSummary : drivingRouteSummary;
        if (!otherModeSummaryState.geojson && !otherModeSummaryState.error) {
          const otherModeResult = await fetchDirections(userLocation, destination, otherMode);
          if (otherMode === 'walking') setWalkingRouteSummary(otherModeResult);
          else setDrivingRouteSummary(otherModeResult);
        }
      }, 500); // Debounce to prevent excessive calls
    }
  }, [userLocation, destination, selectedTravelMode, fetchDirections, walkingRouteSummary, drivingRouteSummary]);


  const currentRouteSummary = selectedTravelMode === 'walking' ? walkingRouteSummary : drivingRouteSummary;
  const currentRouteGeoJson = currentRouteSummary.geojson;

  if (loadingInitial || !storeDetails || !destination) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading map and calculating route...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <RoutePageLayout
        origin={{ lat: userLocation?.lat || 0, lng: userLocation?.lng || 0, name: "Your Location" }}
        destination={{ lat: destination.lat, lng: destination.lng, name: storeDetails.store_name }}
        storeDetails={storeDetails}
        routeGeoJson={currentRouteGeoJson}
        routeDuration={currentRouteSummary.duration}
        routeDistance={currentRouteSummary.distance}
        transportMode={selectedTravelMode}
        setTransportMode={setSelectedTravelMode}
        mapStyle={resolvedTheme === "dark" ? MAPBOX_DARK_STYLE : MAPBOX_LIGHT_STYLE}
        mapRef={mapRef}
        loadingRoute={loadingRoute}
        fetchDirections={fetchDirections}
        userLocation={userLocation}
        destinationCoords={destination}
        walkingRouteSummary={walkingRouteSummary} // Pass both summaries
        drivingRouteSummary={drivingRouteSummary}
        getBounds={getBounds} // Pass getBounds utility
      />
    </div>
  );
};

export default RoutePage;