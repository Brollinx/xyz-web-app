import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, HeartOff } from "lucide-react";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/use-favorites"; // Updated import path

const FavoritesPage = () => {
  const navigate = useNavigate();
  const { favorites, loading, userId, removeFavorite, clearAllFavorites } = useFavorites();

  // Group favorites by currency and calculate total for each currency
  const totalsByCurrency = useMemo(() => {
    const totals: { [currency: string]: { sum: number; symbol: string } } = {};
    favorites.forEach(item => {
      const currency = item.currency || 'USD'; // Default to USD if not specified
      const currency_symbol = item.currency_symbol || '$'; // Default to $ if not specified
      if (!totals[currency]) {
        totals[currency] = { sum: 0, symbol: currency_symbol };
      }
      totals[currency].sum += Number(item.price);
    });
    return totals;
  }, [favorites]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading your favorites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background p-4">
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900">My Favorites</h1>
        <p className="text-lg text-gray-600">Products you've loved</p>
      </div>

      <div className="w-full max-w-4xl">
        <Card className="h-[600px] flex flex-col">
          <CardHeader>
            <CardTitle>Your Favorited Products</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-full w-full">
              <div className="p-4 space-y-3">
                {favorites.length > 0 ? (
                  favorites.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border rounded-md hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
                      onClick={() => navigate(`/store/${product.store_id}?product=${product.product_id}`)}
                    >
                      <div className="flex items-center flex-grow">
                        <img
                          src={product.image_url || "/placeholder.svg"}
                          alt={product.product_name}
                          className="h-16 w-16 object-cover rounded-md mr-4 flex-shrink-0"
                        />
                        <div className="flex-grow">
                          <h4 className="font-semibold text-lg">{product.product_name}</h4>
                          <p className="text-sm text-gray-700">{product.store_name}</p>
                          <p className="text-md font-bold text-green-600">
                            {product.currency_symbol}{Number(product.price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="pl-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFavorite(product.product_id);
                          }}
                        >
                          <Trash2 className="h-5 w-5 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-8">You haven't favorited any products yet.</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {favorites.length > 0 && (
          <Card className="mt-4 p-4 flex flex-col gap-2">
            {Object.entries(totalsByCurrency).map(([currency, { sum, symbol }]) => (
              <h3 key={currency} className="text-xl font-bold">
                Total Price ({currency}): {symbol}{sum.toFixed(2)}
              </h3>
            ))}
            <Button variant="destructive" onClick={clearAllFavorites} className="mt-2">
              <Trash2 className="mr-2 h-4 w-4" /> Clear All Favorites
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;