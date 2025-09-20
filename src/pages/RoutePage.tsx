import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import Map, { Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_TOKEN } from "@/config";
import { Loader2, Clock, Milestone } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Feature, LineString } from 'geojson';

interface LngLat {
  lng: number;
  lat: number;
}

const RoutePage = () => {
  const [searchParams] = useSearchParams();
  const [userLocation, setUserLocation] = useState<LngLat | null>(null);
  const [destination, setDestination] = useState<LngLat | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<LineString> | null>(null);
  const [loading, setLoading] = useState(true);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [steps, setSteps] = useState<any[]>([]);

  useEffect(() => {
    const destLat = searchParams.get("lat");
    const destLng = searchParams.get("lng");

    if (destLat && destLng) {
      setDestination({ lat: parseFloat(destLat), lng: parseFloat(destLng) });
    } else {
      toast.error("Destination coordinates are missing.");
      setLoading(false);
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        toast.error("Could not get your location.");
        setLoading(false);
      }
    );
  }, [searchParams]);

  useEffect(() => {
    if (!userLocation || !destination) return;

    const fetchRoute = async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${destination.lng},${destination.lat}?steps=true&geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          setRouteGeoJson({
            type: 'Feature',
            properties: {},
            geometry: route.geometry,
          });
          const leg = route.legs[0];
          setDistance(`${(route.distance / 1000).toFixed(2)} km`);
          setDuration(`${Math.round(route.duration / 60)} min`);
          setSteps(leg.steps);
        } else {
          toast.error("Could not find a walking route.");
        }
      } catch (error) {
        toast.error("Failed to fetch route from Mapbox.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoute();
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
          latitude: userLocation?.lat || destination?.lat || 0,
          longitude: userLocation?.lng || destination?.lng || 0,
          zoom: 15,
        }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        {routeGeoJson && (
          <Source id="route" type="geojson" data={routeGeoJson}>
            <Layer id="route-layer" type="line" paint={{ 'line-color': '#007cbf', 'line-width': 5 }} />
          </Source>
        )}
      </Map>

      {steps.length > 0 && (
        <Card className="absolute top-4 left-4 right-4 w-auto max-w-md m-auto bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Walking Directions</CardTitle>
            <div className="flex items-center justify-around text-sm text-gray-700 pt-2">
              {duration && <div className="flex items-center gap-2"><Clock className="h-5 w-5 text-blue-600" /> <span className="font-bold">{duration}</span></div>}
              {distance && <div className="flex items-center gap-2"><Milestone className="h-5 w-5 text-green-600" /> <span className="font-bold">{distance}</span></div>}
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <ol className="space-y-3 list-decimal list-inside">
                {steps.map((step, index) => (
                  <li key={index} className="text-sm">{step.maneuver.instruction}</li>
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