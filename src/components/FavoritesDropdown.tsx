"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Heart, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface FavoriteProduct {
  id: string; // Favorite ID
  product_id: string;
  product_name: string;
  product_price: number;
  store_name: string;
  currency_symbol: string;
}

const FavoritesDropdown: React.FC = () => {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorites')
        .select(`
          id,
          product_id,
          products (
            name,
            price,
            currency_symbol,
            stores (store_name)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const fetchedFavorites: FavoriteProduct[] = data
        .filter((fav: any) => fav.products && fav.products.stores)
        .map((fav: any) => ({
          id: fav.id,
          product_id: fav.product_id,
          product_name: fav.products.name,
          product_price: fav.products.price,
          store_name: fav.products.stores.store_name,
          currency_symbol: fav.products.currency_symbol || '$',
        }));
      setFavorites(fetchedFavorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [user, fetchFavorites]);

  const handleRemoveFavorite = async (favoriteId: string) => {
    if (!user) {
      toast.error("You must be logged in to remove favorites.");
      return;
    }
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId)
        .eq('user_id', user.id); // Ensure only user's own favorite is deleted

      if (error) throw error;

      toast.success("Product removed from favorites!");
      fetchFavorites(); // Refresh the list
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Failed to remove product from favorites.");
    }
  };

  const totalSummedPrice = favorites.reduce((sum, item) => sum + item.product_price, 0);

  if (!user) {
    return null; // Don't show favorites if not logged in
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative">
          <Heart className="h-5 w-5" />
          {favorites.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-2">
        <DropdownMenuLabel>Your Favorites</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading...
          </div>
        ) : favorites.length === 0 ? (
          <p className="text-center text-gray-500 p-4">No favorites yet!</p>
        ) : (
          <ScrollArea className="h-[300px]">
            {favorites.map((fav) => (
              <DropdownMenuItem key={fav.id} className="flex items-center justify-between py-2">
                <div className="flex-grow">
                  <p className="font-medium">{fav.product_name}</p>
                  <p className="text-sm text-gray-600">{fav.store_name}</p>
                  <p className="text-sm text-green-600">{fav.currency_symbol}{fav.product_price.toFixed(2)}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleRemoveFavorite(fav.id); }}>
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </DropdownMenuItem>
            ))}
          </ScrollArea>
        )}
        <DropdownMenuSeparator />
        <div className="flex justify-between items-center p-2 font-bold">
          <span>Total:</span>
          <span>${totalSummedPrice.toFixed(2)}</span> {/* Assuming USD for total, adjust if needed */}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FavoritesDropdown;