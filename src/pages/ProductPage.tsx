import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GoogleMap, useLoadScript, DirectionsService, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Footprints, List } from "lucide-react";
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

const ProductPage = () => {
  const { storeId, productId } = useParams<{ storeId: string; productId: string }>();
  const navigate = useNavigate();

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [directionsResponse, setDirectionsResponse] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    if (!storeId || !productId) {
      toast.error("Store or Product ID is missing from the URL.");
      setLoading(false);
      return;
    }

    // Fetch user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude }),
        () => toast.warning("Could not get your location. Directions may not be accurate.")
      );
    }

    // Fetch product and store data
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            id, name, price, stock_quantity, image_url,
            stores (id, store_name, address, latitude, longitude)
          `)
          .eq("id", productId)
          .eq("store_id", storeId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Product or store not found.");

        const { stores, ...productData } = data;
        setProduct(productData as Product);
        setStore(stores as StoreInfo);

      } catch (error) {
        console.error("Error fetching product details:", error);
        toast.error("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [storeId, productId]);

  const directionsCallback = useCallback((response: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
    if (status === "OK" && response) {
      setDirectionsResponse(response);
    } else {
      console.error(`Error fetching directions: ${status}`);
      toast.error("Could not calculate walking directions to the store.");
    }
  }, []);

  if (loading || !isLoaded) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  if (loadError) return <div className="text-center p-8">Error loading map. Please check your API key.</div>;
  if (!product || !store) return <div className="text-center p-8">Could not find the requested product or store.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{store.store_name}</h1>
          <p className="text-lg text-gray-600">{store.address}</p>
        </div>

        <GoogleMap mapContainerStyle={containerStyle} center={{ lat: store.latitude, lng: store.longitude }} zoom={14}>
          {userLocation && directionsResponse === null && (
            <DirectionsService
              options={{
                destination: { lat: store.latitude, lng: store.longitude },
                origin: userLocation,
                travelMode: google.maps.TravelMode.WALKING,
              }}
              callback={directionsCallback}
            />
          )}
          {directionsResponse ? (
            <DirectionsRenderer options={{ directions: directionsResponse }} />
          ) : (
            <>
              {userLocation && <Marker position={userLocation} title="Your Location" />}
              <Marker position={{ lat: store.latitude, lng: store.longitude }} title={store.store_name} />
            </>
          )}
        </GoogleMap>

        <Card>
          <CardHeader><CardTitle>Product Details</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full md:w-1/3 h-64 object-cover rounded-lg" />
              <div className="flex-grow">
                <h2 className="text-3xl font-bold">{product.name}</h2>
                <p className="text-2xl font-bold text-green-600 my-2">${product.price.toFixed(2)}</p>
                <p className={`text-lg font-semibold ${product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                  {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center items-center gap-4">
          <Button size="lg" onClick={() => navigate(`/store/${storeId}`)}>
            <List className="mr-2 h-4 w-4" />
            More products in this store
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate(`/route?lat=${store.latitude}&lng=${store.longitude}`)} disabled={!userLocation}>
            <Footprints className="mr-2 h-4 w-4" />
            Walk to Store
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;