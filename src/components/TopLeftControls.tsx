"use client";

import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface TopLeftControlsProps {
  onOpenMenu: () => void;
  showBackButton: boolean; // New prop to control back button visibility
}

const TopLeftControls: React.FC<TopLeftControlsProps> = ({ onOpenMenu, showBackButton }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/"); // Fallback to home if no history
    }
  };

  return (
    <div className="fixed top-4 left-4 z-[1000] flex items-center space-x-2">
      <Button
        variant="secondary"
        size="icon"
        className={cn(
          "rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-card/80 backdrop-blur-sm dark:bg-background/60", // Changed bg-background/80 to bg-card/80
          "text-primary dark:text-primary-foreground"
        )}
        aria-label="Open menu"
        onClick={onOpenMenu}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {showBackButton && ( // Use the new prop here
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-card/80 backdrop-blur-sm dark:bg-background/60" // Changed bg-background/80 to bg-card/80
          aria-label="Go back"
          onClick={handleBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};

export default TopLeftControls;