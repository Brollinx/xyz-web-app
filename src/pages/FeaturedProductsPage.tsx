import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { getRecentlyViewedStoreIds } from "@/utils/viewedItems"; // Import the utility

interface ProductWithStoreInfo {
  productId: string;
  productName: string;
  productPrice: number;
  stockQuantity: number;
  productImageUrl?: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  currency: string;
  currency_symbol?: string;
}

const FeaturedProductsPage = () => {
  const navigate = useNavigate();
  const [featuredProducts, setFeaturedProducts] = useState<ProductWithStoreInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setLoading(true);
      try {
        const viewedStoreIds = getRecentlyViewedStoreIds();

        if (viewedStoreIds.length === 0) {
          toast.info("No recently viewed stores to feature products from.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('products')
          .select(`
            id, name, price, stock_quantity, is_active, image_url, currency, currency_symbol,
            stores (id, store_name, address)
          `)
          .in('store_id', viewedStoreIds)
          .eq('is_active', true);

        if (error) throw error;

        const products: ProductWithStoreInfo[] = data
          .filter((product: any) => product.stores)
          .map((product: any) => ({
            productId: product.id,
            productName: product.name,
            productPrice: product.price,
            stockQuantity: product.stock_quantity,
            productImageUrl: product.image_url,
            currency: product.currency || 'USD',
            currency_symbol: product.currency_symbol || '$',
            storeId: product.stores.id,
            storeName: product.stores.store_name,
            storeAddress: product.stores.address,
          }));
        
        setFeaturedProducts(products);
        if (products.length === 0) {
          toast.info("No featured products found from your recently viewed stores.");
        }
      } catch (error) {
        console.error("Error fetching featured products:", error);
        toast.error("Failed to load featured products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin" />
        <p className="ml-4">Loading featured products...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background dark:bg-slate-950 p-4">
      {/* FloatingBackButton removed from here */}
      <div className="w-full max-w-4xl text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Featured Products</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">From stores you've recently visited</p>
      </div>

      <div className="w-full max-w-4xl">
        <Card className="flex flex-col bg-card text-card-foreground"> {/* Removed h-[600px] */}
          <CardHeader>
            <CardTitle className="dark:text-gray-200">Products from Recently Viewed Stores</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow p-4"> {/* Added p-4 for internal padding */}
            <ScrollArea className="h-full w-full">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"> {/* Removed p-4 here to avoid double padding */}
                {featuredProducts.length > 0 ? (
                  featuredProducts.map((product) => (
                    <div
                      key={product.productId}
                      className="p-2 border border-border rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer transition-colors flex flex-col"
                      onClick={() => navigate(`/store/${product.storeId}?product=${product.productId}`)}
                    >
                      <img
                        src={product.productImageUrl || "/placeholder.svg"}
                        alt={product.productName}
                        className="w-full h-20 object-cover rounded-md mb-2"
                      />
                      <h4 className="font-semibold text-sm flex-grow truncate dark:text-gray-200">{product.productName}</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-400 truncate">{product.storeName}</p>
                      <p className="text-sm font-bold text-green-600 dark:text-green-400">
                        {product.currency_symbol}{product.productPrice.toFixed(2)}
                      </p>
                      <p className={`text-xs ${product.stockQuantity > 0 ? "text-green-500" : "text-red-500"}`}>
                        Stock: {product.stockQuantity > 0 ? "In Stock" : "Out of Stock"}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 mt-8">No featured products available. Visit some stores to see products here!</p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FeaturedProductsPage;