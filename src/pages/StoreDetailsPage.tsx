import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import { GoogleMap, useLoadScript, Marker } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const containerStyle = {
  width: "100%",
  height: "400px",
};

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
}

interface Store {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
  products: Product[];
}

interface UserLocation {
  lat: number;
  lng: number;
}

const StoreDetailsPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          toast.warning("Could not get your location. Map will only show the store.");
        }
      );
    }

    // Fetch store and product data
    const fetchStoreDetails = async () => {
      if (!storeId) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("stores")
          .select(
            `
            id, store_name, address, latitude, longitude,
            products (id, name, price, stock_quantity, image_url, is_active)
          `
          )
          .eq("id", storeId)
          .single();

        if (error) throw error;

        // Filter for active products
        const activeProducts = data.products.filter((p: any) => p.is_active);
        setStore({ ...data, products: activeProducts });

      } catch (error) {
        console.error("Error fetching store details:", error);
        toast.error("Failed to load store details.");
      } finally {
        setLoading(false);
      }
    };

    fetchStoreDetails();
  }, [storeId]);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
      </div>
    );
  }

  if (loadError) return <div>Error loading map.</div>;
  if (!store) return <div className="text-center p-8">Store not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
            <h1 className="text-4xl font-bold">{store.store_name}</h1>
            <p className="text-lg text-gray-600">{store.address}</p>
        </div>

        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{ lat: store.latitude, lng: store.longitude }}
          zoom={14}
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
          <Marker position={{ lat: store.latitude, lng: store.longitude }} title={store.store_name} />
        </GoogleMap>

        <Card>
          <CardHeader>
            <CardTitle>Products Available at {store.store_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {store.products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4 flex flex-col">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-40 object-cover rounded-md mb-4"
                  />
                  <h3 className="font-semibold text-lg flex-grow">{product.name}</h3>
                  <p className="text-md font-bold text-green-600">${product.price.toFixed(2)}</p>
                  <p className={`text-sm ${product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                    {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
                <Button size="lg">More products in this store</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StoreDetailsPage;