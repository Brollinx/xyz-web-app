import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ShoppingCart, Store } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { CartItem } from '@/context/CartContext'; // Import CartItem type

const ShoppingCartPage = () => {
  const { cartItems, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart } = useCart();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-center text-gray-900 flex items-center justify-center gap-3">
          <ShoppingCart className="h-9 w-9" /> Your Shopping List
        </h1>

        {cartItems.length === 0 ? (
          <Card className="text-center p-8 shadow-md">
            <CardContent>
              <p className="text-lg text-gray-600 mb-4">Your shopping list is empty.</p>
              <Link to="/">
                <Button>Start Browsing Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 shadow-md">
              <CardHeader>
                <CardTitle className="text-2xl">Items ({totalItems})</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-4">
                    {cartItems.map((item: CartItem) => (
                      <div key={item.productId} className="flex items-center justify-between border-b pb-4 last:border-b-0 last:pb-0">
                        <div className="flex items-center gap-4">
                          <img
                            src={item.productImageUrl || "/placeholder.svg"}
                            alt={item.productName}
                            className="h-20 w-20 object-cover rounded-md flex-shrink-0"
                          />
                          <div className="flex flex-col">
                            <h3 className="font-semibold text-lg">{item.productName}</h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Store className="h-4 w-4" />
                              <Link to={`/store/${item.storeId}`} className="hover:underline text-blue-600">
                                {item.storeName}
                              </Link>
                            </p>
                            <p className="text-md font-bold text-green-600">
                              {item.currency_symbol}{item.productPrice.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                            className="w-20 text-center"
                          />
                          <Button variant="destructive" size="icon" onClick={() => removeFromCart(item.productId)}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1 shadow-md h-fit sticky top-4">
              <CardHeader>
                <CardTitle className="text-2xl">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total Items:</span>
                  <span>{totalItems}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-2xl font-bold text-green-700">
                  <span>Total Price:</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <Button onClick={clearCart} variant="outline" className="w-full mt-4">
                  Clear Shopping List
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCartPage;