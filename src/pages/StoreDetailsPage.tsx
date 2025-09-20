import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Footprints } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Feature, LineString } from 'geojson';

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

interface StoreInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
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
  const [otherProducts, setOtherProducts] = useState<Product[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showMoreButton, setShowMoreButton] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      });
    }

    const fetchInitialDetails = async () => {
      if (!storeId || !productId) return;
      setLoading(true);
      const { data: storeData, error: storeError } = await supabase.from("stores").select(`id, store_name, address, latitude, longitude`).eq("id", storeId).single();
      const { data: productData, error: productError } = await supabase.from("products").select(`id, name, price, stock_quantity, image_url`).eq("id", productId).single();
      
      if (storeError || productError) {
        toast.error("Failed to load store or product details.");
      } else {
        setStore(storeData);
        setSelectedProduct(productData);
      }
      setLoading(false);
    };

    fetchInitialDetails();
  }, [storeId, productId]);

  const handleFetchMoreProducts = async () => {
    if (!storeId || !productId) return;
    setLoadingMore(true);
    const { data, error } = await supabase.from("products").select(`id, name, price, stock_quantity, image_url`).eq("store_id", storeId).eq("is_active", true).neq("id", productId);
    if (error) toast.error("Failed to load more products.");
    else {
      setOtherProducts(data || []);
      setShowMoreButton(false);
    }
    setLoadingMore(false);
  };

  const handleWalkToStore = () => {
    if (!store) return;
    if (!userLocation) {
      toast.warning("Your location is not available to calculate a route.");
      return;
    }
    navigate(`/route?lat=${store.latitude}&lng=${store.longitude}`);
  };

  const lineGeoJson: Feature<LineString> | null = userLocation && store ? {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: [[userLocation.lng, userLocation.lat], [store.longitude, store.latitude]]
    },
    properties: {}
  } : null;

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  if (!store || !selectedProduct) return <div className="text-center p-8">Could not load store or product details.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{store.store_name}</h1>
          <p className="text-lg text-gray-600">{store.address}</p>
        </div>

        <div className="h-[300px] w-full">
          <Map
            initialViewState={{ latitude: store.latitude, longitude: store.longitude, zoom: 14 }}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/streets-v11"
            mapboxAccessToken={MAPBOX_TOKEN}
          >
            {userLocation && <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />}
            <Marker longitude={store.longitude} latitude={store.latitude} />
            {lineGeoJson && (
              <Source id="route-line" type="geojson" data={lineGeoJson}>
                <Layer id="line-layer" type="line" paint={{ 'line-color': '#4A90E2', 'line-width': 3 }} />
              </Source>
            )}
          </Map>
        </div>

        <Card>
          <CardHeader><CardTitle>Selected Product</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img src={selectedProduct.image_url || "/placeholder.svg"} alt={selectedProduct.name} className="w-full md:w-1/3 h-64 object-cover rounded-lg" />
              <div>
                <h2 className="text-3xl font-bold">{selectedProduct.name}</h2>
                <p className="text-2xl font-bold text-green-600 my-2">${selectedProduct.price.toFixed(2)}</p>
                <p className={`text-lg font-semibold ${selectedProduct.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                  {selectedProduct.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center items-center gap-4">
          {showMoreButton && <Button size="lg" onClick={handleFetchMoreProducts} disabled={loadingMore}>{loadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} More products</Button>}
          <Button size="lg" variant="outline" onClick={handleWalkToStore} disabled={!userLocation}><Footprints className="mr-2 h-4 w-4" /> Walk to Store</Button>
        </div>

        {otherProducts.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Other Products at {store.store_name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 flex flex-col">
                    <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-40 object-cover rounded-md mb-4" />
                    <h3 className="font-semibold flex-grow">{product.name}</h3>
                    <p className="text-md font-bold text-green-600">${product.price.toFixed(2)}</p>
                    <p className={`text-sm ${product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>{product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoreDetailsPage;