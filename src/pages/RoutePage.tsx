import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Car, Footprints, Phone, Clock } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg";
import NavIcon from "@/assets/nav.svg";
import mapboxgl, { LinePaint } from "mapbox-gl";
import { formatDistance, getStoreStatus, calculateDistance, cn } from "@/lib/utils"; // Import formatDistance, getStoreStatus, calculateDistance, cn
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile hook
import { supabase } from "@/lib/supabase"; // Import supabase client
import StoreInfoDisplay from "@/components/StoreInfoDisplay"; // Import new component

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
  distance: number | null; // Store raw distance in meters
  duration: number | null; // Store raw duration in seconds
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
  const isMobile = useIsMobile();

  const [storeId, setStoreId] = useState<string | null>(null);
  const [storeDetails, setStoreDetails] = useState<StoreDetails | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  
  const [selectedTravelMode, setSelectedTravelMode] = useState<'walking' | 'driving'>('walking');
  const [walkingRouteSummary, setWalkingRouteSummary] = useState<RouteSummary>({ geojson: null, distance: null, duration: null, error: false });
  const [drivingRouteSummary, setDrivingRouteSummary] = useState<RouteSummary>({ geojson: null, distance: null, duration: null, error: false });
  
  const [loadingInitial, setLoadingInitial] = useState(true); // For initial page load
  const [loadingRoute, setLoadingRoute] = useState(false); // For active route fetching
  
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Effect for continuous user location tracking
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newLocation);
          // Only fly to user location if map is not already focused on a route
          if (mapRef.current && !walkingRouteSummary.geojson && !drivingRouteSummary.geojson) {
            mapRef.current.flyTo({ center: [newLocation.lng, newLocation.lat], zoom: 15, speed: 1.2 });
          }
        },
        (error) => {
          console.error("Error watching user location:", error);
          toast.error("Could not track your location. Please check permissions.");
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 1000 } // Ensure high accuracy
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
  }, [walkingRouteSummary.geojson, drivingRouteSummary.geojson]); // Depend on routeGeoJson to avoid flying when route is present

  // Effect to get destination and storeId from search parameters and fetch store details
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

  // Fetch store details once storeId is available
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

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
          type: "Feature",
          properties: {},
          geometry: route.geometry,
        };

        const newSummary = { geojson: newRouteGeoJson, distance: route.distance, duration: route.duration, error: false };

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
        // No route found, set error state but don't show toast here
        if (mode === 'walking') setWalkingRouteSummary(prev => ({ ...prev, geojson: null, distance: null, duration: null, error: true }));
        else setDrivingRouteSummary(prev => ({ ...prev, geojson: null, distance: null, duration: null, error: true }));
      }
    } catch (error) {
      console.error(`Error fetching ${mode} directions:`, error);
      toast.error(`Failed to fetch ${mode} directions due to a network error.`); // Keep toast for network errors
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
  }, []);

  const currentRouteSummary = selectedTravelMode === 'walking' ? walkingRouteSummary : drivingRouteSummary;
  const currentRouteGeoJson = currentRouteSummary.geojson;

  const formattedDistance = currentRouteSummary.distance !== null ? formatDistance(currentRouteSummary.distance) : null;
  const formattedDuration = currentRouteSummary.duration !== null ? `${Math.round(currentRouteSummary.duration / 60)} min` : null;

  if (loadingInitial || !storeDetails || !destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading map and calculating route...</p>
      </div>
    );
  }

  const mapComponent = (
    <Map
      initialViewState={{
        longitude: userLocation?.lng || destination?.lng || 0,
        latitude: userLocation?.lat || destination?.lat || 0,
        zoom: 15,
      }}
      style={{ width: "100%", height: "100%" }}
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
  );

  const travelModeButtons = (
    <div className="flex gap-2">
      <Button
        variant={selectedTravelMode === 'walking' ? 'default' : 'outline'}
        onClick={() => setSelectedTravelMode('walking')}
        disabled={loadingRoute && selectedTravelMode === 'walking'}
      >
        {loadingRoute && selectedTravelMode === 'walking' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Footprints className="mr-2 h-4 w-4" />}
        Walk {walkingRouteSummary.duration !== null ? `(${Math.round(walkingRouteSummary.duration / 60)} min)` : ''}
      </Button>
      <Button
        variant={selectedTravelMode === 'driving' ? 'default' : 'outline'}
        onClick={() => setSelectedTravelMode('driving')}
        disabled={loadingRoute && selectedTravelMode === 'driving'}
      >
        {loadingRoute && selectedTravelMode === 'driving' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Car className="mr-2 h-4 w-4" />}
        Drive {drivingRouteSummary.duration !== null ? `(${Math.round(drivingRouteSummary.duration / 60)} min)` : ''}
      </Button>
    </div>
  );

  const storeInfoDisplay = (
    <StoreInfoDisplay
      storeName={storeDetails.store_name}
      storeAddress={storeDetails.address}
      storePhoneNumber={storeDetails.phone_number}
      storeOpeningHours={storeDetails.opening_hours}
      distance={formattedDistance}
      duration={formattedDuration}
    />
  );

  const googleMapsFallbackButton = (
    currentRouteSummary.error && userLocation && destination && (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 text-center">
        <p className="font-bold">No {selectedTravelMode} route found.</p>
        <p className="text-sm mt-1">It might be too far, or there's no suitable path.</p>
        <Button
          variant="destructive"
          className="mt-3"
          onClick={() => {
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=${selectedTravelMode}`;
            window.open(googleMapsUrl, '_blank');
          }}
        >
          Open in Google Maps
        </Button>
      </div>
    )
  );

  if (isMobile) {
    return (
      <div className="relative flex flex-col h-screen">
        <div className="relative h-[75vh] w-full rounded-t-lg overflow-hidden">
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
            {travelModeButtons}
          </div>
          {mapComponent}
        </div>
        <div className="fixed bottom-0 left-0 right-0 h-[25vh] bg-white rounded-t-2xl shadow-lg p-4 overflow-y-auto transition-transform duration-300 ease-out">
          <div className="flex flex-col items-center justify-center h-full">
            {loadingRoute && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Calculating route...</span>
              </div>
            )}
            {storeInfoDisplay}
            {googleMapsFallbackButton}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen">
      <div className="w-[60%] h-full">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          {travelModeButtons}
        </div>
        {mapComponent}
      </div>
      <div className="w-[40%] h-full p-6 bg-white shadow-md overflow-y-auto border-l border-gray-200">
        <div className="flex flex-col items-center justify-center h-full">
          {loadingRoute && (
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating route...</span>
            </div>
          )}
          {storeInfoDisplay}
          {googleMapsFallbackButton}
        </div>
      </div>
    </div>
  );
};

export default RoutePage;