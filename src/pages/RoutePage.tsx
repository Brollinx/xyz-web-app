import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer, Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone, Car, Footprints } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg";
import NavIcon from "@/assets/nav.svg";
import mapboxgl, { LinePaint } from "mapbox-gl";
import { useGeolocation } from "@/hooks/useGeolocation";

type TravelMode = "walking" | "driving";

const getBounds = (geometry: Geometry) => {
  if (geometry.type !== 'LineString') return null;
  const coordinates = geometry.coordinates as [number, number][];
  return coordinates.reduce((bounds, coord) => {
    return bounds.extend(coord);
  }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
};

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");

  const { location: userLocation, status: locationStatus } = useGeolocation();
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    const destLat = searchParams.get("lat");
    const destLng = searchParams.get("lng");
    if (destLat && destLng) {
      setDestination({ lat: parseFloat(destLat), lng: parseFloat(destLng) });
    } else {
      toast.error("Destination coordinates are missing.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!userLocation || !destination) return;

    const fetchDirections = async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = { type: "Feature", properties: {}, geometry: route.geometry };
          setRouteGeoJson(newRouteGeoJson);

          if (mapRef.current && newRouteGeoJson.geometry) {
            const bounds = getBounds(newRouteGeoJson.geometry);
            if (bounds) {
              mapRef.current.fitBounds(bounds, { padding: 80, duration: 1000 });
            }
          }

          const distanceInMeters = route.distance;
          const distanceInMiles = distanceInMeters / 1609.34;
          let formattedDistance = distanceInMiles < 1000 ? `${distanceInMiles.toFixed(1)} miles` : `${(distanceInMeters / 1000).toFixed(1)} km`;
          setDistance(formattedDistance);
          setDuration(`${Math.round(route.duration / 60)} min`);
        } else {
          toast.error(`Could not find a ${travelMode} route.`);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        toast.error(`Failed to fetch ${travelMode} directions.`);
      }
    };

    fetchDirections();
  }, [userLocation, destination, travelMode]);

  if (locationStatus === 'loading' || locationStatus === 'idle') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Acquiring your location...</p>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
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
          if (instance) mapRef.current = instance.getMap();
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
                "line-color": travelMode === 'walking' ? "#007cbf" : "#f44336",
                "line-width": 5,
                "line-opacity": 0.8
              } as LinePaint}
            />
          </Source>
        )}
      </Map>

      <div className="absolute top-4 right-4 z-10">
        <ToggleGroup type="single" value={travelMode} onValueChange={(value: TravelMode) => value && setTravelMode(value)} className="bg-white rounded-md shadow-lg">
          <ToggleGroupItem value="walking" aria-label="Toggle walking">
            <Footprints className="h-5 w-5" />
          </ToggleGroupItem>
          <ToggleGroupItem value="driving" aria-label="Toggle driving">
            <Car className="h-5 w-5" />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {(distance || duration) && (
        <Card className="absolute bottom-4 left-1/2 w-auto max-w-xs -translate-x-1/2 rounded-lg bg-white/90 p-4 shadow-lg backdrop-blur-sm">
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