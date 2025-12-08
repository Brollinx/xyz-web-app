"use client";

import React from "react";
import LayoutManager from "@/components/LayoutManager";
import Map, { Marker, Source, Layer } from "react-map-gl";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { LinePaint } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Car, Footprints, Bike, Bus, Train } from "lucide-react"; // Changed Walk to Footprints
import { cn } from "@/lib/utils";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import FloatingBackButton from "@/components/FloatingBackButton";
import { MAPBOX_TOKEN } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mapboxgl from "mapbox-gl";
import FavoritesButton from "@/components/FavoritesButton"; // Import FavoritesButton

interface RoutePageLayoutProps {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  routeGeoJson: Feature<Geometry, GeoJsonProperties> | null;
  routeDuration: number | null;
  routeDistance: number | null;
  transportMode: "driving" | "walking" | "cycling" | "public_transport";
  setTransportMode: (mode: "driving" | "walking" | "cycling" | "public_transport") => void;
  mapStyle: string;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}

const RoutePageLayout: React.FC<RoutePageLayoutProps> = ({
  origin,
  destination,
  routeGeoJson,
  routeDuration,
  routeDistance,
  transportMode,
  setTransportMode,
  mapStyle,
  mapRef,
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

  const mapContent = (
    <Map
      initialViewState={{
        longitude: (origin.lng + destination.lng) / 2,
        latitude: (origin.lat + destination.lat) / 2,
        zoom: 12,
      }}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      mapboxAccessToken={MAPBOX_TOKEN}
      ref={(instance) => {
        if (instance) {
          mapRef.current = instance.getMap();
        }
      }}
    >
      <Marker longitude={origin.lng} latitude={origin.lat} color="#4285F4" />
      <Marker longitude={destination.lng} latitude={destination.lat} color="#DB4437" />
      {routeGeoJson && (
        <Source id="route" type="geojson" data={routeGeoJson}>
          <Layer
            id="route-layer"
            type="line"
            paint={{
              "line-color": "#007cbf",
              "line-width": 5,
              "line-join": "round",
              "line-cap": "round",
            } as LinePaint}
          />
        </Source>
      )}
    </Map>
  );

  const sheetContent = (
    <div className="pt-2 px-4 pb-4 space-y-4 bg-background text-foreground">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Route Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">From:</span> {origin.name}
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">To:</span> {destination.name}
          </div>
          {routeDuration !== null && routeDistance !== null && (
            <>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">Duration:</span> {Math.round(routeDuration / 60)} mins
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Car className="h-4 w-4 text-muted-foreground" /> {/* Using Car icon as a generic distance icon */}
                <span className="font-semibold">Distance:</span> {(routeDistance / 1000).toFixed(2)} km
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Travel Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Button
              variant={transportMode === "driving" ? "default" : "outline"}
              onClick={() => setTransportMode("driving")}
              className="flex items-center gap-2"
            >
              <Car className="h-4 w-4" /> Driving
            </Button>
            <Button
              variant={transportMode === "walking" ? "default" : "outline"}
              onClick={() => setTransportMode("walking")}
              className="flex items-center gap-2"
            >
              <Footprints className="h-4 w-4" /> Walking
            </Button>
            <Button
              variant={transportMode === "cycling" ? "default" : "outline"}
              onClick={() => setTransportMode("cycling")}
              className="flex items-center gap-2"
            >
              <Bike className="h-4 w-4" /> Cycling
            </Button>
            <Button
              variant={transportMode === "public_transport" ? "default" : "outline"}
              onClick={() => setTransportMode("public_transport")}
              className="flex items-center gap-2"
            >
              <Bus className="h-4 w-4" /> Public Transport
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <>
      {isMobile && (
        <div className="fixed top-4 right-4 z-30">
          <FavoritesButton />
        </div>
      )}
      <FloatingBackButton className="left-16" /> {/* Adjusted left position to avoid overlap with FloatingMenu */}
      <LayoutManager
        mapContent={mapContent}
        sheetContent={sheetContent}
        mapRef={mapRef}
      />
    </>
  );
};

export default RoutePageLayout;