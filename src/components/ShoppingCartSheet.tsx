import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingCart, MinusCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useShoppingCart, ShoppingListItem } from '@/hooks/useShoppingCart';
import { Separator } from '@/components/ui/separator';

interface ShoppingCartSheetProps {
  children: React.ReactNode;
}

const ShoppingCartSheet: React.FC<ShoppingCartSheetProps> = ({ children }) => {
  const { items, totalPrice, removeItem, updateQuantity, clearCart } = useShoppingCart();

  const handleUpdateQuantity = (item: ShoppingListItem, delta: number) => {
    updateQuantity(item.productId, item.quantity + delta);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold">Your Shopping List</SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        <ScrollArea className="flex-grow pr-4">
          {items.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">Your shopping list is empty.</p>
          ) : (
            <div className="space-y-4">
              {items.map(item => (
                <div key={item.productId} className="flex items-center gap-4 border-b pb-4 last:border-b-0">
                  <img
                    src={item.productImageUrl || "/placeholder.svg"}
                    alt={item.productName}
                    className="w-20 h-20 object-cover rounded-md flex-shrink-0"
                  />
                  <div className="flex-grow">
                    <h3 className="font-semibold text-lg">{item.productName}</h3>
                    <p className="text-sm text-gray-600">{item.storeName}</p>
                    <p className="text-md font-bold text-green-600">
                      {item.currency_symbol}{item.productPrice.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <MinusCircle className="h-4 w-4" />
                      </Button>
                      <span className="font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleUpdateQuantity(item, 1)}
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-auto text-red-500 hover:text-red-700"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <Separator className="my-4" />
        <div className="flex justify-between items-center text-xl font-bold mt-auto">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
        {items.length > 0 && (
          <Button variant="destructive" className="w-full mt-4" onClick={clearCart}>
            Clear Shopping List
          </Button>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ShoppingCartSheet;