import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, formatDistance, getStoreStatus } from "@/lib/utils";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation";
import { useFavorites } from "@/hooks/use-favorites";
import { addSearchTerm } from "@/utils/searchHistory";
import type { ViewState } from "react-map-gl";
import { useTheme } from "next-themes";
import { MAPBOX_LIGHT_STYLE, MAPBOX_DARK_STYLE } from "@/config";

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

export interface ProductWithStoreInfo {
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

export function useSearchResultsLogic() {
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
  const { isFavorited, addFavorite, removeFavorite } = useFavorites();
  const { resolvedTheme } = useTheme();

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
    if (locationStatus === "success" && userLocation) {
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
        .filter(product => (currentProximityFilter === null || (product.distanceMeters ?? Infinity) <= currentProximityFilter))
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
  const fitMapToBounds = useCallback((mapInstance: mapboxgl.Map | null) => {
    if (mapInstance && userLocation && filteredProducts.length > 0) {
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
          mapInstance.fitBounds(bounds, { duration: 1000 }); // Removed padding
        }
      } else if (userLocation) {
        mapInstance.flyTo({ center: [userLocation.lng, userLocation.lat], zoom: 12, duration: 1000 });
      }
    }
  }, [userLocation, filteredProducts, currentProximityFilter]);

  const handleMarkerClick = useCallback((productResult: ProductWithStoreInfo) => {
    setSelectedProductResult(productResult);
    setViewState({
      latitude: productResult.storeLatitude,
      longitude: productResult.storeLongitude,
      zoom: 14,
      // transitionDuration: 1000, // Smooth transition to marker
    });
  }, []);

  // Effect to update map view when selectedProductResult changes (e.g., from list click)
  useEffect(() => {
    if (selectedProductResult) {
      setViewState({
        latitude: selectedProductResult.storeLatitude,
        longitude: selectedProductResult.storeLongitude,
        zoom: 14,
        // transitionDuration: 1000, // Smooth transition to selected product's store
      });
    }
  }, [selectedProductResult]);


  const handleToggleFavorite = useCallback((e: React.MouseEvent, product: ProductWithStoreInfo) => {
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
  }, [isFavorited, addFavorite, removeFavorite]);

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

  const mapStyle = resolvedTheme === "dark" ? MAPBOX_DARK_STYLE : MAPBOX_LIGHT_STYLE;

  return {
    initialSearchQuery,
    currentSearchQuery,
    viewState,
    setViewState,
    selectedProductResult,
    setSelectedProductResult,
    filteredProducts,
    isFilterModalOpen,
    setIsFilterModalOpen,
    currentProximityFilter,
    currentMinPriceFilter,
    currentMaxPriceFilter,
    isFilterActive,
    userLocation,
    loadingLocation,
    locationStatus,
    refreshLocation,
    isFavorited,
    handleMarkerClick,
    handleToggleFavorite,
    handleApplyFilters,
    handleSearch,
    uniqueStoresForMarkers,
    mapStyle,
    fitMapToBounds,
  };
}