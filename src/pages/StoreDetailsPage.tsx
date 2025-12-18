import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl";
import { Loader2 } from "lucide-react";
import { MAPBOX_TOKEN, MAPBOX_LIGHT_STYLE, MAPBOX_DARK_STYLE } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import { addViewedStore } from "@/utils/viewedItems";
import { useFavorites } from "@/hooks/use-favorites";
import { useTheme } from "next-themes";
import StoreDetailLayout from "@/components/StoreDetailLayout"; // Import the new layout component

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
  barcode?: string;
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

  const { addFavorite, removeFavorite } = useFavorites();
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
        toast.error("Store ID is missing. Redirecting to home.");
        navigate("/");
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

        if (storeError) {
          console.error("Error fetching store data:", storeError);
          toast.error("Failed to load store details. Redirecting to home.");
          navigate("/");
          return;
        }

        if (!storeData || storeData.latitude === null || storeData.longitude === null) {
          console.error("Fetched store data is incomplete or invalid: Missing latitude or longitude.", storeData);
          toast.error("Store location data is missing. Redirecting to home.");
          navigate("/");
          return;
        }

        setStore(storeData);
        addViewedStore(storeId);

        let productToSelect: Product | null = null;

        const { data: allProductsData, error: allProductsError } = await supabase
          .from("products")
          .select(`id, name, price, stock_quantity, image_url, currency, currency_symbol, barcode`)
          .eq("store_id", storeId)
          .eq("is_active", true);

        if (allProductsError) throw allProductsError;
        setAllStoreProducts(allProductsData || []);

        if (productId) {
          productToSelect = allProductsData?.find(p => p.id === productId) || null;
        }
        setSelectedProduct(productToSelect);
      } catch (error) {
        console.error("Error fetching initial details:", error);
        toast.error("Failed to load store and product details. Redirecting to home.");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialDetails();
  }, [storeId, productId, navigate]);

  const fetchDirections = useCallback(async (
    userLoc: UserLocation,
    storeLoc: StoreInfo,
    paddingBottom: number,
    isMobile: boolean
  ) => {
    const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLoc.lng},${userLoc.lat};${storeLoc.longitude},${storeLoc.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
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
            const mapPadding = { top: 50, bottom: 50, left: 50, right: 50 };
            if (isMobile) {
              mapPadding.bottom = paddingBottom + 50;
            }
            mapRef.current.fitBounds(bounds, {
              padding: mapPadding,
              duration: 1000
            });
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
  }, [MAPBOX_TOKEN, mapRef]);

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
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading store and product details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <StoreDetailLayout
        store={store}
        selectedProduct={selectedProduct}
        allStoreProducts={allStoreProducts}
        productSearchQuery={productSearchQuery}
        setProductSearchQuery={setProductSearchQuery}
        userLocation={userLocation}
        routeGeoJson={routeGeoJson}
        handleWalkToStore={handleWalkToStore}
        handleToggleFavorite={handleToggleFavorite}
        mapStyle={mapStyle}
        mapRef={mapRef}
        fetchDirections={fetchDirections}
      />
    </div>
  );
};

export default StoreDetailsPage;