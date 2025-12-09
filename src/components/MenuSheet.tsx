"use client";

import React from "react";
import { Link } from "react-router-dom";
import { User, Heart, HelpCircle, Settings, Sun, Moon, Laptop, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useTheme } from "next-themes";
import { useFavoritesModal } from "@/contexts/FavoritesModalContext";
import { Separator } from "@/components/ui/separator"; // Assuming Separator is available

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
        className="w-[85%] sm:max-w-sm flex flex-col p-0 z-[1100]" // Set width and z-index
        // overlayClassName="z-[1050] bg-background/80 backdrop-blur-sm" // Overlay with z-index and blur - Removed invalid prop
      >
        <SheetHeader className="p-4 pb-2">
          <SheetTitle className="text-2xl font-bold">App Menu</SheetTitle>
          <SheetDescription>Navigate and customize your experience.</SheetDescription>
        </SheetHeader>
        <Separator />
        <div className="flex-grow flex flex-col p-4 space-y-2">
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/" onClick={() => onOpenChange(false)} className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/login" onClick={() => onOpenChange(false)} className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start w-full" onClick={handleOpenFavorites}>
            <Heart className="h-5 w-5" />
            <span>Favorites</span>
          </Button>
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/help" onClick={() => onOpenChange(false)} className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              <span>Help</span>
            </Link>
          </Button>
          <Button variant="ghost" className="justify-start w-full" asChild>
            <Link to="/settings" onClick={() => onOpenChange(false)} className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <span>App Settings</span>
            </Link>
          </Button>
          <Separator className="my-4" />
          <h3 className="text-lg font-semibold px-2">Theme</h3>
          <Button variant="ghost" className="justify-start w-full" onClick={() => { setTheme("light"); onOpenChange(false); }}>
            <Sun className="h-5 w-5" />
            <span>Light</span>
          </Button>
          <Button variant="ghost" className="justify-start w-full" onClick={() => { setTheme("dark"); onOpenChange(false); }}>
            <Moon className="h-5 w-5" />
            <span>Dark</span>
          </Button>
          <Button variant="ghost" className="justify-start w-full" onClick={() => { setTheme("system"); onOpenChange(false); }}>
            <Laptop className="h-5 w-5" />
            <span>System</span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MenuSheet;