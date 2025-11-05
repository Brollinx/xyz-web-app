import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export interface FavoriteProduct {
  id: string; // Favorite entry ID
  user_id: string;
  product_id: string;
  store_id: string;
  product_name: string;
  price: number;
  image_url?: string;
  store_name: string;
  created_at: string;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Get current user ID
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      setLoading(false);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setLoading(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch favorites when userId changes
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
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
    if (!userId) {
      toast.error("Please log in to add favorites.");
      return;
    }
    if (isFavorited(product.product_id)) {
      toast.info("Product already in favorites.");
      return;
    }

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
      toast.error("Please log in to remove favorites.");
      return;
    }

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
      toast.error("Please log in to clear favorites.");
      return;
    }

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
    fetchFavorites, // Expose fetchFavorites for manual refresh if needed
  };
}