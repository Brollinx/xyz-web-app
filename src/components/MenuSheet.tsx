"use client";

import React from "react";
import { Link } from "react-router-dom";
import { User, Heart, HelpCircle, Settings, Sun, Moon, Laptop, Home, LogIn, Loader2, Store, XCircle, LogOut } from "lucide-react"; // Added LogOut icon
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useFavoritesModal } from "@/contexts/FavoritesModalContext";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; // Removed AvatarImage as profile is not fetched
import { User as AuthUser } from '@supabase/supabase-js';

interface StoreLocationInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface MenuSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  user: AuthUser | null;
  loadingAuth: boolean;
  onLogout: () => void; // New prop for hard logout
  dismissedNearbyStores: StoreLocationInfo[];
  clearDismissedStore: (storeId: string) => void;
  clearAllDismissedStores: () => void;
}

const MenuSheet: React.FC<MenuSheetProps> = ({
  isOpen,
  onOpenChange,
  user,
  loadingAuth,
  onLogout,
  dismissedNearbyStores,
  clearDismissedStore,
  clearAllDismissedStores,
}) => {
  const { setTheme, theme } = useTheme();
  const { openFavoritesModal } = useFavoritesModal();

  const handleOpenFavorites = () => {
    onOpenChange(false); // Close the menu sheet first
    openFavoritesModal(true); // Then open the favorites modal
  };

  const handleLogoutClick = () => {
    onOpenChange(false); // Close menu sheet
    onLogout(); // Trigger hard logout
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-[300px] flex flex-col p-0 z-[1100]"
      >
        <SheetHeader className="p-4 pb-2">
          {loadingAuth ? (
            <div className="flex items-center gap-3 p-2">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="font-semibold text-lg">Loading...</div>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3 p-2">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                  {user.email ? user.email.charAt(0).toUpperCase() : <User className="h-6 w-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="font-semibold text-lg truncate">{user.email || "Logged In User"}</div>
                <div className="text-sm text-muted-foreground truncate">User ID: {user.id.substring(0, 8)}...</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-2">
              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
                <User className="h-6 w-6" />
              </div>
              <div className="font-semibold text-lg">Guest User</div>
            </div>
          )}
        </SheetHeader>
        <Separator />
        <div className="flex-grow flex flex-col gap-3 p-4 text-sm overflow-y-auto">
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" className="justify-start w-full" asChild>
                <Link to="/profile" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
                  <User className="h-5 w-5" />
                  <span>Profile</span>
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full flex items-center gap-3 truncate" onClick={handleOpenFavorites}>
                <Heart className="h-5 w-5" />
                <span>Favorites</span>
              </Button>
              <Button variant="ghost" className="justify-start w-full flex items-center gap-3 truncate" onClick={handleLogoutClick}>
                <LogOut className="mr-2 h-5 w-5" />
                <span>Logout</span>
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="justify-start w-full" asChild>
                <Link to="/login" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
                  <LogIn className="h-5 w-5" />
                  <span>Login</span>
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start w-full" asChild>
                <Link to="/signup" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
                  <User className="h-5 w-5" />
                  <span>Sign up</span>
                </Link>
              </Button>
            </>
          )}

          {dismissedNearbyStores.length > 0 && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-semibold">Nearby Stores</h3>
                <Button variant="ghost" size="sm" onClick={clearAllDismissedStores} className="h-auto p-1 text-muted-foreground hover:text-destructive">
                  Clear All
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                {dismissedNearbyStores.map(store => (
                  <div key={store.id} className="flex items-center justify-between">
                    <Button variant="ghost" className="justify-start w-full flex items-center gap-3 truncate" asChild>
                      <Link to={`/store/${store.id}`} onClick={() => onOpenChange(false)}>
                        <Store className="h-5 w-5 text-blue-600" />
                        <span>{store.store_name}</span>
                      </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => clearDismissedStore(store.id)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          <Separator className="my-4" />
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/settings" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
              <Settings className="h-5 w-5" />
              <span>App Settings</span>
            </Link>
          </Button>
          <h3 className="text-lg font-semibold px-2">Theme</h3>
          <div className="flex flex-col gap-3 theme-options">
            <Button
              variant={theme === "light" ? "secondary" : "ghost"}
              className="justify-start w-full flex items-center gap-3 truncate"
              onClick={() => { setTheme("light"); onOpenChange(false); }}
            >
              <Sun className="h-5 w-5" />
              <span>Light</span>
            </Button>
            <Button
              variant={theme === "dark" ? "secondary" : "ghost"}
              className="justify-start w-full flex items-center gap-3 truncate"
              onClick={() => { setTheme("dark"); onOpenChange(false); }}
            >
              <Moon className="h-5 w-5" />
              <span>Dark</span>
            </Button>
            <Button
              variant={theme === "system" ? "secondary" : "ghost"}
              className="justify-start w-full flex items-center gap-3 truncate"
              onClick={() => { setTheme("system"); onOpenChange(false); }}
            >
              <Laptop className="h-5 w-5" />
              <span>System</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MenuSheet;