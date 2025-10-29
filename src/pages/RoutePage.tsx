import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone } from "lucide-react"; // Removed Navigation2 as we're using custom SVG
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg"; // Import the new store icon
import NavIcon from "@/assets/nav.svg"; // Import the new navigation icon
import mapboxgl, { LinePaint } from "mapbox-gl"; // Import mapboxgl and LinePaint type

const containerStyle = {
  width: "100%",
  minHeight: "360px", // Ensure map is visible
  height: "100vh", // Make map fill the entire viewport height
};

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
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [loading, setLoading] = useState(true);

  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null); // Ref to get map instance

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
        }
      );
    } else {
      console.warn("Geolocation is not supported by your browser.");
      toast.error("Geolocation is not supported by your browser.");
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!userLocation || !destination) return;

    const fetchDirections = async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      console.log("Directions API Request URL (token redacted):", url.replace(`access_token=${MAPBOX_TOKEN}`, "access_token=REDACTED"));

      try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("Directions API Response:", data);

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          };
          setRouteGeoJson(newRouteGeoJson);

          // Fit map to route bounds
          if (mapRef.current && newRouteGeoJson.geometry) {
            const bounds = getBounds(newRouteGeoJson.geometry);
            if (bounds) {
              mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
            }
          }

          const distanceInMeters = route.distance; // Distance from Mapbox is in meters
          const distanceInMiles = distanceInMeters / 1609.34; // Convert meters to miles

          let formattedDistance: string;
          if (distanceInMiles < 1000) {
            formattedDistance = `${distanceInMiles.toFixed(1)} miles`;
          } else {
            const distanceInKm = distanceInMeters / 1000; // Convert meters to kilometers
            formattedDistance = `${distanceInKm.toFixed(1)} km`;
          }
          setDistance(formattedDistance);
          setDuration(`${Math.round(route.duration / 60)} min`);
        } else {
          toast.error("Could not find a walking route.");
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        toast.error("Failed to fetch walking directions.");
      } finally {
        setLoading(false);
      }
    };

    fetchDirections();
  }, [userLocation, destination]);

  if (loading) {
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
            <img src={NavIcon} alt="User Location" className="h-10 w-10" /> {/* 40x40px */}
          </Marker>
        )}
        {destination && (
          <Marker longitude={destination.lng} latitude={destination.lat} anchor="bottom">
            <img src={StoreIcon} alt="Store Destination" className="h-10 w-10" /> {/* 40x40px */}
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
              } as LinePaint} // <-- Type assertion added here
            />
          </Source>
        )}
      </Map>

      {(distance || duration) && (
        <Card className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto max-w-xs bg-white/90 backdrop-blur-sm shadow-lg rounded-lg p-4">
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
    </div>
  );
};

export default RoutePage;