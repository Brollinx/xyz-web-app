import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl, { LinePaint } from "mapbox-gl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Footprints, Search, Heart, Phone, Clock } from "lucide-react";
import { MAPBOX_TOKEN, MAPBOX_LIGHT_STYLE, MAPBOX_DARK_STYLE } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg";
import { addViewedStore } from "@/utils/viewedItems";
import { useFavorites } from "@/hooks/use-favorites";
import { cn, getStoreStatus } from "@/lib/utils";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "next-themes";

const getBounds = (geometry: Geometry) => {
  if (geometry.type !== 'LineString') return null;
  const coordinates = geometry.coordinates as [number, number][];
  if (coordinates.length === 0) return null;

  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLng = Math.max(maxLng, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  }
  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
};

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

const StoreDetailsPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get("product");

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [allStoreProducts, setAllStoreProducts] = useState<Product[]>([]);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [loading, setLoading] = useState(true);

  const { isFavorited, addFavorite, removeFavorite } = useFavorites();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const { resolvedTheme } = useTheme();

  const mapStyle = resolvedTheme === "dark" ? MAPBOX_DARK_STYLE : MAPBOX_LIGHT_STYLE;

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      }, (error) => {
        console.error("Error getting user location:", error);
        toast.warning("Could not get your location. Route will not be shown.");
      });
    } else {
      toast.warning("Geolocation is not supported by your browser. Route will not be shown.");
    }

    const fetchInitialDetails = async () => {
      if (!storeId) {
        toast.error("Store ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select(`id, store_name, address, latitude, longitude, opening_hours, phone_number`)
          .eq("id", storeId)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);
        addViewedStore(storeId);

        let productToSelect: Product | null = null;

        const { data: allProductsData, error: allProductsError } = await supabase
          .from("products")
          .select(`id, name, price, stock_quantity, image_url, currency, currency_symbol`)
          .eq("store_id", storeId)
          .eq("is_active", true);

        if (allProductsError) throw allProductsError;
        setAllStoreProducts(allProductsData || []);

        if (productId) {
          productToSelect = allProductsData?.find(p => p.id === productId) || null;
        }
        if (!productToSelect && allProductsData && allProductsData.length > 0) {
          productToSelect = allProductsData[0];
        }
        setSelectedProduct(productToSelect);
      } catch (error) {
        console.error("Error fetching initial details:", error);
        toast.error("Failed to load store and product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialDetails();
  }, [storeId, productId]);

  useEffect(() => {
    if (!userLocation || !store) return;

    const fetchDirections = async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${store.longitude},${store.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          };
          setRouteGeoJson(newRouteGeoJson);
          if (mapRef.current && newRouteGeoJson.geometry) {
            const bounds = getBounds(newRouteGeoJson.geometry);
            if (bounds) {
              mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
            }
          }
        } else {
          toast.error("Could not find a walking route to the store.");
          setRouteGeoJson(null);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        toast.error("Failed to fetch walking directions to the store.");
        setRouteGeoJson(null);
      }
    };

    fetchDirections();
  }, [userLocation, store]);

  const handleWalkToStore = () => {
    if (!store) {
      toast.error("Store location is not available.");
      return;
    }
    if (!userLocation) {
      toast.warning("Your location is not available to calculate a route.");
      return;
    }
    navigate(`/route?storeId=${store.id}&lat=${store.latitude}&lng=${store.longitude}`);
  };

  const handleToggleFavorite = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (!store) {
      toast.error("Store information is missing for this product.");
      return;
    }
    if (isFavorited(product.id)) {
      removeFavorite(product.id);
    } else {
      addFavorite({
        product_id: product.id,
        store_id: store.id,
        product_name: product.name,
        price: product.price,
        image_url: product.image_url,
        store_name: store.store_name,
        currency: product.currency,
        currency_symbol: product.currency_symbol,
      });
    }
  };

  const filteredProducts = useMemo(() => {
    const productsToFilter = allStoreProducts.filter(p => p.id !== selectedProduct?.id);
    if (!productSearchQuery) return productsToFilter;
    const lowerCaseQuery = productSearchQuery.toLowerCase();
    return productsToFilter.filter(product => product.name.toLowerCase().includes(lowerCaseQuery));
  }, [allStoreProducts, selectedProduct, productSearchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading store and product details...</p>
      </div>
    );
  }

  if (!store) return <div className="text-center p-8">Could not load store details.</div>;

  const { statusText: storeStatusText, isOpen: isStoreOpen } = getStoreStatus(store.opening_hours);

  const MapSection = (
    <div className="w-full h-[45vh] md:h-[calc(100vh-160px)] rounded-md overflow-hidden bg-muted">
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
    </div>
  );

  const DetailsSection = (
    <div className="space-y-4">
      {/* Store header info */}
      <div className="text-center md:text-left">
        <h1 className="text-2xl font-bold">{store.store_name}</h1>
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
          <CardHeader><CardTitle>Selected Product</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <img
                src={selectedProduct.image_url || "/placeholder.svg"}
                alt={selectedProduct.name}
                className="h-16 w-16 object-cover rounded-md flex-shrink-0"
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
            </div>
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
                    className="flex items-center py-2 px-3 hover:bg-accent/50 transition-colors"
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
    <div className="min-h-screen bg-background">
      {/* Mobile: map on top, bottom sheet scrollable */}
      <div className="md:hidden p-0">
        {MapSection}
        <Drawer shouldScaleBackground={false} open>
          <DrawerContent className="h-[55vh]">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-4">
                {DetailsSection}
              </div>
            </ScrollArea>
          </DrawerContent>
        </Drawer>
      </div>

      {/* Desktop: map left-to-center, details right */}
      <div className="hidden md:grid md:grid-cols-2 gap-4 p-4">
        <div>{MapSection}</div>
        <div>{DetailsSection}</div>
      </div>
    </div>
  );
};

export default StoreDetailsPage;