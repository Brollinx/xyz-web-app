"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { calculateDistance } from "@/lib/utils";
import { useHighPrecisionGeolocation } from "@/hooks/useHighPrecisionGeolocation";
import { toast } from "sonner";
import { User as AuthUser } from '@supabase/supabase-js';

interface ProductReminder {
  id: string;
  user_id?: string; // Optional for guest reminders
  search_term: string;
  product_id?: string;
  store_id?: string;
  created_at: string;
  notified_at?: string;
  dismissed_at?: string;
  is_active: boolean;
}

interface StoreInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface ProductInfo {
  id: string;
  name: string;
  store_id: string;
  store_name: string;
  store_latitude: number;
  store_longitude: number;
}

const REMINDER_CHECK_INTERVAL_MS = 30 * 1000; // Check every 30 seconds
const PROXIMITY_RADIUS_METERS = 5000; // Default proximity for reminders (5km)
const NOTIFICATION_COOLDOWN_MS = 24 * 60 * 60 * 1000; // Don't re-notify for the same product/store for 24 hours

const LOCAL_STORAGE_NOTIFY_FAILED_SEARCHES_KEY = "xyz_notify_failed_searches";
const LOCAL_STORAGE_GUEST_REMINDERS_KEY = "xyz_guest_product_reminders";

// Helper to get guest reminders from localStorage
const getGuestReminders = (): ProductReminder[] => { // Use ProductReminder interface for consistency
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_GUEST_REMINDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading guest reminders from localStorage:", error);
    return [];
  }
};

// Helper to set guest reminders to localStorage
const setGuestReminders = (reminders: ProductReminder[]) => {
  try {
    localStorage.setItem(LOCAL_STORAGE_GUEST_REMINDERS_KEY, JSON.stringify(reminders));
  } catch (error) {
    console.error("Error writing guest reminders to localStorage:", error);
  }
};

export function useProductReminderMonitor(user: AuthUser | null) {
  const { userLocation, loading: loadingLocation, locationStatus } = useHighPrecisionGeolocation();
  const [reminders, setReminders] = useState<ProductReminder[]>([]);
  const [notifyEnabled, setNotifyEnabled] = useState<boolean>(true);
  const notifiedReminders = useRef<Set<string>>(new Set()); // To prevent duplicate toasts in a session

  // Load notification preference
  useEffect(() => {
    const loadPreference = async () => {
      // Always load from local storage first for instant UI reflection
      let preference: boolean = localStorage.getItem(LOCAL_STORAGE_NOTIFY_FAILED_SEARCHES_KEY) === "false" ? false : true;

      if (user) {
        // Logged-in user: try to load from Supabase profile and override local storage
        try {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("notify_failed_searches")
            .eq("auth_id", user.id)
            .single();

          if (error && error.code !== 'PGRST116') throw error;

          if (profile) {
            preference = profile.notify_failed_searches ?? true;
          }
        } catch (error) {
          console.error("Error loading notify_failed_searches preference from Supabase:", error);
          // If Supabase fails, we stick with the local storage value already loaded
        }
      }
      setNotifyEnabled(preference);
    };

    loadPreference();
  }, [user]);

  // Fetch active reminders for the logged-in user OR guest reminders from local storage
  useEffect(() => {
    if (!notifyEnabled) {
      setReminders([]);
      return;
    }

    const fetchReminders = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('product_reminders')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .is('dismissed_at', null);

        if (error) {
          console.error("Error fetching product reminders:", error);
          return;
        }
        setReminders(data || []);
      } else {
        // For guest users, load from local storage
        setReminders(getGuestReminders().filter(r => r.is_active && !r.dismissed_at));
      }
    };

    fetchReminders();
    const interval = setInterval(fetchReminders, REMINDER_CHECK_INTERVAL_MS * 2); // Refresh reminders less frequently
    return () => clearInterval(interval);
  }, [user, notifyEnabled]);

  // Main monitoring logic
  useEffect(() => {
    if (!notifyEnabled || loadingLocation || locationStatus !== "success" || !userLocation || reminders.length === 0) {
      return;
    }

    const monitorReminders = async () => {
      const now = Date.now();
      const searchTerms = new Set(reminders.map(r => r.search_term.toLowerCase()));
      const productIds = new Set(reminders.filter(r => r.product_id).map(r => r.product_id!));

      if (searchTerms.size === 0 && productIds.size === 0) return;

      let productQuery = supabase
        .from('products')
        .select(`id, name, store_id, stores(latitude, longitude, store_name)`)
        .eq('is_active', true)
        .gt('stock_quantity', 0);

      const orConditions: string[] = [];
      if (productIds.size > 0) {
        orConditions.push(`id.in.(${Array.from(productIds).join(',')})`);
      }
      if (searchTerms.size > 0) {
        orConditions.push(`name.ilike.any.{${Array.from(searchTerms).map(t => `%${t}%`).join(',')}}`);
      }

      if (orConditions.length > 0) {
        productQuery = productQuery.or(orConditions.join(','));
      } else {
        return; // No conditions to search by
      }

      const { data: productsData, error: productsError } = await productQuery;

      if (productsError) {
        console.error("Error fetching products for reminders:", productsError);
        return;
      }

      const availableProducts: ProductInfo[] = (productsData || [])
        .filter((p: any) => p.stores && p.stores.latitude !== null && p.stores.longitude !== null)
        .map((p: any) => ({
          id: p.id,
          name: p.name,
          store_id: p.store_id,
          store_name: p.stores.store_name,
          store_latitude: p.stores.latitude,
          store_longitude: p.stores.longitude,
        }));

      for (const reminder of reminders) {
        // Check notification cooldown
        if (reminder.notified_at && (now - new Date(reminder.notified_at).getTime() < NOTIFICATION_COOLDOWN_MS)) {
          continue;
        }

        const matchingProducts = availableProducts.filter(p =>
          (reminder.product_id ? p.id === reminder.product_id : p.name.toLowerCase().includes(reminder.search_term.toLowerCase())) &&
          (reminder.store_id ? p.store_id === reminder.store_id : true)
        );

        for (const product of matchingProducts) {
          const distance = calculateDistance(
            userLocation.lat,
            userLocation.lng,
            product.store_latitude,
            product.store_longitude
          );

          if (distance <= PROXIMITY_RADIUS_METERS) {
            const notificationId = `${reminder.id}-${product.id}-${product.store_id}`;
            if (!notifiedReminders.current.has(notificationId)) {
              toast.info(`A store near you now has "${product.name}" you searched for earlier.`, {
                action: {
                  label: "View",
                  onClick: () => {
                    // Mark as notified and navigate
                    updateReminderStatus(reminder.id, 'notified');
                    notifiedReminders.current.add(notificationId);
                    window.location.href = `/store/${product.store_id}?product=${product.id}`;
                  },
                },
                onDismiss: () => {
                  // Mark as dismissed
                  updateReminderStatus(reminder.id, 'dismissed');
                  notifiedReminders.current.add(notificationId);
                },
                duration: 10000,
              });

              // Update notified_at in DB/local storage immediately
              updateReminderStatus(reminder.id, 'notified');
              notifiedReminders.current.add(notificationId);
            }
          }
        }
      }
    };

    const updateReminderStatus = async (reminderId: string, status: 'notified' | 'dismissed') => {
      const updateData = status === 'notified' ? { notified_at: new Date().toISOString() } : { dismissed_at: new Date().toISOString(), is_active: false };

      if (user) {
        await supabase.from('product_reminders').update(updateData).eq('id', reminderId).eq('user_id', user.id);
        setReminders(prev => prev.map(r => r.id === reminderId ? { ...r, ...updateData } : r));
      } else {
        const guestReminders = getGuestReminders();
        const updatedGuestReminders = guestReminders.map(r => r.id === reminderId ? { ...r, ...updateData } : r);
        setGuestReminders(updatedGuestReminders);
        setReminders(updatedGuestReminders.filter(r => r.is_active && !r.dismissed_at));
      }
    };

    const intervalId = setInterval(monitorReminders, REMINDER_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [user, notifyEnabled, loadingLocation, locationStatus, userLocation, reminders]);

  const dismissReminder = useCallback(async (reminderId: string) => {
    const updateData = { dismissed_at: new Date().toISOString(), is_active: false };
    if (user) {
      try {
        await supabase.from('product_reminders').update(updateData).eq('id', reminderId).eq('user_id', user.id);
        setReminders(prev => prev.filter(r => r.id !== reminderId));
        toast.success("Reminder dismissed.");
      } catch (error) {
        console.error("Error dismissing reminder:", error);
        toast.error("Failed to dismiss reminder.");
      }
    } else {
      const guestReminders = getGuestReminders();
      const updatedGuestReminders = guestReminders.map(r => r.id === reminderId ? { ...r, ...updateData } : r);
      setGuestReminders(updatedGuestReminders);
      setReminders(updatedGuestReminders.filter(r => r.is_active && !r.dismissed_at));
      toast.success("Reminder dismissed.");
    }
  }, [user]);

  const clearAllReminders = useCallback(async () => {
    const updateData = { dismissed_at: new Date().toISOString(), is_active: false };
    if (user) {
      try {
        await supabase.from('product_reminders').update(updateData).eq('user_id', user.id);
        setReminders([]);
        toast.success("All reminders cleared.");
      } catch (error) {
        console.error("Error clearing all reminders:", error);
        toast.error("Failed to clear all reminders.");
      }
    } else {
      setGuestReminders([]);
      setReminders([]);
      toast.success("All reminders cleared.");
    }
  }, [user]);

  return {
    reminders,
    notifyEnabled,
    dismissReminder,
    clearAllReminders,
  };
}