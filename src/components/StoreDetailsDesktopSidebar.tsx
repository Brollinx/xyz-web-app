"use client";

import React from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Feature, GeoJsonProperties, Geometry } from "geojson"; // LinePaint removed from here
import type { LinePaint } from "mapbox-gl"; // Correct import for LinePaint
import StoreIcon from "@/assets/store.svg";
import { ScrollArea } from "@/components/ui/scroll-area";
import FloatingBackButton from "@/components/FloatingBackButton";
import { MAPBOX_TOKEN } from "@/config";

// Re-exporting interfaces for use in this file
export interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  currency: string;
  currency_symbol?: string;
}

export interface OpeningHour {
  day: string;
  open: string;
  close: string;
}

export interface StoreInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
  opening_hours: OpeningHour[] | null;
  phone_number?: string;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

interface StoreDetailsDesktopSidebarProps {
  store: StoreInfo;
  userLocation: UserLocation | null;
  routeGeoJson: Feature<Geometry, GeoJsonProperties> | null;
  mapStyle: string;
  detailsContent: React.ReactNode; // Render prop for the details section
}

const StoreDetailsDesktopSidebar: React.FC<StoreDetailsDesktopSidebarProps> = ({
  store,
  userLocation,
  routeGeoJson,
  mapStyle,
  detailsContent,
}) => {
  return (
    <div className="map-and-panel-wrapper">
      <FloatingBackButton />

      {/* Left Panel: Map */}
      <div className="map-left rounded-md overflow-hidden bg-muted">
        <Map
          initialViewState={{
            longitude: store.longitude,
            latitude: store.latitude,
            zoom: 14,
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle={mapStyle}
          mapboxAccessToken={MAPBOX_TOKEN}
        >
          {userLocation && <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />}
          <Marker longitude={store.longitude} latitude={store.latitude}>
            <img src={StoreIcon} alt="Store" className="h-6 w-6" />
          </Marker>
          {routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson}>
              <Layer
                id="route-layer"
                type="line"
                paint={{
                  "line-color": "#007cbf",
                  "line-width": 3,
                  "line-join": "round",
                  "line-cap": "round",
                } as LinePaint}
              />
            </Source>
          )}
        </Map>
      </div>

      {/* Right Panel: Details */}
      <div className="desktop-right-panel bg-card text-card-foreground shadow-md border-l border-border">
        <ScrollArea className="h-full w-full">
          {detailsContent}
        </ScrollArea>
        {/* Temporary visual test overlay */}
        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
          DESKTOP RIGHT PANEL ACTIVE
        </div>
      </div>
    </div>
  );
};

export default StoreDetailsDesktopSidebar;