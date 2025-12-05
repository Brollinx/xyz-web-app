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

interface StoreDetailsDesktopProps {
  store: StoreInfo;
  userLocation: UserLocation | null;
  routeGeoJson: Feature<Geometry, GeoJsonProperties> | null;
  mapStyle: string;
  detailsContent: React.ReactNode; // Render prop for the details section
}

const StoreDetailsDesktop: React.FC<StoreDetailsDesktopProps> = ({
  store,
  userLocation,
  routeGeoJson,
  mapStyle,
  detailsContent,
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 h-screen">
      <FloatingBackButton />

      {/* Left Panel: Map */}
      <div className="h-full w-full rounded-md overflow-hidden bg-muted">
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
      <ScrollArea className="h-full w-full">
        {detailsContent}
      </ScrollArea>
    </div>
  );
};

export default StoreDetailsDesktop;