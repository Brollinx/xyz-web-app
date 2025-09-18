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

const containerStyle = {
  width: "100%",
  height: "400px",
};

const defaultCenter = {
  lat: 6.5244, // Lagos, Nigeria latitude
  lng: 3.3792, // Lagos, Nigeria longitude
};

interface Store {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
}

const mockStores: Store[] = [
  { id: "1", name: "XYZ Pharmacy", address: "123 Main St, Lagos", lat: 6.5244 + 0.01, lng: 3.3792 + 0.01 },
  { id: "2", name: "XYZ Mart", address: "456 Market Rd, Lagos", lat: 6.5244 - 0.01, lng: 3.3792 + 0.02 },
  { id: "3", name: "Local Shop", address: "789 Side Ave, Lagos", lat: 6.5244 + 0.02, lng: 3.3792 - 0.01 },
  { id: "4", name: "Tech Gadgets", address: "101 Innovation Hub, Lagos", lat: 6.5244 + 0.03, lng: 3.3792 + 0.03 },
  { id: "5", name: "Fashion Boutique", address: "202 Style Blvd, Lagos", lat: 6.5244 - 0.02, lng: 3.3792 - 0.02 },
  { id: "6", name: "Book Nook", address: "303 Reading Ln, Lagos", lat: 6.5244 + 0.015, lng: 3.3792 - 0.015 },
  { id: "7", name: "Coffee Corner", address: "404 Brew St, Lagos", lat: 6.5244 - 0.005, lng: 3.3792 + 0.005 },
  { id: "8", name: "Fresh Produce", address: "505 Farm Rd, Lagos", lat: 6.5244 + 0.025, lng: 3.3792 + 0.015 },
];

const SearchResultsPage = () => {
  const [searchParams] = useSearchParams();
  const initialSearchQuery = searchParams.get("query") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [currentCenter, setCurrentCenter] = useState(defaultCenter);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
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

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  const handleMarkerClick = (store: Store) => {
    setSelectedStore(store);
    setCurrentCenter({ lat: store.lat, lng: store.lng });
    if (mapRef.current) {
      mapRef.current.panTo({ lat: store.lat, lng: store.lng });
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
          <Button type="submit">
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
            {mockStores.map((store) => (
              <Marker
                key={store.id}
                position={{ lat: store.lat, lng: store.lng }}
                onClick={() => handleMarkerClick(store)}
              />
            ))}

            {selectedStore && (
              <InfoWindow
                position={{ lat: selectedStore.lat, lng: selectedStore.lng }}
                onCloseClick={() => setSelectedStore(null)}
              >
                <div className="p-2">
                  <h3 className="font-bold text-lg">{selectedStore.name}</h3>
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
                  {mockStores.map((store) => (
                    <div
                      key={store.id}
                      className="p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => handleStoreListItemClick(store)}
                    >
                      <h4 className="font-semibold">{store.name}</h4>
                      <p className="text-sm text-gray-600">{store.address}</p>
                    </div>
                  ))}
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