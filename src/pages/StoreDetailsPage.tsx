import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Footprints } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const containerStyle = {
  width: "100%",
  height: "300px",
};

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
  const navigate = useNavigate();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      });
    }

    const fetchStoreDetails = async () => {
      if (!storeId) {
        toast.error("Store ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const storePromise = supabase.from("stores").select(`id, store_name, address, latitude, longitude`).eq("id", storeId).single();
        const productsPromise = supabase.from("products").select(`id, name, price, stock_quantity, image_url`).eq("store_id", storeId).eq("is_active", true);
        
        const [{ data: storeData, error: storeError }, { data: productsData, error: productsError }] = await Promise.all([storePromise, productsPromise]);

        if (storeError) throw storeError;
        if (productsError) throw productsError;

        setStore(storeData);
        setProducts(productsData || []);
      } catch (error) {
        console.error("Error fetching store details:", error);
        toast.error("Failed to load store details.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetails();
  }, [storeId]);

  const handleWalkToStore = () => {
    if (!store) {
      toast.error("Store location is not available.");
      return;
    }
    if (!userLocation) {
      toast.warning("Your location is not available to calculate a route.");
      return;
    }
    navigate(`/route?lat=${store.latitude}&lng=${store.longitude}`);
  };

  if (loading || !isLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (loadError) return <div>Error loading map.</div>;
  if (!store) return <div className="text-center p-8">Could not load store details.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{store.store_name}</h1>
          <p className="text-lg text-gray-600">{store.address}</p>
        </div>

        <GoogleMap mapContainerStyle={containerStyle} center={{ lat: store.latitude, lng: store.longitude }} zoom={14}>
          {userLocation && <Marker position={userLocation} icon={{ path: google.maps.SymbolPath.CIRCLE, fillColor: "#4285F4", fillOpacity: 1, strokeColor: "#FFFFFF", strokeWeight: 2, scale: 8 }} title="You are here" />}
          <Marker position={{ lat: store.latitude, lng: store.longitude }} title={store.store_name} />
        </GoogleMap>

        <div className="text-center">
            <Button size="lg" variant="outline" onClick={handleWalkToStore} disabled={!userLocation}>
                <Footprints className="mr-2 h-4 w-4" />
                Walk to Store
            </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Products at {store.store_name}</CardTitle></CardHeader>
          <CardContent>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/store/${storeId}/product/${product.id}`)}>
                    <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-40 object-cover rounded-md mb-4" />
                    <h3 className="font-semibold text-lg flex-grow">{product.name}</h3>
                    <p className="text-md font-bold text-green-600">${product.price.toFixed(2)}</p>
                    <p className={`text-sm ${product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                      {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p>No products found for this store.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreDetailsPage;