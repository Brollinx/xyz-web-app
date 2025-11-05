import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const LOCAL_FAVORITES_KEY = "guestFavorites";

export interface FavoriteProduct {
  id: string; // Favorite entry ID (UUID for Supabase, generated for localStorage)
  user_id?: string; // Optional for guest users
  product_id: string;
  store_id: string;
  product_name: string;
  price: number;
  image_url?: string;
  store_name: string;
  currency: string; // Added currency
  currency_symbol?: string; // Added currency symbol
  created_at?: string; // Optional for guest users
}

// Helper to get guest favorites from localStorage
const getGuestFavorites = (): FavoriteProduct[] => {
  try {
    const stored = localStorage.getItem(LOCAL_FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error reading guest favorites from localStorage:", error);
    return [];
  }
};

// Helper to set guest favorites to localStorage
const setGuestFavorites = (favorites: FavoriteProduct[]) => {
  try {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(favorites));
  } catch (error) {
    console.error("Error writing guest favorites to localStorage:", error);
  }
};

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Function to sync localStorage favorites to Supabase
  const syncFavorites = useCallback(async (currentUserId: string) => {
    const guestFavorites = getGuestFavorites();
    if (guestFavorites.length === 0) {
      return; // Nothing to sync
    }

    toast.loading("Syncing guest favorites...", { id: "sync-favorites" });

    try {
      // Fetch existing Supabase favorites to avoid duplicates
      const { data: existingSupabaseFavorites, error: fetchError } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", currentUserId);

      if (fetchError) throw fetchError;
      const existingProductIds = new Set(existingSupabaseFavorites?.map(f => f.product_id));

      const favoritesToInsert = guestFavorites
        .filter(fav => !existingProductIds.has(fav.product_id))
        .map(fav => ({
          user_id: currentUserId,
          product_id: fav.product_id,
          store_id: fav.store_id,
          product_name: fav.product_name,
          price: fav.price,
          image_url: fav.image_url,
          store_name: fav.store_name,
          currency: fav.currency, // Include currency
          currency_symbol: fav.currency_symbol, // Include currency symbol
        }));

      if (favoritesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("favorites")
          .insert(favoritesToInsert);

        if (insertError) throw insertError;
        toast.success(`Synced ${favoritesToInsert.length} new favorites!`, { id: "sync-favorites" });
      } else {
        toast.info("No new guest favorites to sync.", { id: "sync-favorites" });
      }

      // Clear guest favorites from localStorage after successful sync
      setGuestFavorites([]);
    } catch (error) {
      console.error("Error syncing guest favorites:", error);
      toast.error("Failed to sync guest favorites.", { id: "sync-favorites" });
    }
  }, []);

  // Get current user ID and listen for auth state changes
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setLoading(false);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const newUserId = session?.user?.id || null;
      setUserId(newUserId);
      setLoading(false);

      if (_event === 'SIGNED_IN' && newUserId) {
        await syncFavorites(newUserId);
        // After sync, refetch all favorites (Supabase only)
        fetchFavorites(); 
      } else if (_event === 'SIGNED_OUT') {
        // When signed out, clear Supabase favorites and load guest favorites
        setFavorites(getGuestFavorites());
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [syncFavorites]); // Add syncFavorites to dependency array

  // Fetch favorites based on login state
  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    if (!userId) {
      // Guest user: load from localStorage
      setFavorites(getGuestFavorites());
      setLoading(false);
      return;
    }

    // Logged-in user: load from Supabase
    try {
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites.");
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const isFavorited = useCallback((productId: string) => {
    return favorites.some((fav) => fav.product_id === productId);
  }, [favorites]);

  const addFavorite = useCallback(async (product: Omit<FavoriteProduct, "id" | "user_id" | "created_at">) => {
    if (isFavorited(product.product_id)) {
      toast.info("Product already in favorites.");
      return;
    }

    if (!userId) {
      // Guest user: add to localStorage
      const newGuestFavorite: FavoriteProduct = {
        ...product,
        id: Math.random().toString(36).substring(2, 15), // Simple unique ID for localStorage
      };
      const updatedFavorites = [...getGuestFavorites(), newGuestFavorite];
      setGuestFavorites(updatedFavorites);
      setFavorites(updatedFavorites); // Update local state immediately
      toast.success("Added to favorites!");
      return;
    }

    // Logged-in user: add to Supabase
    try {
      const { data, error } = await supabase
        .from("favorites")
        .insert({ ...product, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      setFavorites((prev) => [...prev, data]);
      toast.success("Added to favorites!");
    } catch (error) {
      console.error("Error adding favorite:", error);
      toast.error("Failed to add to favorites.");
    }
  }, [userId, isFavorited]);

  const removeFavorite = useCallback(async (productId: string) => {
    if (!userId) {
      // Guest user: remove from localStorage
      const updatedFavorites = getGuestFavorites().filter((fav) => fav.product_id !== productId);
      setGuestFavorites(updatedFavorites);
      setFavorites(updatedFavorites); // Update local state immediately
      toast.success("Removed from favorites.");
      return;
    }

    // Logged-in user: remove from Supabase
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId);

      if (error) throw error;
      setFavorites((prev) => prev.filter((fav) => fav.product_id !== productId));
      toast.success("Removed from favorites.");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove from favorites.");
    }
  }, [userId]);

  const clearAllFavorites = useCallback(async () => {
    if (!userId) {
      // Guest user: clear localStorage
      setGuestFavorites([]);
      setFavorites([]); // Update local state immediately
      toast.success("All favorites cleared!");
      return;
    }

    // Logged-in user: clear Supabase
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
      setFavorites([]);
      toast.success("All favorites cleared!");
    } catch (error) {
      console.error("Error clearing favorites:", error);
      toast.error("Failed to clear favorites.");
    }
  }, [userId]);

  return {
    favorites,
    loading,
    userId,
    isFavorited,
    addFavorite,
    removeFavorite,
    clearAllFavorites,
    fetchFavorites,
  };
}