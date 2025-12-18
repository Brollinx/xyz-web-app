"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFavoritesModal } from "@/contexts/FavoritesModalContext"; // Import the new hook

interface FavoritesButtonProps {
  className?: string;
}

const FavoritesButton: React.FC<FavoritesButtonProps> = ({ className }) => {
  const { openFavoritesModal } = useFavoritesModal();

  return (
    <Button
      variant="secondary"
      size="icon"
      onClick={() => openFavoritesModal(true)} // Directly open the modal
      className={cn(
        "rounded-full shadow-md hover:shadow-lg transition-all duration-200",
        "bg-card/80 backdrop-blur-sm dark:bg-background/60", // Changed bg-background/80 to bg-card/80
        className
      )}
    >
      <Heart className="h-5 w-5 text-primary dark:text-primary-foreground" />
    </Button>
  );
};

export default FavoritesButton;