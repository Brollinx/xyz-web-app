import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { calculateDistance, formatDistance, cn } from "@/lib/utils";
import StoreIcon from "@/assets/store.svg";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation";
import SearchBar from "@/components/SearchBar"; // Import SearchBar
import StoreFilterModal from "@/components/StoreFilterModal"; // Import the new StoreFilterModal

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
  const [storeSearchQuery, setStoreSearchQuery] = useState("");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [currentProximityFilter, setCurrentProximityFilter] = useState<number | null>(null);

  const { userLocation, loading: loadingLocation, locationStatus, refreshLocation } = useHighPrecisionGeolocation();

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
  }, [userLocation, locationStatus]);

  const processedStores = useMemo(() => {
    let filtered = stores;

    // Apply store name search filter
    if (storeSearchQuery) {
      const lowerCaseQuery = storeSearchQuery.toLowerCase();
      filtered = filtered.filter(store =>
        store.store_name.toLowerCase().includes(lowerCaseQuery) ||
        store.address.toLowerCase().includes(lowerCaseQuery)
      );
    }

    // Calculate distances and apply proximity filter
    if (locationStatus === "success" && userLocation) {
      filtered = filtered
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
        .filter(store => (currentProximityFilter === null || (store.distanceMeters ?? Infinity) <= currentProximityFilter))
        .sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    } else {
      // If no user location, just sort by name or default order
      filtered = filtered.sort((a, b) => a.store_name.localeCompare(b.store_name));
    }

    return filtered;
  }, [stores, userLocation, locationStatus, storeSearchQuery, currentProximityFilter]);

  const handleStoreSearch = useCallback((query: string) => {
    setStoreSearchQuery(query);
  }, []);

  const handleApplyProximityFilter = useCallback((proximity: number | null) => {
    setCurrentProximityFilter(proximity);
  }, []);

  const isFilterActive = useMemo(() => {
    return currentProximityFilter !== null;
  }, [currentProximityFilter]);

  if (loadingStores || loadingLocation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">
          {loadingLocation ? "Getting your location..." : "Loading nearby stores..."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background dark:bg-slate-950 p-4">
      {/* FloatingBackButton removed from here */}
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Nearby Stores</h1>
        <div className="flex w-full items-center space-x-2 mx-auto">
          <SearchBar
            onSearch={handleStoreSearch}
            onOpenFilters={() => setIsFilterModalOpen(true)}
            isFilterActive={isFilterActive}
            placeholder="Search for a store by name or address..."
          />
        </div>
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
        <Card className="h-[600px] flex flex-col bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Stores Near You</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-3">
                {processedStores.length > 0 ? (
                  processedStores.map((store) => (
                    <div
                      key={store.id}
                      className="p-3 border border-border rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => navigate(`/store/${store.id}`)}
                    >
                      <div className="flex items-center flex-grow min-w-0"> {/* Added min-w-0 */}
                        <img
                          src={StoreIcon}
                          alt={store.store_name}
                          className="h-16 w-16 object-contain rounded-md mr-4 flex-shrink-0"
                        />
                        <div className="flex-grow min-w-0"> {/* Added min-w-0 */}
                          <h4 className="font-semibold text-lg truncate dark:text-gray-200">{store.store_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{store.address}</p> {/* Changed truncate to line-clamp-2 */}
                          {locationStatus === "success" && store.formattedDistance !== undefined ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400">Distance: {store.formattedDistance}</p>
                          ) : (
                            <p className="text-sm text-red-500">Location unavailable. Distance not shown.</p>
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
      <StoreFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyProximityFilter}
        initialProximity={currentProximityFilter}
      />
    </div>
  );
};

export default NearbyStoresPage;