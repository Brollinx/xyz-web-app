import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, cn } from "@/lib/utils";
import StoreIcon from "@/assets/store.svg";

interface StoreInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number; // Raw distance in miles
  formattedDistance?: string; // Formatted distance string
}

interface UserLocation {
  lat: number;
  lng: number;
}

type LocationStatus = "loading" | "success" | "denied";

const NearbyStoresPage = () => {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreInfo[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("loading");
  const [loadingStores, setLoadingStores] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(userLoc);
          setLocationStatus("success");
          toast.success("Found your location!");
        },
        (error) => {
          console.error("Error getting user location:", error);
          setLocationStatus("denied");
          toast.warning("Location access denied. Cannot show nearby stores.");
          setLoadingStores(false);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      setLocationStatus("denied");
      toast.warning("Geolocation is not supported by your browser. Cannot show nearby stores.");
      setLoadingStores(false);
    }
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      if (locationStatus === "denied") {
        setLoadingStores(false);
        return;
      }
      if (locationStatus === "loading" && !userLocation) return; // Wait for location if still loading

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
  }, [userLocation, locationStatus]);

  const processedStores = useMemo(() => {
    if (locationStatus !== "success" || !userLocation || stores.length === 0) {
      return stores;
    }

    return stores
      .map(store => {
        const distanceInMiles = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          store.latitude,
          store.longitude,
          'miles'
        );

        let formattedDistance: string;
        if (distanceInMiles < 1000) {
          formattedDistance = `${distanceInMiles.toFixed(1)} miles`;
        } else {
          const distanceInKm = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            store.latitude,
            store.longitude,
            'km'
          );
          formattedDistance = `${distanceInKm.toFixed(1)} km`;
        }

        return {
          ...store,
          distance: distanceInMiles,
          formattedDistance,
        };
      })
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }, [stores, userLocation, locationStatus]);

  if (loadingStores) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">
          {locationStatus === "loading" ? "Getting your location..." : "Loading nearby stores..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Nearby Stores</h1>
        {locationStatus === "denied" && (
          <p className="text-red-500">Location access denied. Please enable location services to see nearby stores.</p>
        )}
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
                          src={StoreIcon} // Using a generic store icon for now
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