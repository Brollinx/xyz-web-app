import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Popup, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, AlertTriangle } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, cn } from "@/lib/utils";

const defaultCenter = {
  latitude: 6.5244, // Lagos, Nigeria latitude
  longitude: 3.3792, // Lagos, Nigeria longitude
  zoom: 11,
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
  distance?: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

type LocationStatus = "loading" | "success" | "denied";

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSearchQuery = searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [viewState, setViewState] = useState<Partial<ViewState>>(defaultCenter);
  const [selectedProductResult, setSelectedProductResult] = useState<ProductWithStoreInfo | null>(null);
  const [productResults, setProductResults] = useState<ProductWithStoreInfo[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("loading");

  useEffect(() => {
    if (!MAPBOX_TOKEN) {
      toast.error("Mapbox token is missing. Please add VITE_MAPBOX_TOKEN to your .env file.");
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLoc);
          setViewState((prev) => ({ ...prev, latitude: userLoc.lat, longitude: userLoc.lng }));
          setLocationStatus("success");
          toast.success("Map centered on your current location!");
        },
        () => {
          setLocationStatus("denied");
          toast.warning("Location access denied. Distances will not be shown.");
        }
      );
    } else {
      setLocationStatus("denied");
      toast.warning("Geolocation is not supported by your browser.");
    }
  }, []);

  useEffect(() => {
    const fetchProductResults = async () => {
      let query = supabase
        .from('products')
        .select(`id, name, price, stock_quantity, is_active, image_url, stores (id, store_name, address, latitude, longitude, is_active)`)
        .eq('is_active', true);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to fetch product results.");
        return;
      }

      const fetchedResults: ProductWithStoreInfo[] = data
        .filter((product: any) => product.stores && product.stores.is_active && product.stores.latitude !== null && product.stores.longitude !== null)
        .map((product: any) => ({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          stockQuantity: product.stock_quantity,
          productImageUrl: product.image_url,
          storeId: product.stores.id,
          storeName: product.stores.store_name,
          storeAddress: product.stores.address,
          storeLatitude: product.stores.latitude,
          storeLongitude: product.stores.longitude,
        }));

      setProductResults(fetchedResults);
    };

    fetchProductResults();
  }, [searchQuery]);

  const processedProductResults = useMemo(() => {
    if (locationStatus !== "success" || !userLocation) return productResults;
    return productResults
      .map(product => ({
        ...product,
        distance: calculateDistance(userLocation.lat, userLocation.lng, product.storeLatitude, product.storeLongitude),
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [productResults, userLocation, locationStatus]);

  const handleMarkerClick = (productResult: ProductWithStoreInfo) => {
    setSelectedProductResult(productResult);
    setViewState({
      latitude: productResult.storeLatitude,
      longitude: productResult.storeLongitude,
      zoom: 14,
    });
  };

  const handleMapIconClick = (e: React.MouseEvent, productResult: ProductWithStoreInfo) => {
    e.stopPropagation();
    handleMarkerClick(productResult);
  };

  const uniqueStoresForMarkers = useMemo(() => {
    const seenStoreIds = new Set<string>();
    return processedProductResults.filter(result => {
      if (!seenStoreIds.has(result.storeId)) {
        seenStoreIds.add(result.storeId);
        return true;
      }
      return false;
    });
  }, [processedProductResults]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-yellow-50 rounded-lg max-w-md">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-yellow-800 mb-2">Mapbox Configuration Required</h2>
          <p className="text-yellow-700 mb-4">
            Mapbox token is missing. Please add your VITE_MAPBOX_TOKEN to the .env file.
          </p>
          <p className="text-sm text-yellow-600">
            Using a default token for demonstration purposes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Search Results for "{initialSearchQuery}"</h1>
        <div className="flex w-full items-center space-x-2 mx-auto">
          <Input type="text" placeholder="Refine your search..." className="flex-grow" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          <Button type="submit"><Search className="h-4 w-4 mr-2" /> Search</Button>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1 h-[400px]">
          <Map
            {...viewState}
            onMove={evt => setViewState(evt.viewState)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            {userLocation && (
              <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />
            )}
            {uniqueStoresForMarkers.map((result) => (
              <Marker
                key={result.storeId}
                longitude={result.storeLongitude}
                latitude={result.storeLatitude}
                onClick={() => handleMarkerClick(result)}
              />
            ))}
            {selectedProductResult && (
              <Popup
                longitude={selectedProductResult.storeLongitude}
                latitude={selectedProductResult.storeLatitude}
                onClose={() => setSelectedProductResult(null)}
                closeOnClick={false}
                anchor="top"
              >
                <div className="p-1">
                  <h3 className="font-bold">{selectedProductResult.storeName}</h3>
                  <p className="text-xs">{selectedProductResult.productName}</p>
                  <p className="text-xs font-semibold">${selectedProductResult.productPrice.toFixed(2)}</p>
                </div>
              </Popup>
            )}
          </Map>
        </div>

        <div className="md:col-span-1">
          <Card className="h-[400px] flex flex-col">
            <CardHeader><CardTitle>Matching Products & Stores</CardTitle></CardHeader>
            <CardContent className="flex-grow p-0">
              <ScrollArea className="h-full w-full">
                <div className="p-4 space-y-3">
                  {processedProductResults.map((result) => (
                    <div
                      key={result.productId}
                      className={cn("p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between", selectedProductResult?.productId === result.productId && "bg-blue-50 border-blue-500")}
                      onClick={() => navigate(`/store/${result.storeId}?product=${result.productId}`)}
                    >
                      <div className="flex items-center flex-grow">
                        {result.productImageUrl && <img src={result.productImageUrl} alt={result.productName} className="h-16 w-16 object-cover rounded-md mr-4" />}
                        <div className="flex-grow">
                          <h4 className="font-semibold">{result.productName}</h4>
                          <p className="text-sm text-gray-700">{result.storeName}</p>
                          <p className="text-md font-bold text-green-600">${result.productPrice.toFixed(2)}</p>
                          {locationStatus === "loading" && <p className="text-sm text-gray-500 flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating distance...</p>}
                          {locationStatus === "success" && result.distance !== undefined && <p className="text-sm text-gray-500">Distance: {result.distance} km</p>}
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => handleMapIconClick(e, result)}><MapPin className="h-6 w-6 text-blue-600" /></Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;