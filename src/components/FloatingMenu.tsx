"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Menu, User, Heart, HelpCircle, Settings, Sun, Moon, Laptop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import FavoritesModal from "@/components/FavoritesModal";
import { useTheme } from "next-themes";

const FloatingMenu: React.FC = () => {
  const [favoritesOpen, setFavoritesOpen] = React.useState(false);
  const { setTheme } = useTheme();

  return (
    <div className="fixed top-4 left-4 z-40">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-background/80 backdrop-blur-sm dark:bg-background/60"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuLabel>Menu</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/login" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setFavoritesOpen(true);
            }}
          >
            <Heart className="h-4 w-4" />
            <span>Favorites</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/help" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>Help</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              <span>App Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setTheme("light");
            }}
          >
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setTheme("dark");
            }}
          >
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex items-center gap-2"
            onSelect={(e) => {
              e.preventDefault();
              setTheme("system");
            }}
          >
            <Laptop className="h-4 w-4" />
            <span>System</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <FavoritesModal open={favoritesOpen} onOpenChange={setFavoritesOpen} />
    </div>
  );
};

export default FloatingMenu;