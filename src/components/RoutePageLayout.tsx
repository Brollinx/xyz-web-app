"use client";

import React from "react";
import LayoutManager from "@/components/LayoutManager";
import Map, { Marker, Source, Layer } from "react-map-gl";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { LinePaint } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Car, Footprints, Phone } from "lucide-react"; // Removed Bike, Bus, Train
import { cn, formatDistance } from "@/lib/utils";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import FloatingBackButton from "@/components/FloatingBackButton";
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

interface RoutePageLayoutProps {
  origin: { lat: number; lng: number; name: string };
  destination: { lat: number; lng: number; name: string };
  storeDetails: StoreDetails; // Added storeDetails prop
  routeGeoJson: Feature<Geometry, GeoJsonProperties> | null;
  routeDuration: number | null;
  routeDistance: number | null;
  transportMode: "driving" | "walking"; // Only driving and walking
  setTransportMode: (mode: "driving" | "walking") => void; // Only driving and walking
  mapStyle: string;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
  loadingRoute: boolean;
}

const RoutePageLayout: React.FC<RoutePageLayoutProps> = ({
  origin,
  destination,
  storeDetails, // Destructure storeDetails
  routeGeoJson,
  routeDuration,
  routeDistance,
  transportMode,
  setTransportMode,
  mapStyle,
  mapRef,
  loadingRoute,
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
    <div className="p-2 space-y-2 bg-background text-foreground"> {/* Reduced padding and spacing */}
      <Card>
        <CardHeader className="pb-1 pt-2"> {/* Reduced padding */}
          <CardTitle className="text-base">Route Details</CardTitle> {/* Reduced font size */}
        </CardHeader>
        <CardContent className="space-y-1 text-sm"> {/* Reduced spacing and font size */}
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-1 pt-2"> {/* Reduced padding */}
          <CardTitle className="text-base">Travel Mode</CardTitle> {/* Reduced font size */}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2"> {/* Changed to grid-cols-2 */}
            <Button
              variant={transportMode === "driving" ? "default" : "outline"}
              onClick={() => setTransportMode("driving")}
              className="flex items-center gap-2 text-sm h-9" // Reduced height and font size
            >
              <Car className="h-4 w-4" /> Driving
            </Button>
            <Button
              variant={transportMode === "walking" ? "default" : "outline"}
              onClick={() => setTransportMode("walking")}
              className="flex items-center gap-2 text-sm h-9" // Reduced height and font size
            >
              <Footprints className="h-4 w-4" /> Walking
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
      <FloatingBackButton className="left-16" />
      <LayoutManager
        mapContent={mapContent}
        sheetContent={sheetContent}
        mapRef={mapRef}
      />
    </>
  );
};

export default RoutePageLayout;