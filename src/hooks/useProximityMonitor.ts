"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { calculateDistance } from "@/lib/utils";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation";
import { toast } from "sonner";
import { User as AuthUser } from '@supabase/supabase-js'; // Import AuthUser type

interface StoreLocationInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface DetectedStore extends StoreLocationInfo {
  detectedAt: number; // Timestamp when the user entered the radius
}

const PROXIMITY_RADIUS_METERS = 30; // Default radius for detection (20-50m as requested)
const LOCATION_CHECK_INTERVAL_MS = 10 * 1000; // Check location every 10 seconds
const PROMPT_COOLDOWN_MS = 5 * 60 * 1000; // Don't re-prompt for the same store for 5 minutes after dismissal
const LOCAL_STORAGE_AUTO_OPEN_KEY = "xyz_auto_open_nearby_stores"; // Key for local storage preference

export function useProximityMonitor(user: AuthUser | null) { // Accept user object
  const { userLocation, loading: loadingLocation, locationStatus, refreshLocation } = useHighPrecisionGeolocation();
  const [allStores, setAllStores] = useState<StoreLocationInfo[]>([]);
  const [nearbyStoreToPrompt, setNearbyStoreToPrompt] = useState<DetectedStore | null>(null);
  const [dismissedNearbyStores, setDismissedNearbyStores] = useState<StoreLocationInfo[]>([]);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState<boolean>(true); // State for the setting

  // Ref to keep track of stores that have recently been prompted or dismissed
  const promptedOrDismissedStores = useRef<Map<string, number>>(new Map()); // storeId -> timestamp

  // Effect to load the auto-open preference
  useEffect(() => {
    const loadPreference = async () => {
      // Always load from local storage first for instant UI reflection
      let preference: boolean = localStorage.getItem(LOCAL_STORAGE_AUTO_OPEN_KEY) === "false" ? false : true;

      if (user) {
        // Logged-in user: try to load from Supabase profile and override local storage
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("auto_open_nearby_stores")
            .eq("auth_id", user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error; // PGRST116 means no row found

          if (profile) {
            preference = profile.auto_open_nearby_stores ?? true;
          }
        } catch (error) {
          console.error("Error loading auto_open_nearby_stores preference from Supabase:", error);
          // If Supabase fails, we stick with the local storage value already loaded
        }
      }
      setAutoOpenEnabled(preference);
    };

    loadPreference();
  }, [user]); // Re-run when user changes (login/logout)

  // Fetch all active stores once
  useEffect(() => {
    const fetchStores = async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('id, store_name, address, latitude, longitude, is_active')
        .eq('is_active', true)
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) {
        console.error("Error fetching stores for proximity monitor:", error);
        toast.error("Failed to load store data for proximity detection.");
        return;
      }
      setAllStores(data as StoreLocationInfo[]);
    };
    fetchStores();
  }, []);

  // Periodically check proximity, only if autoOpenEnabled is true
  useEffect(() => {
    if (!autoOpenEnabled || loadingLocation || locationStatus !== "success" || !userLocation || allStores.length === 0) {
      return;
    }

    const checkProximity = () => {
      let newNearbyStore: DetectedStore | null = null;

      for (const store of allStores) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          store.latitude,
          store.longitude
        );

        if (distance <= PROXIMITY_RADIUS_METERS) {
          const lastInteractionTime = promptedOrDismissedStores.current.get(store.id);
          if (!lastInteractionTime || (Date.now() - lastInteractionTime > PROMPT_COOLDOWN_MS)) {
            newNearbyStore = { ...store, detectedAt: Date.now() };
            break; // Found a store to prompt for, prioritize one
          }
        }
      }
      setNearbyStoreToPrompt(newNearbyStore);
    };

    // Initial check
    checkProximity();

    // Set up interval for periodic checks
    const intervalId = setInterval(checkProximity, LOCATION_CHECK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [userLocation, loadingLocation, locationStatus, allStores, autoOpenEnabled]); // Add autoOpenEnabled to dependencies

  const dismissPrompt = useCallback((storeId: string, addToMenu: boolean) => {
    setNearbyStoreToPrompt(null);
    promptedOrDismissedStores.current.set(storeId, Date.now()); // Set cooldown

    if (addToMenu) {
      const store = allStores.find(s => s.id === storeId);
      if (store && !dismissedNearbyStores.some(s => s.id === storeId)) {
        setDismissedNearbyStores(prev => [...prev, store]);
        toast.info(`'${store.store_name}' added to menu for later.`);
      }
    }
  }, [allStores, dismissedNearbyStores]);

  const clearDismissedStore = useCallback((storeId: string) => {
    setDismissedNearbyStores(prev => prev.filter(s => s.id !== storeId));
  }, []);

  const clearAllDismissedStores = useCallback(() => {
    setDismissedNearbyStores([]);
  }, []);

  return {
    nearbyStoreToPrompt,
    dismissedNearbyStores,
    dismissPrompt,
    clearDismissedStore,
    clearAllDismissedStores,
    loadingLocation,
    locationStatus,
    refreshLocation,
    autoOpenEnabled, // Expose the setting state
  };
}