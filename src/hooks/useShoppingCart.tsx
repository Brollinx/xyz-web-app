import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface ShoppingListItem {
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  storeId: string;
  storeName: string;
  currency: string;
  currency_symbol?: string;
  quantity: number;
}

interface ShoppingCartContextType {
  items: ShoppingListItem[];
  totalPrice: number;
  addItem: (item: Omit<ShoppingListItem, 'quantity'>, initialQuantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

const ShoppingCartContext = createContext<ShoppingCartContextType | undefined>(undefined);

const SHOPPING_CART_STORAGE_KEY = 'shoppingCartItems';

export const ShoppingCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ShoppingListItem[]>(() => {
    try {
      const storedItems = localStorage.getItem(SHOPPING_CART_STORAGE_KEY);
      return storedItems ? JSON.parse(storedItems) : [];
    } catch (error) {
      console.error("Failed to parse shopping cart from localStorage", error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(SHOPPING_CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error("Failed to save shopping cart to localStorage", error);
    }
  }, [items]);

  const addItem = useCallback((item: Omit<ShoppingListItem, 'quantity'>, initialQuantity: number = 1) => {
    setItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(i => i.productId === item.productId);

      if (existingItemIndex > -1) {
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += initialQuantity;
        toast.success(`Increased quantity of ${item.productName} to ${updatedItems[existingItemIndex].quantity}`);
        return updatedItems;
      } else {
        toast.success(`Added ${item.productName} to your shopping list!`);
        return [...prevItems, { ...item, quantity: initialQuantity }];
      }
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prevItems => {
      const removedItem = prevItems.find(item => item.productId === productId);
      if (removedItem) {
        toast.info(`Removed ${removedItem.productName} from your shopping list.`);
      }
      return prevItems.filter(item => item.productId !== productId);
    });
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(prevItems => {
      if (quantity <= 0) {
        return prevItems.filter(item => item.productId !== productId);
      }
      return prevItems.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    toast.info("Your shopping list has been cleared.");
  }, []);

  const getItemQuantity = useCallback((productId: string) => {
    const item = items.find(i => i.productId === productId);
    return item ? item.quantity : 0;
  }, [items]);

  const totalPrice = items.reduce((sum, item) => sum + item.productPrice * item.quantity, 0);

  const value = React.useMemo(() => ({
    items,
    totalPrice,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItemQuantity,
  }), [items, totalPrice, addItem, removeItem, updateQuantity, clearCart, getItemQuantity]);

  return (
    <ShoppingCartContext.Provider value={value}>
      {children}
    </ShoppingCartContext.Provider>
  );
};

export const useShoppingCart = () => {
  const context = useContext(ShoppingCartContext);
  if (context === undefined) {
    throw new Error('useShoppingCart must be used within a ShoppingCartProvider');
  }
  return context;
};