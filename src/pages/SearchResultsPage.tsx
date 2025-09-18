import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { GoogleMap, useLoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { GOOGLE_MAPS_API_KEY } from "@/config";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase"; // Import Supabase client

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 6.5244, // Lagos, Nigeria latitude
  lng: 3.3792, // Lagos, Nigeria longitude
};

// Updated Store interface to match Supabase schema
interface Store {
  id: string;
  store_name: string; // Matches 'store_name' column in Supabase
  address: string;
  latitude: number; // Matches 'latitude' column in Supabase
  longitude: number; // Matches 'longitude' column in Supabase
}

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const initialSearchQuery = searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentCenter, setCurrentCenter] = useState(defaultCenter);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]); // Initialize with empty array, no mock data
  const mapRef = useRef<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentCenter(userLocation);
          toast.success("Map centered on your current location!");
        },
        (error) => {
          console.error("Error getting user location:", error);
          toast.warning("Could not get your location. Showing default center (Lagos).");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      toast.warning("Geolocation is not supported by your browser. Showing default center (Lagos).");
    }
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        if (searchQuery) {
          // If there's a search query, filter by products and then get associated stores
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select(`
              store_id,
              stores (
                id,
                store_name,
                address,
                latitude,
                longitude
              )
            `)
            .ilike('name', `%${searchQuery}%`)
            .eq('is_active', true);

          if (productError) {
            console.error("Error fetching products for search:", productError);
            toast.error("Failed to fetch products. Please try again.");
            setStores([]);
            return;
          }

          const uniqueStoreIds = new Set<string>();
          const fetchedStores: Store[] = [];

          productData.forEach((item: any) => {
            if (item.stores && item.stores.latitude !== null && item.stores.longitude !== null && !uniqueStoreIds.has(item.stores.id)) {
              uniqueStoreIds.add(item.stores.id);
              fetchedStores.push({
                id: item.stores.id,
                store_name: item.stores.store_name,
                address: item.stores.address,
                latitude: item.stores.latitude,
                longitude: item.stores.longitude,
              });
            }
          });
          setStores(fetchedStores);
          if (fetchedStores.length > 0) {
            toast.success(`Found ${fetchedStores.length} stores for "${searchQuery}"`);
          } else {
            toast.info(`No stores found for "${searchQuery}".`);
          }

        } else {
          // If no search query, fetch all active stores
          const { data, error } = await supabase
            .from('stores')
            .select('id, store_name, address, latitude, longitude')
            .eq('is_active', true) // Only fetch active stores
            .not('latitude', 'is', null) // Ensure latitude is not null
            .not('longitude', 'is', null); // Ensure longitude is not null

          if (error) {
            console.error("Error fetching stores from Supabase:", error);
            toast.error("Failed to fetch stores. Please try again.");
            setStores([]);
            return;
          }

          const fetchedStores: Store[] = data.map((store: any) => ({
            id: store.id,
            store_name: store.store_name,
            address: store.address,
            latitude: store.latitude,
            longitude: store.longitude,
          }));

          setStores(fetchedStores);
          if (fetchedStores.length > 0) {
            toast.success(`Found ${fetchedStores.length} active stores.`);
          } else {
            toast.info("No active stores found.");
          }
        }
      } catch (error) {
        console.error("Unexpected error fetching stores:", error);
        toast.error("An unexpected error occurred.");
        setStores([]);
      }
    };

    fetchStores();
  }, [searchQuery]); // Re-fetch when searchQuery changes

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMarkerClick = (store: Store) => {
    setSelectedStore(store);
    setCurrentCenter({ lat: store.latitude, lng: store.longitude });
    if (mapRef.current) {
      mapRef.current.panTo({ lat: store.latitude, lng: store.longitude });
    }
  };

  const handleStoreListItemClick = (store: Store) => {
    handleMarkerClick(store);
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Search Results for "{initialSearchQuery}"</h1>
        <div className="flex w-full items-center space-x-2 mx-auto">
          <Input
            type="text"
            placeholder="Refine your search..."
            className="flex-grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button type="submit" onClick={() => { /* Search is triggered by onChange, no explicit click needed */ }}>
            <Search className="h-4 w-4 mr-2" /> Search
          </Button>
        </div>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Google Map Section */}
        <div className="md:col-span-1">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={currentCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {stores.map((store) => (
              <Marker
                key={store.id}
                position={{ lat: store.latitude, lng: store.longitude }}
                onClick={() => handleMarkerClick(store)}
              />
            ))}

            {selectedStore && (
              <InfoWindow
                position={{ lat: selectedStore.latitude, lng: selectedStore.longitude }}
                onCloseClick={() => setSelectedStore(null)}
              >
                <div className="p-2">
                  <h3 className="font-bold text-lg">{selectedStore.store_name}</h3>
                  <p className="text-sm">{selectedStore.address}</p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>

        {/* Scrollable List of Stores */}
        <div className="md:col-span-1">
          <Card className="h-[400px] flex flex-col">
            <CardHeader>
              <CardTitle>Nearby Stores</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow p-0">
              <ScrollArea className="h-full w-full">
                <div className="p-4 space-y-3">
                  {stores.length > 0 ? (
                    stores.map((store) => (
                      <div
                        key={store.id}
                        className="p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => handleStoreListItemClick(store)}
                      >
                        <h4 className="font-semibold">{store.store_name}</h4>
                        <p className="text-sm text-gray-600">{store.address}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 mt-8">No stores found nearby.</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;