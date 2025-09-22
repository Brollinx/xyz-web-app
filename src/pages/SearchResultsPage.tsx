import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Popup, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, Clock, Milestone } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils"; // Keep cn for styling

const defaultCenter = {
  latitude: 6.5244, // Lagos, Nigeria latitude
  longitude: 3.3792, // Lagos, Nigeria longitude
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
  walkingDistanceKm?: number; // Road-based distance
  walkingDurationMinutes?: number; // Road-based duration
}

interface UserLocation {
  lat: number;
  lng: number;
}

type LocationStatus = "loading" | "success" | "denied";

// Helper function to calculate bounding box for an array of points
const getBoundsForPoints = (points: { lat: number; lng: number }[]) => {
  if (points.length === 0) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const point of points) {
    minLng = Math.min(minLng, point.lng);
    minLat = Math.min(minLat, point.lat);
    maxLng = Math.max(maxLng, point.lng);
    maxLat = Math.max(maxLat, point.lat);
  }

  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
};

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
  const [loadingDirections, setLoadingDirections] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null); // Ref to get map instance

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLoc);
          setViewState({ latitude: userLoc.lat, longitude: userLoc.lng, zoom: 12 });
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

  // Effect to fetch directions for unique stores
  useEffect(() => {
    const fetchDirectionsForStores = async () => {
      if (locationStatus !== "success" || !userLocation || productResults.length === 0) {
        setLoadingDirections(false);
        return;
      }

      setLoadingDirections(true);
      const uniqueStores = new Map<string, { lat: number; lng: number }>();
      productResults.forEach(p => {
        if (!uniqueStores.has(p.storeId)) {
          uniqueStores.set(p.storeId, { lat: p.storeLatitude, lng: p.storeLongitude });
        }
      });

      const directionPromises = Array.from(uniqueStores.entries()).map(async ([storeId, storeLoc]) => {
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${storeLoc.lng},${storeLoc.lat}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
        try {
          const response = await fetch(url);
          const data = await response.json();
          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            return {
              storeId,
              distance: parseFloat((route.distance / 1000).toFixed(1)), // in km, 1 decimal place
              duration: Math.round(route.duration / 60), // in minutes
            };
          }
        } catch (error) {
          console.error(`Error fetching directions for store ${storeId}:`, error);
        }
        return { storeId, distance: undefined, duration: undefined };
      });

      const results = await Promise.all(directionPromises);
      const newStoreDirections = new Map<string, { distance?: number; duration?: number }>();
      results.forEach(res => {
        if (res) {
          newStoreDirections.set(res.storeId, { distance: res.distance, duration: res.duration });
        }
      });

      setProductResults(prevResults =>
        prevResults.map(product => {
          const directions = newStoreDirections.get(product.storeId);
          return {
            ...product,
            walkingDistanceKm: directions?.distance,
            walkingDurationMinutes: directions?.duration,
          };
        }).sort((a, b) => (a.walkingDistanceKm ?? Infinity) - (b.walkingDistanceKm ?? Infinity))
      );
      setLoadingDirections(false);
    };

    fetchDirectionsForStores();
  }, [productResults.length, userLocation, locationStatus]); // Rerun when productResults count or userLocation changes

  // Effect to fit map bounds to user and nearby stores
  useEffect(() => {
    if (mapRef.current && userLocation && productResults.length > 0 && !loadingDirections) {
      const pointsToBound: { lat: number; lng: number }[] = [{ lat: userLocation.lat, lng: userLocation.lng }];

      const storesWithin30km = productResults.filter(
        (result) => result.walkingDistanceKm !== undefined && result.walkingDistanceKm <= 30
      );

      const uniqueStoresWithin30km = new Set<string>();
      storesWithin30km.forEach(result => {
        if (!uniqueStoresWithin30km.has(result.storeId)) {
          pointsToBound.push({ lat: result.storeLatitude, lng: result.storeLongitude });
          uniqueStoresWithin30km.add(result.storeId);
        }
      });

      if (pointsToBound.length > 1) { // Need at least user + 1 store to fit bounds meaningfully
        const bounds = getBoundsForPoints(pointsToBound);
        if (bounds) {
          mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
        }
      } else if (userLocation) { // If no stores within 30km, just center on user
        mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1000 });
      }
    }
  }, [userLocation, productResults, loadingDirections, mapRef.current]);

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
    return productResults.reduce((acc, result) => {
      if (!seenStoreIds.has(result.storeId)) {
        seenStoreIds.add(result.storeId);
        acc.push({
          id: result.storeId,
          lat: result.storeLatitude,
          lng: result.storeLongitude,
          name: result.storeName,
        });
      }
      return acc;
    }, [] as { id: string; lat: number; lng: number; name: string }[]);
  }, [productResults]);

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

      <div className="w-full max-w-4xl h-[400px] mb-4 rounded-lg overflow-hidden shadow-lg">
        <Map
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          ref={(instance) => {
            if (instance) {
              mapRef.current = instance.getMap();
            }
          }}
        >
          {userLocation && (
            <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />
          )}

          {uniqueStoresForMarkers.map((store) => (
            <Marker
              key={store.id}
              longitude={store.lng}
              latitude={store.lat}
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                const firstProductInStore = productResults.find(pr => pr.storeId === store.id);
                if (firstProductInStore) handleMarkerClick(firstProductInStore);
              }}
            >
              <MapPin className="h-8 w-8 text-red-600" /> {/* Custom storefront icon */}
            </Marker>
          ))}

          {selectedProductResult && (
            <Popup
              longitude={selectedProductResult.storeLongitude}
              latitude={selectedProductResult.storeLatitude}
              onClose={() => setSelectedProductResult(null)}
              closeOnClick={false}
              anchor="bottom"
            >
              <div className="p-1">
                <h3 className="font-bold text-md">{selectedProductResult.storeName}</h3>
                <p className="text-xs">{selectedProductResult.storeAddress}</p>
                <p className="text-xs font-medium mt-1">{selectedProductResult.productName}</p>
                <p className="text-xs">Price: ${selectedProductResult.productPrice.toFixed(2)}</p>
              </div>
            </Popup>
          )}
        </Map>
      </div>

      <div className="w-full max-w-4xl">
        <Card className="h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Matching Products & Stores</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-3">
                {loadingDirections && productResults.length > 0 ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                    <p>Calculating road distances and times...</p>
                  </div>
                ) : productResults.length > 0 ? (
                  productResults.map((result) => (
                    <div
                      key={result.productId}
                      className={cn(
                        "p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between",
                        selectedProductResult?.productId === result.productId && "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                      )}
                      onClick={() => navigate(`/store/${result.storeId}?product=${result.productId}`)}
                    >
                      <div className="flex items-center flex-grow">
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
                          {locationStatus === "success" && result.walkingDistanceKm !== undefined && result.walkingDurationMinutes !== undefined ? (
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <div className="flex items-center gap-1">
                                <Milestone className="h-4 w-4 text-green-600" />
                                <span>{result.walkingDistanceKm.toFixed(1)} km</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span>{result.walkingDurationMinutes} min</span>
                              </div>
                            </div>
                          ) : locationStatus === "denied" ? (
                            <p className="text-sm text-red-500">Location access denied. Distances not shown.</p>
                          ) : (
                            <p className="text-sm text-gray-500">Calculating route...</p>
                          )}
                        </div>
                      </div>
                      <div className="pl-2">
                        <Button variant="ghost" size="icon" onClick={(e) => handleMapIconClick(e, result)}>
                          <MapPin className="h-6 w-6 text-blue-600" />
                        </Button>
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
  );
};

export default SearchResultsPage;