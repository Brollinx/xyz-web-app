"use client";

import React from "react";
import Map, { Marker, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "@/config";
import StoreIcon from "@/assets/store.svg";
import { Phone, Clock, MapPin } from "lucide-react";
import { cn, getStoreStatus } from "@/lib/utils";
import { ProductWithStoreInfo } from "@/hooks/useSearchResultsLogic"; // Import the interface
import type { ViewState } from "react-map-gl"; // Import ViewState type

interface SearchResultsMapProps {
  viewState: Partial<ViewState>; // Changed to Partial<ViewState>
  setViewState: (viewState: any) => void;
  mapStyle: string;
  userLocation: { lat: number; lng: number; accuracy_meters: number } | null;
  uniqueStoresForMarkers: { id: string; lat: number; lng: number; name: string }[];
  selectedProductResult: ProductWithStoreInfo | null;
  onMarkerClick: (productResult: ProductWithStoreInfo) => void;
  filteredProducts: ProductWithStoreInfo[]; // Needed to find first product in store
  fitMapToBounds: (mapInstance: mapboxgl.Map | null) => void;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>; // Add mapRef prop
}

const SearchResultsMap: React.FC<SearchResultsMapProps> = ({
  viewState,
  setViewState,
  mapStyle,
  userLocation,
  uniqueStoresForMarkers,
  selectedProductResult,
  onMarkerClick,
  filteredProducts,
  fitMapToBounds,
  mapRef, // Destructure mapRef
}) => {

  // The fitMapToBounds is still called from useSearchResultsLogic,
  // but the mapRef is now managed by LayoutManager and passed here.
  // The internal useEffect for fitting bounds is removed from here.

  return (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      mapboxAccessToken={MAPBOX_TOKEN}
      ref={(instance) => {
        if (instance) {
          mapRef.current = instance.getMap();
          // Call fitMapToBounds once the map instance is available
          fitMapToBounds(mapRef.current);
        }
      }}
    >
      {userLocation && (
        <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="hsl(var(--brand-accent))" />
      )}

      {uniqueStoresForMarkers.map((store) => (
        <Marker
          key={store.id}
          longitude={store.lng}
          latitude={store.lat}
          onClick={(e) => {
            e.originalEvent.stopPropagation();
            const firstProductInStore = filteredProducts.find(pr => pr.storeId === store.id);
            if (firstProductInStore) onMarkerClick(firstProductInStore);
          }}
        >
          <img src={StoreIcon} alt="Store" className="h-8 w-8 text-primary" />
        </Marker>
      ))}

      {selectedProductResult && (
        <Popup
          longitude={selectedProductResult.storeLongitude}
          latitude={selectedProductResult.storeLatitude}
          onClose={() => onMarkerClick(null as any)} // Pass null to clear selected product
          closeOnClick={false}
          anchor="bottom"
          className="dark:text-foreground"
        >
          <div className="p-1">
            <h3 className="font-bold text-md">{selectedProductResult.storeName}</h3>
            <p className="text-xs text-muted-foreground">{selectedProductResult.storeAddress}</p>
            <p className="text-xs font-medium mt-1 truncate">{selectedProductResult.productName}</p>
            <p className="text-xs">Price: {selectedProductResult.currency_symbol}{selectedProductResult.productPrice.toFixed(2)}</p>
            <p className={cn("text-xs font-semibold", getStoreStatus(selectedProductResult.storeOpeningHours).isOpen ? "text-green-600" : "text-destructive")}>
              {getStoreStatus(selectedProductResult.storeOpeningHours).statusText}
            </p>
            {selectedProductResult.storePhoneNumber && (
              <a href={`tel:${selectedProductResult.storePhoneNumber}`} className="text-xs text-primary hover:underline flex items-center mt-1">
                <Phone className="h-3 w-3 mr-1" /> {selectedProductResult.storePhoneNumber}
              </a>
            )}
          </div>
        </Popup>
      )}
    </Map>
  );
};

export default SearchResultsMap;