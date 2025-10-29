import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl, { LinePaint } from "mapbox-gl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Loader2, Footprints, Car } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg";
import { useGeolocation } from "@/hooks/useGeolocation";

type TravelMode = "walking" | "driving";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  currency: string;
  currency_symbol?: string;
}

interface StoreInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const getBounds = (geometry: Geometry) => {
  if (geometry.type !== 'LineString') return null;
  const coordinates = geometry.coordinates as [number, number][];
  return coordinates.reduce((bounds, coord) => {
    return bounds.extend(coord);
  }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
};

const StoreDetailsPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get("product");

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("walking");

  const { location: userLocation } = useGeolocation();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const routeBoundsSet = useRef(false);

  useEffect(() => {
    const fetchInitialDetails = async () => {
      if (!storeId || !productId) {
        toast.error("Store or Product ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: storeData, error: storeError } = await supabase.from("stores").select(`id, store_name, address, latitude, longitude`).eq("id", storeId).single();
        if (storeError) throw storeError;
        setStore(storeData);

        const { data: productData, error: productError } = await supabase.from("products").select(`id, name, price, stock_quantity, image_url, currency, currency_symbol`).eq("id", productId).single();
        if (productError) throw productError;
        setSelectedProduct(productData);

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
      const url = `https://api.mapbox.com/directions/v5/mapbox/${travelMode}/${userLocation.lng},${userLocation.lat};${store.longitude},${store.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
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

          if (mapRef.current && newRouteGeoJson.geometry && !routeBoundsSet.current) {
            const bounds = getBounds(newRouteGeoJson.geometry);
            if (bounds) {
              mapRef.current.fitBounds(bounds, { padding: 60, duration: 1500 });
              routeBoundsSet.current = true;
            }
          }
        } else {
          setRouteGeoJson(null);
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        toast.error(`Failed to fetch ${travelMode} directions.`);
        setRouteGeoJson(null);
      }
    };

    fetchDirections();
  }, [userLocation, store, travelMode]);

  const handleTravelModeChange = (value: TravelMode) => {
    if (value) {
      setTravelMode(value);
      routeBoundsSet.current = false; // Allow refitting for the new route
    }
  };

  const handleWalkToStore = () => {
    if (!store) return toast.error("Store location is not available.");
    if (!userLocation) return toast.warning("Your location is not available to calculate a route.");
    navigate(`/route?lat=${store.latitude}&lng=${store.longitude}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (!store || !selectedProduct) return <div className="p-8 text-center">Could not load store or product details.</div>;

  return (
    <div className="flex h-screen flex-col">
      <div className="relative h-1/2 flex-shrink-0">
        <Map
          initialViewState={{
            longitude: store.longitude,
            latitude: store.latitude,
            zoom: 14
          }}
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={MAPBOX_TOKEN}
          ref={(instance) => {
            if (instance) mapRef.current = instance.getMap();
          }}
        >
          {userLocation && <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />}
          <Marker longitude={store.longitude} latitude={store.latitude}>
            <img src={StoreIcon} alt="Store" className="h-8 w-8" />
          </Marker>
          {routeGeoJson && (
            <Source id="route" type="geojson" data={routeGeoJson}>
              <Layer
                id="route-layer"
                type="line"
                paint={{
                  "line-color": travelMode === 'walking' ? "#007cbf" : "#f44336",
                  "line-width": 5,
                  "line-opacity": 0.8
                } as LinePaint}
              />
            </Source>
          )}
        </Map>
        <div className="absolute top-4 right-4">
          <ToggleGroup type="single" value={travelMode} onValueChange={handleTravelModeChange} className="bg-white rounded-md shadow-lg">
            <ToggleGroupItem value="walking" aria-label="Toggle walking">
              <Footprints className="h-5 w-5" />
            </ToggleGroupItem>
            <ToggleGroupItem value="driving" aria-label="Toggle driving">
              <Car className="h-5 w-5" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="flex-grow overflow-y-auto bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          <div className="text-center">
            <h1 className="text-3xl font-bold">{store.store_name}</h1>
            <p className="text-md text-gray-600">{store.address}</p>
          </div>
          <Card>
            <CardHeader><CardTitle>Selected Product</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <img src={selectedProduct.image_url || "/placeholder.svg"} alt={selectedProduct.name} className="h-40 w-40 flex-shrink-0 rounded-lg object-cover" />
                <div className="flex-grow text-center sm:text-left">
                  <h2 className="text-2xl font-bold">{selectedProduct.name}</h2>
                  <p className="my-2 text-2xl font-bold text-green-600">
                    {selectedProduct.currency_symbol}{selectedProduct.price.toFixed(2)}
                  </p>
                  <p className={`font-semibold ${selectedProduct.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                    {selectedProduct.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Button size="lg" className="w-full" onClick={handleWalkToStore} disabled={!userLocation}>
            <Footprints className="mr-2 h-5 w-5" />
            Start Fullscreen Navigation
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StoreDetailsPage;