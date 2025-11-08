import React, { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Popup, ViewState } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2, RefreshCw, Heart, SlidersHorizontal, Phone, Clock } from "lucide-react";
import { MAPBOX_TOKEN, MAPBOX_LIGHT_STYLE, MAPBOX_DARK_STYLE } from "@/config";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, formatDistance, cn, getStoreStatus } from "@/lib/utils";
import StoreIcon from "@/assets/store.svg";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation";
import { useFavorites } from "@/hooks/use-favorites";
import SearchFilterModal from "@/components/SearchFilterModal";
import SearchBar from "@/components/SearchBar";
import { addSearchTerm } from "@/utils/searchHistory";
import { useIsMobile } from "@/hooks/use-mobile"; // Import useIsMobile hook
import { useTheme } from "next-themes"; // Import useTheme hook
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerOverlay,
  DrawerPortal,
  DrawerClose,
} from "@/components/ui/drawer"; // Import Drawer components

const defaultCenter = {
  latitude: 6.5244, // Lagos, Nigeria latitude
  longitude: 3.3792, // Lagos, Nigeria longitude
  zoom: 10,
};

interface OpeningHour {
  day: string;
  open: string;
  close: string;
}

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
  storeOpeningHours: OpeningHour[] | null;
  storePhoneNumber?: string;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialSearchQuery = searchParams.get("query") || "";
  const [currentSearchQuery, setCurrentSearchQuery] = useState(initialSearchQuery);
  const [viewState, setViewState] = useState<Partial<ViewState>>(defaultCenter);
  const [selectedProductResult, setSelectedProductResult] = useState<ProductWithStoreInfo | null>(null);
  const [allProducts, setAllProducts] = useState<ProductWithStoreInfo[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<ProductWithStoreInfo[]>([]);

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentProximityFilter, setCurrentProximityFilter] = useState<number | null>(() => {
    const param = searchParams.get("proximity");
    return param ? parseInt(param) : null;
  });
  const [currentMinPriceFilter, setCurrentMinPriceFilter] = useState<number | null>(() => {
    const param = searchParams.get("minPrice");
    return param ? parseFloat(param) : null;
  });
  const [currentMaxPriceFilter, setCurrentMaxPriceFilter] = useState<number | null>(() => {
    const param = searchParams.get("maxPrice");
    return param ? parseFloat(param) : null;
  });

  const { userLocation, loading: loadingLocation, locationStatus, refreshLocation } = useHighPrecisionGeolocation();
  const { isFavorited, addFavorite, removeFavorite, userId } = useFavorites();
  const isMobile = useIsMobile();
  const { theme } = useTheme(); // Get current theme

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for controlling the drawer

  // Determine if any filter is active for visual highlighting
  const isFilterActive = useMemo(() => {
    return currentProximityFilter !== null || currentMinPriceFilter !== null || currentMaxPriceFilter !== null;
  }, [currentProximityFilter, currentMinPriceFilter, currentMaxPriceFilter]);

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
            stores (id, store_name, address, latitude, longitude, is_active, opening_hours, phone_number)
          `)
          .eq('is_active', true);

        if (currentSearchQuery) {
          query = query.ilike('name', `%${currentSearchQuery}%`);
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
            storeOpeningHours: product.stores.opening_hours,
            storePhoneNumber: product.stores.phone_number,
          }));

        setAllProducts(fetchedResults);
        if (fetchedResults.length === 0) {
          toast.info(`No products found for "${currentSearchQuery}".`);
        }
      } catch (error) {
        console.error("Unexpected error fetching product results:", error);
        toast.error("An unexpected error occurred.");
        setAllProducts([]);
      }
    };

    fetchAllProducts();
  }, [currentSearchQuery]);

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
    if (isMobile) {
      setIsDrawerOpen(true); // Open drawer on marker click for mobile
    }
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
  }, []);

  const handleSearch = useCallback((query: string) => {
    setCurrentSearchQuery(query);
    addSearchTerm(query.trim()); // Save search term
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("query", query);
    setSearchParams(newSearchParams);
  }, [searchParams, setSearchParams]);

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

  const mapStyle = theme === "dark" ? MAPBOX_DARK_STYLE : MAPBOX_LIGHT_STYLE;

  const renderProductCard = (product: ProductWithStoreInfo, isMobileView: boolean) => {
    const { statusText: storeStatusText, isOpen: isStoreOpen } = getStoreStatus(product.storeOpeningHours);
    return (
      <div
        key={product.productId}
        className={cn(
          "flex items-center py-2 px-3 cursor-pointer transition-colors hover:bg-accent/50",
          selectedProductResult?.productId === product.productId && "bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500",
          !isMobileView && "border-b border-border" // Subtle divider for desktop
        )}
        onClick={() => {
          navigate(`/store/${product.storeId}?product=${product.productId}`);
          if (isMobileView) setIsDrawerOpen(false); // Close drawer on navigation for mobile
        }}
      >
        {/* Product Image */}
        <img
          src={product.productImageUrl || "/placeholder.svg"}
          alt={product.productName}
          className="h-16 w-16 object-cover rounded-md flex-shrink-0 mr-3"
        />

        {/* Right-side info block */}
        <div className="flex-grow min-w-0">
          <h4 className="font-bold text-base truncate">{product.productName}</h4>
          <p className="text-sm text-muted-foreground truncate">{product.storeName}</p>
          <p className="text-xs text-muted-foreground truncate">
            {product.storeAddress.split(' ').slice(0, 2).join(' ')}{product.storeAddress.split(' ').length > 2 ? '...' : ''}
          </p>
          <div className="flex items-center flex-wrap gap-x-2 text-xs mt-1">
            <span className={cn("font-semibold", product.stockQuantity > 0 ? "text-green-500" : "text-red-500")}>
              {product.stockQuantity > 0 ? "🟢 In Stock" : "🔴 Out of Stock"}
            </span>
            <span className="font-bold text-brand-accent">
              {product.currency_symbol}{product.productPrice.toFixed(2)}
            </span>
            {userLocation && product.formattedDistance !== undefined && (
              <span className="text-muted-foreground">{product.formattedDistance}</span>
            )}
            <span className={cn("font-semibold", isStoreOpen ? "text-green-500" : "text-muted-foreground")}>
              {storeStatusText}
            </span>
          </div>
        </div>

        {/* Icons on far right */}
        <div className="flex flex-col items-end ml-auto pl-2 space-y-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => handleToggleFavorite(e, product)}
            className="h-8 w-8 p-0"
          >
            <Heart
              className={cn(
                "h-5 w-5",
                isFavorited(product.productId) ? "text-red-500 fill-red-500" : "text-muted-foreground"
              )}
            />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => handleMapIconClick(e, product)} className="h-8 w-8 p-0">
            <MapPin className="h-5 w-5 text-primary" />
          </Button>
        </div>
      </div>
    );
  };

  const commonHeader = (
    <div className="w-full max-w-4xl text-center space-y-6 mb-4">
      <h1 className="text-4xl font-bold text-foreground">Search Results for "{initialSearchQuery}"</h1>
      <div className="flex w-full items-center space-x-2 mx-auto">
        <SearchBar
          initialQuery={initialSearchQuery}
          onSearch={handleSearch}
          onOpenFilters={() => setIsFilterModalOpen(true)}
          isFilterActive={isFilterActive}
          placeholder="Refine your search..."
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
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
          <span className="text-destructive">Location unavailable.</span>
        )}
      </div>
    </div>
  );

  const mapComponent = (
    <Map
      {...viewState}
      onMove={evt => setViewState(evt.viewState)}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      mapboxAccessToken={MAPBOX_TOKEN}
      ref={(instance) => {
        if (instance) {
          mapRef.current = instance.getMap();
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
            if (firstProductInStore) handleMarkerClick(firstProductInStore);
          }}
        >
          <img src={StoreIcon} alt="Store" className="h-8 w-8 text-primary" />
        </Marker>
      ))}

      {selectedProductResult && (
        <Popup
          longitude={selectedProductResult.storeLongitude}
          latitude={selectedProductResult.storeLatitude}
          onClose={() => setSelectedProductResult(null)}
          closeOnClick={false}
          anchor="bottom"
          className="dark:text-foreground" // Ensure popup text is visible in dark mode
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

  if (isMobile) {
    return (
      <div className="relative flex flex-col h-screen w-screen overflow-hidden">
        <div className="absolute top-0 left-0 w-full p-4 z-10 bg-background/80 backdrop-blur-sm">
          {commonHeader}
        </div>
        <div className="flex-grow w-full h-full mt-[180px] md:mt-0"> {/* Adjust margin for header */}
          {mapComponent}
        </div>

        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} snapPoints={[0.3, 0.9]}>
          <DrawerTrigger asChild>
            <div className="absolute bottom-0 left-0 right-0 h-[30vh] bg-background rounded-t-2xl shadow-lg flex flex-col items-center pt-2 cursor-grab active:cursor-grabbing">
              <div className="w-12 h-1.5 bg-muted-foreground/50 rounded-full mb-2" />
              <h2 className="text-lg font-semibold text-foreground">
                {filteredProducts.length} Products Found
              </h2>
            </div>
          </DrawerTrigger>
          <DrawerPortal>
            <DrawerOverlay className="fixed inset-0 bg-black/40" />
            <DrawerContent className="fixed bottom-0 left-0 right-0 mt-24 flex h-[90%] flex-col rounded-t-[10px] bg-background">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3" />
              <DrawerHeader className="text-center">
                <DrawerTitle className="text-foreground">Matching Products & Stores</DrawerTitle>
                <DrawerDescription className="text-muted-foreground">
                  Tap a product to see details or a map pin to recenter.
                </DrawerDescription>
              </DrawerHeader>
              <ScrollArea className="flex-grow overflow-y-auto">
                <div className="p-4 space-y-0">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => renderProductCard(product, true))
                  ) : (
                    <p className="text-center text-muted-foreground mt-8 p-4">No matching products or stores found.</p>
                  )}
                </div>
              </ScrollArea>
            </DrawerContent>
          </DrawerPortal>
        </Drawer>

        <SearchFilterModal
          isOpen={isFilterModalOpen}
          onClose={() => setIsFilterModalOpen(false)}
          onApplyFilters={handleApplyFilters}
        />
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="w-1/2 flex flex-col">
        <div className="p-4 bg-background/80 backdrop-blur-sm z-10">
          {commonHeader}
        </div>
        <div className="flex-grow w-full">
          {mapComponent}
        </div>
      </div>
      <div className="w-1/2 h-full p-4 bg-card text-card-foreground shadow-lg overflow-y-auto border-l border-border">
        <Card className="h-full flex flex-col border-none shadow-none bg-transparent">
          <CardHeader className="p-2 pb-1">
            <CardTitle className="text-lg">Matching Products & Stores</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full w-full">
              <div className="space-y-0">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => renderProductCard(product, false))
                ) : (
                  <p className="text-center text-muted-foreground mt-8 p-4">No matching products or stores found.</p>
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