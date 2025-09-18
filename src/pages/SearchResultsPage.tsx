import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, User, Loader2 } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/config";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, cn } from "@/lib/utils";

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 6.5244, // Lagos, Nigeria latitude
  lng: 3.3792, // Lagos, Nigeria longitude
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
  const initialSearchQuery = searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentCenter, setCurrentCenter] = useState(defaultCenter);
  const [selectedProductResult, setSelectedProductResult] = useState<ProductWithStoreInfo | null>(null);
  const [productResults, setProductResults] = useState<ProductWithStoreInfo[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("loading");
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  // Get user's current location (runs once)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLoc);
          setCurrentCenter(userLoc);
          setLocationStatus("success");
          toast.success("Map centered on your current location!");
        },
        (error) => {
          console.error("Error getting user location:", error);
          setLocationStatus("denied");
          toast.warning("Location access denied. Distances will not be shown. Showing default center (Lagos).");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationStatus("denied");
      toast.warning("Geolocation is not supported by your browser. Showing default center (Lagos).");
    }
  }, []);

  // Fetch products from Supabase when search query changes
  useEffect(() => {
    const fetchProductResults = async () => {
      try {
        let query = supabase
          .from('products')
          .select(`
            id, name, price, stock_quantity, is_active, image_url,
            stores (id, store_name, address, latitude, longitude, is_active)
          `)
          .eq('is_active', true);

        if (searchQuery) {
          query = query.ilike('name', `%${searchQuery}%`);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Error fetching product results:", error);
          toast.error("Failed to fetch product results. Please try again.");
          setProductResults([]);
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
        if (fetchedResults.length > 0) {
          toast.success(`Found ${fetchedResults.length} matching products.`);
        } else {
          toast.info(`No products found for "${searchQuery}".`);
        }
      } catch (error) {
        console.error("Unexpected error fetching product results:", error);
        toast.error("An unexpected error occurred.");
        setProductResults([]);
      }
    };

    fetchProductResults();
  }, [searchQuery]);

  // Calculate distances and sort results when location or products change
  const processedProductResults = useMemo(() => {
    if (locationStatus !== "success" || !userLocation || productResults.length === 0) {
      return productResults;
    }

    return productResults
      .map(product => ({
        ...product,
        distance: calculateDistance(
          userLocation.lat,
          userLocation.lng,
          product.storeLatitude,
          product.storeLongitude
        ),
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [productResults, userLocation, locationStatus]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMarkerClick = (productResult: ProductWithStoreInfo) => {
    setSelectedProductResult(productResult);
    setCurrentCenter({ lat: productResult.storeLatitude, lng: productResult.storeLongitude });
    if (mapRef.current) {
      mapRef.current.panTo({ lat: productResult.storeLatitude, lng: productResult.storeLongitude });
    }
  };

  const handleProductListItemClick = (productResult: ProductWithStoreInfo) => {
    handleMarkerClick(productResult);
  };

  const uniqueStoresForMarkers = useMemo(() => {
    const seenStoreIds = new Set<string>();
    return processedProductResults.reduce((acc, result) => {
      if (!seenStoreIds.has(result.storeId)) {
        seenStoreIds.add(result.storeId);
        acc.push({
          id: result.storeId,
          lat: result.storeLatitude,
          lng: result.storeLongitude,
          name: result.storeName,
          address: result.storeAddress,
        });
      }
      return acc;
    }, [] as { id: string; lat: number; lng: number; name: string; address: string }[]);
  }, [processedProductResults]);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Search Results for "{initialSearchQuery}"</h1>
        <div className="flex w-full items-center space-x-2 mx-auto">
          <Input
            type="text"
            placeholder="Refine your search..."
            className="flex-grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit">
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-1">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={currentCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {userLocation && (
              <Marker
                position={userLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  fillColor: "#4285F4",
                  fillOpacity: 1,
                  strokeColor: "#FFFFFF",
                  strokeWeight: 2,
                  scale: 8,
                }}
                title="You are here"
              />
            )}

            {uniqueStoresForMarkers.map((store) => (
              <Marker
                key={store.id}
                position={{ lat: store.lat, lng: store.lng }}
                onClick={() => {
                  const firstProductInStore = processedProductResults.find(pr => pr.storeId === store.id);
                  if (firstProductInStore) handleMarkerClick(firstProductInStore);
                }}
              />
            ))}

            {selectedProductResult && (
              <InfoWindow
                position={{ lat: selectedProductResult.storeLatitude, lng: selectedProductResult.storeLongitude }}
                onCloseClick={() => setSelectedProductResult(null)}
              >
                <div className="p-2">
                  <h3 className="font-bold text-lg">{selectedProductResult.storeName}</h3>
                  <p className="text-sm">{selectedProductResult.storeAddress}</p>
                  <p className="text-sm font-medium mt-2">{selectedProductResult.productName}</p>
                  <p className="text-sm">Price: ${selectedProductResult.productPrice.toFixed(2)}</p>
                  <p className="text-sm">
                    Stock: {selectedProductResult.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                  {selectedProductResult.distance !== undefined && (
                    <p className="text-sm">Distance: {selectedProductResult.distance} km</p>
                  )}
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        <div className="md:col-span-1">
          <Card className="h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle>Matching Products & Stores</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ScrollArea className="h-full w-full">
                <div className="p-4 space-y-3">
                  {processedProductResults.length > 0 ? (
                    processedProductResults.map((result) => (
                      <div
                        key={result.productId}
                        className={cn(
                          "p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors flex items-center",
                          selectedProductResult?.productId === result.productId && "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                        )}
                        onClick={() => handleProductListItemClick(result)}
                      >
                        {result.productImageUrl && (
                          <img
                            src={result.productImageUrl}
                            alt={result.productName}
                            className="h-16 w-16 object-cover rounded-md mr-4 flex-shrink-0"
                          />
                        )}
                        <div className="flex-grow">
                          <h4 className="font-semibold text-lg">{result.productName}</h4>
                          <p className="text-sm text-gray-700">{result.storeName}</p>
                          <p className="text-sm text-gray-600">{result.storeAddress}</p>
                          <p className="text-md font-bold text-green-600">Price: ${result.productPrice.toFixed(2)}</p>
                          <p className="text-sm">
                            Stock:{" "}
                            <span className={result.stockQuantity > 0 ? "text-green-500" : "text-red-500"}>
                              {result.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                          </p>
                          {locationStatus === "loading" && (
                            <p className="text-sm text-gray-500 flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Getting your location to calculate distance...
                            </p>
                          )}
                          {locationStatus === "success" && result.distance !== undefined && (
                            <p className="text-sm text-gray-500">Distance: {result.distance} km</p>
                          )}
                          {locationStatus === "denied" && (
                            <p className="text-sm text-red-500">Location access denied. Distances not shown.</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 mt-8">No matching products or stores found.</p>
                  )}
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