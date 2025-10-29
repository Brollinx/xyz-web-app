import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Popup, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, cn } from "@/lib/utils";
import StoreIcon from "@/assets/store.svg";
import { useGeolocation } from "@/hooks/useGeolocation";
import mapboxgl from "mapbox-gl";

const defaultCenter = {
  latitude: 6.5244,
  longitude: 3.3792,
  zoom: 10,
};

interface ProductWithStoreInfo {
  productId: string;
  productName: string;
  productPrice: number;
  stockQuantity: number;
  productImageUrl?: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  storeLatitude: number;
  storeLongitude: number;
  currency: string;
  currency_symbol?: string;
  distance?: number;
  formattedDistance?: string;
}

const getBoundsForPoints = (points: { lat: number; lng: number }[]) => {
  if (points.length === 0) return null;
  const bounds = new mapboxgl.LngLatBounds();
  points.forEach(point => bounds.extend([point.lng, point.lat]));
  return bounds;
};

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSearchQuery = searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [viewState, setViewState] = useState<Partial<ViewState>>(defaultCenter);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [productResults, setProductResults] = useState<ProductWithStoreInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { location: userLocation, status: locationStatus } = useGeolocation();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const initialBoundsSet = useRef(false);

  useEffect(() => {
    const fetchProductResults = async () => {
      setIsLoading(true);
      initialBoundsSet.current = false; // Reset bounds flag for new search
      try {
        let query = supabase.from('products').select(`
            id, name, price, stock_quantity, is_active, image_url, currency, currency_symbol,
            stores (id, store_name, address, latitude, longitude, is_active)
          `).eq('is_active', true);

        if (initialSearchQuery) {
          query = query.ilike('name', `%${initialSearchQuery}%`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const fetchedResults: ProductWithStoreInfo[] = data
          .filter((p: any) => p.stores && p.stores.is_active && p.stores.latitude && p.stores.longitude)
          .map((p: any) => ({
            productId: p.id,
            productName: p.name,
            productPrice: p.price,
            stockQuantity: p.stock_quantity,
            productImageUrl: p.image_url,
            currency: p.currency || 'USD',
            currency_symbol: p.currency_symbol || '$',
            storeId: p.stores.id,
            storeName: p.stores.store_name,
            storeAddress: p.stores.address,
            storeLatitude: p.stores.latitude,
            storeLongitude: p.stores.longitude,
          }));
        
        setProductResults(fetchedResults);
        if (fetchedResults.length === 0) {
          toast.info(`No products found for "${initialSearchQuery}".`);
        }
      } catch (error) {
        console.error("Error fetching product results:", error);
        toast.error("Failed to fetch product results.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProductResults();
  }, [initialSearchQuery]);

  const processedProductResults = useMemo(() => {
    if (locationStatus !== "success" || !userLocation) return productResults;
    return productResults.map(p => {
      const distanceInMiles = calculateDistance(userLocation.lat, userLocation.lng, p.storeLatitude, p.storeLongitude, 'miles');
      const formattedDistance = distanceInMiles < 1000 ? `${distanceInMiles.toFixed(1)} miles` : `${calculateDistance(userLocation.lat, userLocation.lng, p.storeLatitude, p.storeLongitude, 'km').toFixed(1)} km`;
      return { ...p, distance: distanceInMiles, formattedDistance };
    }).sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [productResults, userLocation, locationStatus]);

  const uniqueStores = useMemo(() => {
    const stores = new window.Map<string, ProductWithStoreInfo>();
    processedProductResults.forEach(p => {
      if (!stores.has(p.storeId)) stores.set(p.storeId, p);
    });
    return Array.from(stores.values());
  }, [processedProductResults]);

  useEffect(() => {
    if (mapRef.current && userLocation && uniqueStores.length > 0 && !initialBoundsSet.current) {
      const points = uniqueStores.map(s => ({ lat: s.storeLatitude, lng: s.storeLongitude }));
      points.push({ lat: userLocation.lat, lng: userLocation.lng });
      const bounds = getBoundsForPoints(points);
      if (bounds) {
        mapRef.current.fitBounds(bounds, { padding: 50, duration: 1500, maxZoom: 14 });
        initialBoundsSet.current = true;
      }
    } else if (userLocation && !initialBoundsSet.current) {
      mapRef.current?.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1500 });
    }
  }, [userLocation, uniqueStores]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ query: searchQuery });
  };

  const handleMarkerClick = (store: ProductWithStoreInfo) => {
    setSelectedStoreId(store.storeId);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [store.storeLongitude, store.storeLatitude],
        zoom: 14,
        duration: 1500,
        essential: true,
      });
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      <div className="flex-shrink-0 p-4 shadow-md">
        <form onSubmit={handleSearchSubmit} className="mx-auto flex w-full max-w-4xl items-center space-x-2">
          <Input type="text" placeholder="Search for products..." className="flex-grow" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Button type="submit" disabled={isLoading}><Search className="h-4 w-4" /></Button>
        </form>
      </div>

      <div className="flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
        <div className="hidden h-full w-1/2 md:block">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
            ref={(instance) => { if (instance) mapRef.current = instance.getMap(); }}
          >
            {userLocation && <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />}
            {uniqueStores.map((store) => (
              <Marker key={store.storeId} longitude={store.storeLongitude} latitude={store.storeLatitude} onClick={() => handleMarkerClick(store)}>
                <img src={StoreIcon} alt="Store" className={cn("h-8 w-8 cursor-pointer transition-transform duration-300", selectedStoreId === store.storeId ? "scale-125" : "scale-100")} />
              </Marker>
            ))}
            {selectedStoreId && (() => {
              const store = uniqueStores.find(s => s.storeId === selectedStoreId);
              if (!store) return null;
              return (
                <Popup longitude={store.storeLongitude} latitude={store.storeLatitude} onClose={() => setSelectedStoreId(null)} closeOnClick={false} anchor="bottom">
                  <div className="p-1">
                    <h3 className="font-bold">{store.storeName}</h3>
                    <p className="text-xs">{store.storeAddress}</p>
                  </div>
                </Popup>
              );
            })()}
          </Map>
        </div>
        <div className="h-full w-full flex-grow overflow-y-auto md:w-1/2">
          {isLoading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="divide-y">
              {processedProductResults.map((result) => (
                <div key={result.productId} className="flex cursor-pointer items-start gap-4 p-4 hover:bg-gray-100" onClick={() => navigate(`/store/${result.storeId}?product=${result.productId}`)}>
                  <img src={result.productImageUrl || "/placeholder.svg"} alt={result.productName} className="h-20 w-20 flex-shrink-0 rounded-md object-cover" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold">{result.productName}</h3>
                    <p className="text-sm text-gray-600">{result.storeName}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <p className="text-lg font-bold text-green-600">{result.currency_symbol}{result.productPrice.toFixed(2)}</p>
                      <p className={`text-sm font-medium ${result.stockQuantity > 0 ? "text-green-500" : "text-red-500"}`}>
                        {result.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                      </p>
                    </div>
                    {result.formattedDistance && <p className="mt-1 text-sm text-gray-500">Distance: {result.formattedDistance}</p>}
                  </div>
                  <Button variant="ghost" size="icon" className="hidden sm:inline-flex" onClick={(e) => { e.stopPropagation(); handleMarkerClick(result); }}>
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;