"use client";

import React, { useRef } from "react";
import LayoutManager from "@/components/LayoutManager";
import Map, { Marker, Source, Layer } from "react-map-gl";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import type { LinePaint } from "mapbox-gl";
import StoreIcon from "@/assets/store.svg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footprints, Search, Heart, Phone, Clock } from "lucide-react";
import { cn, getStoreStatus } from "@/lib/utils";
import { useFavorites } from "@/hooks/use-favorites";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import FloatingBackButton from "@/components/FloatingBackButton";
import { MAPBOX_TOKEN } from "@/config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import mapboxgl from "mapbox-gl";
import FavoritesButton from "@/components/FavoritesButton"; // Import FavoritesButton

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  currency: string;
  currency_symbol?: string;
}

interface OpeningHour {
  day: string;
  open: string;
  close: string;
}

interface StoreInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
  opening_hours: OpeningHour[] | null;
  phone_number?: string;
}

interface UserLocation {
  lat: number;
  lng: number;
}

interface StoreDetailLayoutProps {
  store: StoreInfo;
  selectedProduct: Product | null;
  allStoreProducts: Product[];
  productSearchQuery: string;
  setProductSearchQuery: (query: string) => void;
  userLocation: UserLocation | null;
  routeGeoJson: Feature<Geometry, GeoJsonProperties> | null;
  handleWalkToStore: () => void;
  handleToggleFavorite: (e: React.MouseEvent, product: Product) => void;
  mapStyle: string;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}

const StoreDetailLayout: React.FC<StoreDetailLayoutProps> = ({
  store,
  selectedProduct,
  allStoreProducts,
  productSearchQuery,
  setProductSearchQuery,
  userLocation,
  routeGeoJson,
  handleWalkToStore,
  handleToggleFavorite,
  mapStyle,
  mapRef,
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";
  const { isFavorited } = useFavorites();
  const navigate = useNavigate();

  const { statusText: storeStatusText, isOpen: isStoreOpen } = getStoreStatus(store.opening_hours);

  const filteredProducts = React.useMemo(() => {
    const productsToFilter = allStoreProducts.filter(p => p.id !== selectedProduct?.id);
    if (!productSearchQuery) return productsToFilter;
    const lowerCaseQuery = productSearchQuery.toLowerCase();
    return productsToFilter.filter(product => product.name.toLowerCase().includes(lowerCaseQuery));
  }, [allStoreProducts, selectedProduct, productSearchQuery]);

  const mapContent = (
    <Map
      initialViewState={{
        longitude: store.longitude,
        latitude: store.latitude,
        zoom: 14
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
  );

  const sheetContent = (
    <div className="pt-2 px-4 pb-4 space-y-2 bg-background text-foreground"> {/* Adjusted padding and spacing */}
      {/* Store header info */}
      <div className="text-center md:text-left">
        <h1 className="text-xl md:text-2xl font-bold">{store.store_name}</h1> {/* Reduced font size for mobile */}
        <p className="text-sm text-muted-foreground">{store.address}</p>
        {store.opening_hours && (
          <p className={cn("text-xs font-semibold mt-1 flex items-center justify-center md:justify-start gap-1", isStoreOpen ? "text-green-600" : "text-red-600")}>
            <Clock className="h-4 w-4" /> {storeStatusText}
          </p>
        )}
        {store.phone_number && (
          <a href={`tel:${store.phone_number}`} className="text-xs text-blue-600 hover:underline flex items-center justify-center md:justify-start gap-1 mt-1">
            <Phone className="h-4 w-4" /> {store.phone_number}
          </a>
        )}
      </div>

      {/* Selected Product (compact like search list) */}
      {selectedProduct && (
        <Card>
          <CardContent className="flex items-center w-full p-3">
            <img
              src={selectedProduct.image_url || "/placeholder.svg"}
              alt={selectedProduct.name}
              className="h-16 w-16 object-cover rounded-md flex-shrink-0 mr-3"
            />
            <div className="flex-grow min-w-0">
              <h2 className="text-base font-bold truncate">{selectedProduct.name}</h2>
              <div className="flex items-center gap-2 text-xs mt-1">
                <span className="font-bold text-green-600 dark:text-green-400">
                  {selectedProduct.currency_symbol}{selectedProduct.price.toFixed(2)}
                </span>
                <span className={cn("font-semibold", selectedProduct.stock_quantity > 0 ? "text-green-500" : "text-red-500")}>
                  {selectedProduct.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => handleToggleFavorite(e, selectedProduct)}
              className="h-8 w-8 p-0"
            >
              <Heart className={cn("h-5 w-5", isFavorited(selectedProduct.id) ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Walk to Store button */}
      <div className="flex justify-center items-center">
        <Button size="sm" variant="outline" onClick={handleWalkToStore} disabled={!userLocation} className="px-4">
          <Footprints className="mr-2 h-4 w-4" />
          Walk to Store
        </Button>
      </div>

      {/* Other Products + search (compact list style) */}
      {allStoreProducts.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Other Products at {store.store_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-3">
              <Input
                type="text"
                placeholder="Search products in this store..."
                className="flex-grow h-9"
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
              />
              <Button type="button" size="icon" variant="secondary" className="h-9 w-9">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="divide-y border rounded-md">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center py-2 px-3 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/store/${store.id}?product=${product.id}`)}
                  >
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="h-16 w-16 object-cover rounded-md flex-shrink-0 mr-3"
                    />
                    <div className="flex-grow min-w-0">
                      <h3 className="font-bold text-base truncate">{product.name}</h3>
                      <div className="flex items-center flex-wrap gap-x-2 text-xs mt-1">
                        <span className="font-bold text-green-600 dark:text-green-400">
                          {product.currency_symbol}{product.price.toFixed(2)}
                        </span>
                        <span className={cn("font-semibold", product.stock_quantity > 0 ? "text-green-500" : "text-red-500")}>
                          {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleToggleFavorite(e, product)}
                      className="h-8 w-8 p-0 ml-2"
                    >
                      <Heart className={cn("h-5 w-5", isFavorited(product.id) ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6">No products found matching your search.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <>
      {isMobile && (
        <div className="fixed top-4 right-4 z-30">
          <FavoritesButton />
        </div>
      )}
      <FloatingBackButton /> {/* Removed className="left-16" */}
      <LayoutManager
        mapContent={mapContent}
        sheetContent={sheetContent}
        mapRef={mapRef}
      />
    </>
  );
};

export default StoreDetailLayout;