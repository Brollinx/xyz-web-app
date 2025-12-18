"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { useFavorites } from "@/hooks/use-favorites";

type FavoritesModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const FavoritesModal: React.FC<FavoritesModalProps> = ({ open, onOpenChange }) => {
  const { favorites, loading, removeFavorite, clearAllFavorites } = useFavorites();

  const totalsByCurrency = useMemo(() => {
    const totals: { [currency: string]: { sum: number; symbol: string } } = {};
    favorites.forEach(item => {
      const currency = item.currency || "USD";
      const symbol = item.currency_symbol || "$";
      if (!totals[currency]) totals[currency] = { sum: 0, symbol };
      totals[currency].sum += Number(item.price);
    });
    return totals;
  }, [favorites]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl z-[700]">
        <DialogHeader>
          <DialogTitle>My Favorites</DialogTitle>
          <DialogDescription>Quickly view and manage your favorite products.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span>Loading favorites...</span>
            </div>
          ) : (
            <>
              <ScrollArea className="max-h-[50vh] w-full">
                <div className="space-y-2 pr-2">
                  {favorites.length > 0 ? (
                    favorites.map(product => (
                      <Card key={product.id} className="border flex items-center">
                        <CardContent className="flex items-center w-full p-3">
                          <img
                            src={product.image_url || "/placeholder.svg"}
                            alt={product.product_name}
                            className="h-14 w-14 rounded-md object-cover mr-3 flex-shrink-0"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{product.product_name}</div>
                            <div className="text-xs text-muted-foreground">{product.store_name}</div>
                            <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                              {product.currency_symbol}{Number(product.price).toFixed(2)}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFavorite(product.product_id)}
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <p className="text-sm text-center text-muted-foreground py-6">
                      No favorites yet.
                    </p>
                  )}
                </div>
              </ScrollArea>
              {favorites.length > 0 && (
                <div className="space-y-2">
                  {Object.entries(totalsByCurrency).map(([currency, { sum, symbol }]) => (
                    <div key={currency} className="text-sm font-semibold">
                      Total ({currency}): {symbol}{sum.toFixed(2)}
                    </div>
                  ))}
                  <div className="flex justify-end">
                    <Button variant="destructive" onClick={clearAllFavorites}>
                      <Trash2 className="h-4 w-4 mr-2" /> Clear All
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FavoritesModal;