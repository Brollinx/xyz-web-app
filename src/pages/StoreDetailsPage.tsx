import React, { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import mapboxgl, { LinePaint } from "mapbox-gl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input component
import { Loader2, Footprints, Search } from "lucide-react"; // Import Search icon
import { MAPBOX_TOKEN } from "@/config";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import type { Feature, GeoJsonProperties, Geometry } from "geojson";
import StoreIcon from "@/assets/store.svg";
import { addViewedStore } from "@/utils/viewedItems";

const containerStyle = {
  width: "100%",
  minHeight: "360px",
  height: "60vh",
};

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

interface UserLocation {
  lat: number;
  lng: number;
}

const getBounds = (geometry: Geometry) => {
  if (geometry.type !== 'LineString') {
    return null;
  }
  const coordinates = geometry.coordinates as [number, number][];
  if (coordinates.length === 0) {
    return null;
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const coord of coordinates) {
    minLng = Math.min(minLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLng = Math.max(maxLng, coord[0]);
    maxLat = Math.max(maxLat, coord[1]);
  }

  return [[minLng, minLat], [maxLng, maxLat]] as [[number, number], [number, number]];
};

const StoreDetailsPage = () => {
  const { storeId } = useParams<{ storeId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const productId = searchParams.get("product");

  const [store, setStore] = useState<StoreInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [allStoreProducts, setAllStoreProducts] = useState<Product[]>([]); // Store all products
  const [productSearchQuery, setProductSearchQuery] = useState(""); // New state for product search
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [routeGeoJson, setRouteGeoJson] = useState<Feature<Geometry, GeoJsonProperties> | null>(null);
  
  const [loading, setLoading] = useState(true);

  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      console.log("Geolocation is available.");
      navigator.geolocation.getCurrentPosition((position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        console.log("User location obtained:", position.coords.latitude, position.coords.longitude);
      }, (error) => {
        console.error("Error getting user location:", error);
        toast.warning("Could not get your location. Route will not be shown.");
      });
    } else {
      console.warn("Geolocation is not supported by your browser.");
      toast.warning("Geolocation is not supported by your browser. Route will not be shown.");
    }

    const fetchInitialDetails = async () => {
      if (!storeId) {
        toast.error("Store ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select(`id, store_name, address, latitude, longitude`)
          .eq("id", storeId)
          .single();

        if (storeError) throw storeError;
        setStore(storeData);
        addViewedStore(storeId);

        let productToSelect: Product | null = null;

        // Fetch all active products for the store
        const { data: allProductsData, error: allProductsError } = await supabase
          .from("products")
          .select(`id, name, price, stock_quantity, image_url, currency, currency_symbol`)
          .eq("store_id", storeId)
          .eq("is_active", true);

        if (allProductsError) throw allProductsError;
        setAllStoreProducts(allProductsData || []); // Store all products

        if (productId) {
          // If a specific product ID is provided, find it in the fetched data
          productToSelect = allProductsData?.find(p => p.id === productId) || null;
          if (!productToSelect) {
            console.warn("Specific product not found in store's active products.");
          }
        }

        if (!productToSelect && allProductsData && allProductsData.length > 0) {
          // If no specific product was found or provided, select the first active product
          productToSelect = allProductsData[0];
        }
        
        setSelectedProduct(productToSelect);

      } catch (error) {
        console.error("Error fetching initial details:", error);
        toast.error("Failed to load store and product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialDetails();
  }, [storeId, productId]);

  // Effect to fetch and render directions
  useEffect(() => {
    if (!userLocation || !store) return;

    const fetchDirections = async () => {
      const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLocation.lng},${userLocation.lat};${store.longitude},${store.latitude}?geometries=geojson&access_token=${MAPBOX_TOKEN}`;
      
      console.log("Directions API Request URL (token redacted):", url.replace(`access_token=${MAPBOX_TOKEN}`, "access_token=REDACTED"));

      try {
        const response = await fetch(url);
        const data = await response.json();

        console.log("Directions API Response:", data);

        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const newRouteGeoJson: Feature<Geometry, GeoJsonProperties> = {
            type: "Feature",
            properties: {},
            geometry: route.geometry,
          };
          setRouteGeoJson(newRouteGeoJson);

          // Fit map to route bounds
          if (mapRef.current && newRouteGeoJson.geometry) {
            const bounds = getBounds(newRouteGeoJson.geometry);
            if (bounds) {
              mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
            }
          }
        } else {
          toast.error("Could not find a walking route to the store.");
          setRouteGeoJson(null); // Clear any previous route
        }
      } catch (error) {
        console.error("Error fetching directions:", error);
        toast.error("Failed to fetch walking directions to the store.");
        setRouteGeoJson(null); // Clear any previous route
      }
    };

    fetchDirections();
  }, [userLocation, store]);

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

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const productsToFilter = allStoreProducts.filter(p => p.id !== selectedProduct?.id);
    if (!productSearchQuery) {
      return productsToFilter;
    }
    const lowerCaseQuery = productSearchQuery.toLowerCase();
    return productsToFilter.filter(product =>
      product.name.toLowerCase().includes(lowerCaseQuery)
    );
  }, [allStoreProducts, selectedProduct, productSearchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading store and product details...</p>
      </div>
    );
  }

  if (!store) return <div className="text-center p-8">Could not load store details.</div>;

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
            <Marker longitude={store.longitude} latitude={store.latitude}>
              <img src={StoreIcon} alt="Store" className="h-8 w-8 text-red-600" />
            </Marker>
            {routeGeoJson && (
              <Source id="route" type="geojson" data={routeGeoJson}>
                <Layer
                  id="route-layer"
                  type="line"
                  paint={{
                    "line-color": "#007cbf",
                    "line-width": 4,
                    "line-join": "round",
                    "line-cap": "round",
                  } as LinePaint}
                />
              </Source>
            )}
          </Map>
        </div>

        {selectedProduct && (
          <Card>
            <CardHeader><CardTitle>Selected Product</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <img src={selectedProduct.image_url || "/placeholder.svg"} alt={selectedProduct.name} className="w-full md:w-1/3 h-64 object-cover rounded-lg" />
                <div className="flex-grow">
                  <h2 className="text-3xl font-bold">{selectedProduct.name}</h2>
                  <p className="text-2xl font-bold text-green-600 my-2">
                    {selectedProduct.currency_symbol}{selectedProduct.price.toFixed(2)}
                  </p>
                  <p className={`text-lg font-semibold ${selectedProduct.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                    {selectedProduct.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-center items-center gap-4">
            <Button size="lg" variant="outline" onClick={handleWalkToStore} disabled={!userLocation}>
                <Footprints className="mr-2 h-4 w-4" />
                Walk to Store
            </Button>
        </div>

        {allStoreProducts.length > 1 && ( // Only show "Other Products" if there are more than just the selected one
          <Card>
            <CardHeader>
              <CardTitle>Other Products at {store.store_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Input
                  type="text"
                  placeholder="Search products in this store..."
                  className="flex-grow"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                />
                <Button type="button" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div key={product.id} className="border rounded-lg p-4 flex flex-col">
                      <img src={product.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-40 object-cover rounded-md mb-4" />
                      <h3 className="font-semibold text-lg flex-grow">{product.name}</h3>
                      <p className="text-md font-bold text-green-600">
                        {product.currency_symbol}{product.price.toFixed(2)}
                      </p>
                      <p className={`text-sm ${product.stock_quantity > 0 ? "text-green-500" : "text-red-500"}`}>
                        {product.stock_quantity > 0 ? "In Stock" : "Out of Stock"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 col-span-full">No products found matching your search.</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StoreDetailsPage;