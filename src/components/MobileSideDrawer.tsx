"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Home, User, Heart, HelpCircle, Settings, Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "next-themes";
import { useFavoritesModal } from "@/contexts/FavoritesModalContext";
import { cn } from "@/lib/utils";

interface MobileSideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileSideDrawer: React.FC<MobileSideDrawerProps> = ({ isOpen, onClose }) => {
  const { setTheme } = useTheme();
  const { openFavoritesModal } = useFavoritesModal();

  const handleFavoritesClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openFavoritesModal(true);
    onClose();
  };

  const handleThemeChange = (theme: string) => {
    setTheme(theme);
    onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="drawer-overlay" onClick={onClose}></div>
      )}
      <div
        className={cn(
          "side-drawer",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 space-y-4">
          <h2 className="text-xl font-bold">Menu</h2>
          <nav className="space-y-2">
            <Link to="/" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md" onClick={onClose}>
              <Home className="h-5 w-5" />
              <span>Home</span>
            </Link>
            <Link to="/login" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md" onClick={onClose}>
              <User className="h-5 w-5" />
              <span>Profile</span>
            </Link>
            <a href="#" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md" onClick={handleFavoritesClick}>
              <Heart className="h-5 w-5" />
              <span>Favorites</span>
            </a>
            <Link to="/help" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md" onClick={onClose}>
              <HelpCircle className="h-5 w-5" />
              <span>Help</span>
            </Link>
            <Link to="/settings" className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md" onClick={onClose}>
              <Settings className="h-5 w-5" />
              <span>App Settings</span>
            </Link>
          </nav>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Theme</h3>
            <div className="flex flex-col space-y-1">
              <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-left" onClick={() => handleThemeChange("light")}>
                <Sun className="h-5 w-5" />
                <span>Light</span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-left" onClick={() => handleThemeChange("dark")}>
                <Moon className="h-5 w-5" />
                <span>Dark</span>
              </button>
              <button className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md text-left" onClick={() => handleThemeChange("system")}>
                <Laptop className="h-5 w-5" />
                <span>System</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileSideDrawer;