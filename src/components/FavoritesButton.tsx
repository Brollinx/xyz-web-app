"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoritesButtonProps {
  className?: string;
  onClick?: () => void; // allow using as a modal opener
}

const FavoritesButton: React.FC<FavoritesButtonProps> = ({ className, onClick }) => {
  const content = (
    <Button
      variant="secondary"
      size="icon"
      onClick={onClick}
      className={cn(
        "rounded-full shadow-md hover:shadow-lg transition-all duration-200",
        "bg-background/80 backdrop-blur-sm dark:bg-background/60",
        className
      )}
    >
      <Heart className="h-5 w-5 text-primary dark:text-primary-foreground" />
    </Button>
  );

  // If onClick is provided, use it as a pure button (modal opener); else keep link to /favorites
  return onClick ? content : <Link to="/favorites">{content}</Link>;
};

export default FavoritesButton;