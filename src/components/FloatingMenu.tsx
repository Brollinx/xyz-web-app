"use client";

import React from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils"; // Assuming cn is used for class merging

interface FloatingMenuProps {
  onOpen: () => void; // Callback to open the MenuSheet
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({ onOpen }) => {
  return (
    <div className="fixed top-4 left-4 z-[1000]"> {/* Set z-index for the button */}
      <Button
        variant="secondary"
        size="icon"
        className={cn(
          "rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-background/80 backdrop-blur-sm dark:bg-background/60",
          "text-primary dark:text-primary-foreground" // Ensure icon color is visible
        )}
        aria-label="Open menu"
        onClick={onOpen}
      >
        <Menu className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default FloatingMenu;