"use client";

import React from "react";
import { Link } from "react-router-dom";
import { User, Heart, HelpCircle, Settings, Sun, Moon, Laptop, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
} from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useFavoritesModal } from "@/contexts/FavoritesModalContext";
import { Separator } from "@/components/ui/separator";

interface MenuSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const MenuSheet: React.FC<MenuSheetProps> = ({ isOpen, onOpenChange }) => {
  const { setTheme } = useTheme();
  const { openFavoritesModal } = useFavoritesModal();

  const handleOpenFavorites = () => {
    onOpenChange(false); // Close the menu sheet first
    openFavoritesModal(true); // Then open the favorites modal
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[85vw] max-w-[300px] flex flex-col p-0 z-[1100]"
      >
        <SheetHeader className="p-4 pb-2">
          <div className="flex items-center gap-3 p-2">
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400">
              <User className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Your Profile</div>
          </div>
        </SheetHeader>
        <Separator />
        <div className="flex-grow flex flex-col gap-3 p-4 text-sm overflow-y-auto">
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/login" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start w-full flex items-center gap-3 truncate" onClick={handleOpenFavorites}>
            <Heart className="h-5 w-5" />
            <span>Favorites</span>
          </Button>
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/help" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
              <HelpCircle className="h-5 w-5" />
              <span>Help</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/settings" onClick={() => onOpenChange(false)} className="flex items-center gap-3 truncate">
              <Settings className="h-5 w-5" />
              <span>App Settings</span>
            </Link>
          </Button>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold px-2">Theme</h3>
          <div className="flex flex-col gap-3 theme-options">
            <Button variant="ghost" className="justify-start w-full flex items-center gap-3 truncate" onClick={() => { setTheme("light"); onOpenChange(false); }}>
              <Sun className="h-5 w-5" />
              <span>Light</span>
            </Button>
            <Button variant="ghost" className="justify-start w-full flex items-center gap-3 truncate" onClick={() => { setTheme("dark"); onOpenChange(false); }}>
              <Moon className="h-5 w-5" />
              <span>Dark</span>
            </Button>
            <Button variant="ghost" className="justify-start w-full flex items-center gap-3 truncate" onClick={() => { setTheme("system"); onOpenChange(false); }}>
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