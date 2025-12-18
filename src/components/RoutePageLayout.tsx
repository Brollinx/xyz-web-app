"use client";

import React, { useEffect, useCallback } from "react";
import LayoutManager from "@/components/LayoutManager";
import Map, { Marker, Source, Layer } from "react-map-gl";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { LinePaint } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Car, Footprints, Phone } from "lucide-react";
import { cn, formatDistance } from "@/lib/utils";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { MAPBOX_TOKEN } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import mapboxgl from "mapbox-gl";
import FavoritesButton from "@/components/FavoritesButton";

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

interface RoutePageLayoutProps {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  storeDetails: StoreDetails;
  routeGeoJson: Feature<Geometry, GeoJsonProperties> | null;
  routeDuration: number | null;
  routeDistance: number | null;
  transportMode: "driving" | "walking";
  setTransportMode: (mode: "driving" | "walking") => void;
  mapStyle: string;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  loadingRoute: boolean;
  fetchDirections: (
    origin: { lat: number; lng: number },
    dest: { lat: number; lng: number },
    mode: 'walking' | 'driving'
  ) => Promise<RouteSummary>; // Updated signature
  userLocation: { lat: number; lng: number } | null;
  destinationCoords: { lat: number; lng: number } | null;
  walkingRouteSummary: RouteSummary; // New prop
  drivingRouteSummary: RouteSummary; // New prop
  getBounds: (geometry: Geometry) => [[number, number], [number, number]] | null; // New prop
}

const RoutePageLayout: React.FC<RoutePageLayoutProps> = ({
  origin,
  destination,
  storeDetails,
  routeGeoJson,
  routeDuration,
  routeDistance,
  transportMode,
  setTransportMode,
  mapStyle,
  mapRef,
  loadingRoute,
  fetchDirections,
  userLocation,
  destinationCoords,
  walkingRouteSummary,
  drivingRouteSummary,
  getBounds,
}) => {
  const layout = useResponsiveLayout();
  const isMobileLayout = layout === "mobile";

  const mapContentRender = useCallback(({ paddingBottom, isMobile }: { paddingBottom: number; isMobile: boolean }) => {
    // Effect to fit map bounds when routeGeoJson or layout changes
    useEffect(() => {
      const currentRoute = transportMode === 'walking' ? walkingRouteSummary : drivingRouteSummary;
      if (mapRef.current && currentRoute.geojson && currentRoute.geojson.geometry) {
        const bounds = getBounds(currentRoute.geojson.geometry);
        if (bounds) {
          const mapPadding = { top: 50, bottom: 50, left: 50, right: 50 };
          if (isMobile) {
            mapPadding.bottom = paddingBottom + 50;
          }
          mapRef.current.fitBounds(bounds, {
            padding: mapPadding,
            duration: 1000
          });
        }
      }
    }, [routeGeoJson, mapRef, paddingBottom, isMobile, transportMode, walkingRouteSummary, drivingRouteSummary, getBounds]);

    return (
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
  }, [origin, destination, mapStyle, mapRef, routeGeoJson, transportMode, walkingRouteSummary, drivingRouteSummary, getBounds]);

  const sheetContentRender = useCallback(({ paddingBottom, isMobile }: { paddingBottom: number; isMobile: boolean }) => (
    <div className="p-2 space-y-1 bg-background text-foreground">
      <Card>
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="text-base">Route Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">From:</span> {origin.name}
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">To:</span> <span className="font-bold">{destination.name}</span>
          </div>
          {storeDetails.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{storeDetails.address}</span>
            </div>
          )}
          {storeDetails.phone_number && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${storeDetails.phone_number}`} className="text-blue-600 hover:underline">
                {storeDetails.phone_number}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {loadingRoute ? (
              <span className="text-muted-foreground">Calculating route...</span>
            ) : (
              routeDuration !== null && routeDistance !== null ? (
                <span>
                  <span className="font-semibold">{Math.round(routeDuration / 60)} min</span> • <span className="font-semibold">{formatDistance(routeDistance)}</span>
                </span>
              ) : (
                <span className="text-muted-foreground">Route not available</span>
              )
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <Button
              variant={transportMode === "driving" ? "default" : "outline"}
              onClick={() => setTransportMode("driving")}
              className="flex items-center gap-2 text-sm h-9"
            >
              <Car className="h-4 w-4" /> Driving
            </Button>
            <Button
              variant={transportMode === "walking" ? "default" : "outline"}
              onClick={() => setTransportMode("walking")}
              className="flex items-center gap-2 text-sm h-9"
            >
              <Footprints className="h-4 w-4" /> Walking
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  ), [origin, destination, storeDetails, loadingRoute, routeDuration, routeDistance, transportMode, setTransportMode]);

  return (
    <>
      {isMobileLayout && (
        <div className="fixed top-4 right-4 z-30">
          <FavoritesButton />
        </div>
      )}
      <LayoutManager
        mapContent={mapContentRender}
        sheetContent={sheetContentRender}
        mapRef={mapRef}
      />
    </>
  );
};

export default RoutePageLayout;