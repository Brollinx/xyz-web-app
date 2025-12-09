"use client";

import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface TopLeftControlsProps {
  onOpenMenu: () => void;
}

const TopLeftControls: React.FC<TopLeftControlsProps> = ({ onOpenMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current path is a store details page or route page
  const isStoreOrRoutePage = location.pathname.startsWith("/store/") || location.pathname.startsWith("/route/");

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
          "rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-background/80 backdrop-blur-sm dark:bg-background/60",
          "text-primary dark:text-primary-foreground"
        )}
        aria-label="Open menu"
        onClick={onOpenMenu}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {isStoreOrRoutePage && (
        <Button
          variant="secondary"
          size="icon"
          className="rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-background/80 backdrop-blur-sm dark:bg-background/60"
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