import React, { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl from "mapbox-gl"; // Import mapboxgl
import MapboxDirections from "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions"; // Import MapboxDirections
import "@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions.css"; // Import directions CSS
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Footprints } from "lucide-react";
import { MAPBOX_TOKEN } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import DevDebugOverlay from "@/components/DevDebugOverlay"; // Import the new debug overlay

// Set Mapbox access token globally for the Directions plugin
mapboxgl.accessToken = MAPBOX_TOKEN;

const containerStyle = {
  width: "100%",
  minHeight: "360px", // Ensure map is visible
  height: "60vh", // Ensure map is visible
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
  const [directionsPluginActive, setDirectionsPluginActive] = useState(false);

  const mapRef = useRef<mapboxgl.Map | null>(null);
  const directionsRef = useRef<MapboxDirections | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      console.log("Geolocation is available.");
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        console.log("User location obtained:", position.coords.latitude, position.coords.longitude);
      });
    } else {
      console.warn("Geolocation is not supported by your browser.");
    }

    const fetchInitialDetails = async () => {
      if (!storeId || !productId) {
        toast.error("Store or Product ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const storePromise = supabase.from("stores").select(`id, store_name, address, latitude, longitude`).eq("id", storeId).single();
        const productPromise = supabase.from("products").select(`id, name, price, stock_quantity, image_url`).eq("id", productId).single();
        
        const [{ data: storeData, error: storeError }, { data: productData, error: productError }] = await Promise.all([storePromise, productPromise]);

        if (storeError) throw storeError;
        if (productError) throw productError;

        setStore(storeData);
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

  // Effect for Mapbox Directions plugin
  useEffect(() => {
    if (mapRef.current && userLocation && store) {
      let directionsInstance = directionsRef.current;

      if (!directionsInstance) {
        console.log("Mapbox Directions: Initializing plugin.");
        directionsInstance = new MapboxDirections({
          accessToken: MAPBOX_TOKEN,
          unit: "metric",
          profile: "mapbox/walking",
          alternatives: false,
          geometries: "geojson",
          controls: { inputs: false, instructions: false }, // Hide input fields and instruction panel
          flyTo: false, // Prevent map from flying to route
        });

        mapRef.current.addControl(directionsInstance, "top-left");
        directionsRef.current = directionsInstance;
        setDirectionsPluginActive(true);

        // Add the route event listener only once when the plugin is initialized
        directionsInstance.on('route', (event) => {
          if (event.route && event.route[0] && mapRef.current) {
            const bounds = directionsInstance?.getBounds();
            if (bounds) {
              mapRef.current.fitBounds(bounds, { padding: 50 });
            }
          }
        });
      } else {
        console.log("Mapbox Directions: Clearing existing routes and setting new origin/destination.");
        directionsInstance.removeRoutes(); // Clear existing routes
      }

      console.log("Mapbox Directions: Setting origin and destination.");
      directionsInstance.setOrigin([userLocation.lng, userLocation.lat]);
      directionsInstance.setDestination([store.longitude, store.latitude]);
    }

    return () => {
      if (mapRef.current && directionsRef.current) {
        console.log("Mapbox Directions: Removing plugin control.");
        // The 'route' event listener is implicitly cleaned up when the directions instance is removed.
        mapRef.current.removeControl(directionsRef.current);
        directionsRef.current = null;
        setDirectionsPluginActive(false);
      }
    };
  }, [mapRef.current, userLocation, store]);


  const handleFetchMoreProducts = async () => {
    if (!storeId || !productId) return;
    setLoadingMore(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select(`id, name, price, stock_quantity, image_url`)
        .eq("store_id", storeId)
        .eq("is_active", true)
        .neq("id", productId);

      if (error) throw error;
      
      setOtherProducts(data || []);
      setShowMoreButton(false);
    } catch (error) {
      console.error("Error fetching more products:", error);
      toast.error("Failed to load more products.");
    } finally {
      setLoadingMore(false);
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading store and product details...</p>
        {import.meta.env.DEV && (
          <DevDebugOverlay
            mapboxTokenPresent={!!MAPBOX_TOKEN}
            geolocationAvailable={!!navigator.geolocation}
            mapInstanceExists={!!mapRef.current}
            origin={userLocation}
            destination={store ? { lat: store.latitude, lng: store.longitude } : null}
          />
        )}
      </div>
    );
  }

  if (!store || !selectedProduct) return <div className="text-center p-8">Could not load store or product details.</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">{store.store_name}</h1>
          <p className="text-lg text-gray-600">{store.address}</p>
        </div>

        <div style={containerStyle}>
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
              if (instance) {
                mapRef.current = instance.getMap();
              }
            }}
          >
            {userLocation && <Marker longitude={userLocation.lng} latitude={userLocation.lat} color="#4285F4" />}
            <Marker longitude={store.longitude} latitude={store.latitude} />
            {/* The MapboxDirections plugin will draw the route line, so we remove the custom Source/Layer */}
          </Map>
        </div>

        <Card>
          <CardHeader><CardTitle>Selected Product</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center gap-6">
              <img src={selectedProduct.image_url || "/placeholder.svg"} alt={selectedProduct.name} className="w-full md:w-1/3 h-64 object-cover rounded-lg" />
              <div className="flex-grow">
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
            {showMoreButton && (
            <Button size="lg" onClick={handleFetchMoreProducts} disabled={loadingMore}>
                {loadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                More products in this store
            </Button>
            )}
            <Button size="lg" variant="outline" onClick={handleWalkToStore} disabled={!userLocation}>
                <Footprints className="mr-2 h-4 w-4" />
                Walk to Store
            </Button>
        </div>

        {otherProducts.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Other Products at {store.store_name}</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {otherProducts.map((product) => (
                  <div key={product.id} className="border rounded-lg p-4 flex flex-col">
                    <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-40 object-cover rounded-md mb-4" />
                    <h3 className="font-semibold text-lg flex-grow">{product.name}</h3>
                    <p className="text-md font-bold text-green-600">${product.price.toFixed(2)}</p>
                    <p className={`text-sm ${product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                      {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      {import.meta.env.DEV && (
        <DevDebugOverlay
          mapboxTokenPresent={!!MAPBOX_TOKEN}
          geolocationAvailable={!!navigator.geolocation}
          mapInstanceExists={!!mapRef.current}
          directionsPluginActive={directionsPluginActive}
          origin={userLocation}
          destination={store ? { lat: store.latitude, lng: store.longitude } : null}
        />
      )}
    </div>
  );
};

export default StoreDetailsPage;