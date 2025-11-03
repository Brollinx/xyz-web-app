import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, RefreshCw } from "lucide-react"; // Added RefreshCw icon
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, formatDistance, cn } from "@/lib/utils";
import StoreIcon from "@/assets/store.svg";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation"; // Import the new hook

interface StoreInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  formattedDistance?: string;
}

const NearbyStoresPage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [loadingStores, setLoadingStores] = useState(true);

  const { userLocation, loading: loadingLocation, locationStatus, refreshLocation } = useHighPrecisionGeolocation(); // Use the new hook

  useEffect(() => {
    const fetchStores = async () => {
      if (locationStatus === "denied") {
        setLoadingStores(false);
        return;
      }
      if (locationStatus === "loading" && !userLocation) return;

      setLoadingStores(true);
      try {
        const { data, error } = await supabase
          .from('stores')
          .select(`id, store_name, address, latitude, longitude, is_active`)
          .eq('is_active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (error) throw error;

        const fetchedStores: StoreInfo[] = data.map((store: any) => ({
          id: store.id,
          store_name: store.store_name,
          address: store.address,
          latitude: store.latitude,
          longitude: store.longitude,
        }));
        setStores(fetchedStores);
        if (fetchedStores.length === 0) {
          toast.info("No active stores found.");
        }
      } catch (error) {
        console.error("Error fetching stores:", error);
        toast.error("Failed to fetch stores. Please try again.");
      } finally {
        setLoadingStores(false);
      }
    };

    fetchStores();
  }, [userLocation, locationStatus]); // Depend on userLocation and locationStatus from the hook

  const processedStores = useMemo(() => {
    if (locationStatus !== "success" || !userLocation || stores.length === 0) {
      return stores;
    }

    return stores
      .map(store => {
        const distanceInMeters = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          store.latitude,
          store.longitude
        );

        return {
          ...store,
          distanceMeters: distanceInMeters,
          formattedDistance: formatDistance(distanceInMeters),
        };
      })
      .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
  }, [stores, userLocation, locationStatus]);

  if (loadingStores || loadingLocation) { // Combine loading states
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">
          {loadingLocation ? "Getting your location..." : "Loading nearby stores..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Nearby Stores</h1>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
          {locationStatus === "denied" && (
            <p className="text-red-500">Location access denied. Please enable location services to see nearby stores.</p>
          )}
          {userLocation && (
            <span className="flex items-center">
              Location Accuracy: {Math.round(userLocation.accuracy_meters)} m
              <Button variant="ghost" size="sm" onClick={refreshLocation} className="ml-2 h-auto p-1">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </span>
          )}
        </div>
      </div>

      <div className="w-full max-w-4xl">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Stores Near You</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-3">
                {processedStores.length > 0 ? (
                  processedStores.map((store) => (
                    <div
                      key={store.id}
                      className="p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => navigate(`/store/${store.id}`)}
                    >
                      <div className="flex items-center flex-grow">
                        <img
                          src={StoreIcon}
                          alt={store.store_name}
                          className="h-16 w-16 object-contain rounded-md mr-4 flex-shrink-0"
                        />
                        <div className="flex-grow">
                          <h4 className="font-semibold text-lg">{store.store_name}</h4>
                          <p className="text-sm text-gray-600">{store.address}</p>
                          {locationStatus === "success" && store.formattedDistance !== undefined && (
                            <p className="text-sm text-gray-500">Distance: {store.formattedDistance}</p>
                          )}
                        </div>
                      </div>
                      <div className="pl-2">
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(`/store/${store.id}`); }}>
                          <MapPin className="h-6 w-6 text-blue-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-8">No nearby stores found.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NearbyStoresPage;