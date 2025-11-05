import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Popup, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, RefreshCw, Heart, SlidersHorizontal } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, formatDistance, cn } from "@/lib/utils";
import StoreIcon from "@/assets/store.svg";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation";
import { useFavorites } from "@/hooks/use-favorites"; // Updated import path
import SearchFilterModal from "@/components/SearchFilterModal";

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
  currency: string;
  currency_symbol?: string;
  distanceMeters?: number;
  formattedDistance?: string;
}

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
  const [allProducts, setAllProducts] = useState<ProductWithStoreInfo[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStoreInfo[]>([]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentProximityFilter, setCurrentProximityFilter] = useState<number | null>(null);
  const [currentMinPriceFilter, setCurrentMinPriceFilter] = useState<number | null>(null);
  const [currentMaxPriceFilter, setCurrentMaxPriceFilter] = useState<number | null>(null);

  const { userLocation, loading: loadingLocation, locationStatus, refreshLocation } = useHighPrecisionGeolocation();
  const { isFavorited, addFavorite, removeFavorite, userId } = useFavorites();

  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Effect to set initial map view based on user location
  useEffect(() => {
    if (locationStatus === "success" && userLocation) {
      setViewState({ latitude: userLocation.lat, longitude: userLocation.lng, zoom: 12 });
    } else if (locationStatus === "denied") {
      toast.warning("Location access denied. Distances will not be shown. Showing default center (Lagos).");
    }
  }, [locationStatus, userLocation]);

  // Fetch all products initially (without client-side filters applied yet)
  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        let query = supabase
          .from('products')
          .select(`
            id, name, price, stock_quantity, is_active, image_url, currency, currency_symbol,
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
          setAllProducts([]);
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
            currency: product.currency || 'USD',
            currency_symbol: product.currency_symbol || '$',
            storeId: product.stores.id,
            storeName: product.stores.store_name,
            storeAddress: product.stores.address,
            storeLatitude: product.stores.latitude,
            storeLongitude: product.stores.longitude,
          }));

        setAllProducts(fetchedResults);
        if (fetchedResults.length === 0) {
          toast.info(`No products found for "${searchQuery}".`);
        }
      } catch (error) {
        console.error("Unexpected error fetching product results:", error);
        toast.error("An unexpected error occurred.");
        setAllProducts([]);
      }
    };

    fetchAllProducts();
  }, [searchQuery]);

  // Apply filters to allProducts to get filteredProducts
  useEffect(() => {
    let tempFilteredProducts = allProducts;

    // Apply price range filter
    if (currentMinPriceFilter !== null) {
      tempFilteredProducts = tempFilteredProducts.filter(p => p.productPrice >= currentMinPriceFilter);
    }
    if (currentMaxPriceFilter !== null) {
      tempFilteredProducts = tempFilteredProducts.filter(p => p.productPrice <= currentMaxPriceFilter);
    }

    // Calculate distances and apply proximity filter
    if (locationStatus === "success" && userLocation && currentProximityFilter !== null) {
      tempFilteredProducts = tempFilteredProducts
        .map(product => {
          const distanceInMeters = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            product.storeLatitude,
            product.storeLongitude
          );
          return {
            ...product,
            distanceMeters: distanceInMeters,
            formattedDistance: formatDistance(distanceInMeters),
          };
        })
        .filter(product => (product.distanceMeters ?? Infinity) <= currentProximityFilter)
        .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    } else if (locationStatus === "success" && userLocation) {
      // If no proximity filter, just calculate distances for display and sort
      tempFilteredProducts = tempFilteredProducts
        .map(product => {
          const distanceInMeters = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            product.storeLatitude,
            product.storeLongitude
          );
          return {
            ...product,
            distanceMeters: distanceInMeters,
            formattedDistance: formatDistance(distanceInMeters),
          };
        })
        .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    } else {
      // If no user location, just sort by name or default order
      tempFilteredProducts = tempFilteredProducts.sort((a, b) => a.productName.localeCompare(b.productName));
    }

    setFilteredProducts(tempFilteredProducts);
  }, [allProducts, currentProximityFilter, currentMinPriceFilter, currentMaxPriceFilter, userLocation, locationStatus]);

  // Effect to fit map bounds to user and nearby stores
  useEffect(() => {
    if (mapRef.current && userLocation && filteredProducts.length > 0) {
      const pointsToBound: { lat: number; lng: number }[] = [{ lat: userLocation.lat, lng: userLocation.lng }];

      const storesWithinProximity = filteredProducts.filter(
        (result) => result.distanceMeters !== undefined && (currentProximityFilter === null || result.distanceMeters <= currentProximityFilter)
      );

      const uniqueStores = new Set<string>();
      storesWithinProximity.forEach(result => {
        if (!uniqueStores.has(result.storeId)) {
          pointsToBound.push({ lat: result.storeLatitude, lng: result.storeLongitude });
          uniqueStores.add(result.storeId);
        }
      });

      if (pointsToBound.length > 1) {
        const bounds = getBoundsForPoints(pointsToBound);
        if (bounds) {
          mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
        }
      } else if (userLocation) {
        mapRef.current.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1000 });
      }
    }
  }, [userLocation, filteredProducts, mapRef.current, currentProximityFilter]);

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

  const handleToggleFavorite = (e: React.MouseEvent, product: ProductWithStoreInfo) => {
    e.stopPropagation();
    if (isFavorited(product.productId)) {
      removeFavorite(product.productId);
    } else {
      addFavorite({
        product_id: product.productId,
        store_id: product.storeId,
        product_name: product.productName,
        price: product.productPrice,
        image_url: product.productImageUrl,
        store_name: product.storeName,
        currency: product.currency,
        currency_symbol: product.currency_symbol,
      });
    }
  };

  const handleApplyFilters = useCallback((proximity: number | null, minPrice: number | null, maxPrice: number | null) => {
    setCurrentProximityFilter(proximity);
    setCurrentMinPriceFilter(minPrice);
    setCurrentMaxPriceFilter(maxPrice);
    setIsFilterModalOpen(false); // Close modal after applying
  }, []);

  const uniqueStoresForMarkers = useMemo(() => {
    const seenStoreIds = new Set<string>();
    return filteredProducts.reduce((acc, result) => {
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
  }, [filteredProducts]);

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
          <Button variant="outline" size="icon" onClick={() => setIsFilterModalOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          {loadingLocation ? (
            <span className="flex items-center"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Getting location...</span>
          ) : userLocation ? (
            <span className="flex items-center">
              Location Accuracy: {Math.round(userLocation.accuracy_meters)} m
              <Button variant="ghost" size="sm" onClick={refreshLocation} className="ml-2 h-auto p-1">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </span>
          ) : (
            <span className="text-red-500">Location unavailable.</span>
          )}
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
                const firstProductInStore = filteredProducts.find(pr => pr.storeId === store.id);
                if (firstProductInStore) handleMarkerClick(firstProductInStore);
              }}
            >
              <img src={StoreIcon} alt="Store" className="h-8 w-8 text-red-600" />
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
                <p className="text-xs">Price: {selectedProductResult.currency_symbol}{selectedProductResult.productPrice.toFixed(2)}</p>
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
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((result) => (
                    <div
                      key={result.productId}
                      className={cn(
                        "p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between",
                        selectedProductResult?.productId === result.productId && "bg-blue-50 border-blue-500 ring-2 ring-blue-200"
                      )}
                      onClick={() => navigate(`/store/${result.storeId}?product=${result.productId}`)}
                    >
                      <div className="flex items-center flex-grow">
                        <img
                          src={result.productImageUrl || "/placeholder.svg"}
                          alt={result.productName}
                          className="h-16 w-16 object-cover rounded-md mr-4 flex-shrink-0"
                        />
                        <div className="flex-grow">
                          <h4 className="font-semibold text-lg">{result.productName}</h4>
                          <p className="text-sm text-gray-700">{result.storeName}</p>
                          <p className="text-sm text-gray-600">{result.storeAddress}</p>
                          <p className="text-md font-bold text-green-600">
                            {result.currency_symbol}{result.productPrice.toFixed(2)}
                          </p>
                          <p className="text-sm">
                            Stock:{" "}
                            <span className={result.stockQuantity > 0 ? "text-green-500" : "text-red-500"}>
                              {result.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                          </p>
                          {loadingLocation ? (
                            <p className="text-sm text-gray-500 flex items-center">
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Getting your location to calculate distance...
                            </p>
                          ) : userLocation && result.formattedDistance !== undefined ? (
                            <p className="text-sm text-gray-500">Distance: {result.formattedDistance}</p>
                          ) : (
                            <p className="text-sm text-red-500">Location unavailable. Distances not shown.</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end pl-2">
                        <Button variant="ghost" size="icon" onClick={(e) => handleMapIconClick(e, result)}>
                          <MapPin className="h-6 w-6 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleToggleFavorite(e, result)}
                          className="mt-2"
                        >
                          <Heart
                            className={cn(
                              "h-6 w-6",
                              isFavorited(result.productId) ? "text-red-500 fill-red-500" : "text-gray-400"
                            )}
                          />
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
      <SearchFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
      />
    </div>
  );
};

export default SearchResultsPage;