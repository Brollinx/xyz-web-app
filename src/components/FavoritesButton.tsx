"use client";

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoritesButtonProps {
  className?: string;
}

const FavoritesButton: React.FC<FavoritesButtonProps> = ({ className }) => {
  return (
    <Link to="/favorites">
      <Button
        variant="secondary"
        size="icon"
        className={cn(
          "rounded-full shadow-md hover:shadow-lg transition-all duration-200",
          "bg-background/80 backdrop-blur-sm dark:bg-background/60",
          className
        )}
      >
        <Heart className="h-5 w-5 text-primary dark:text-primary-foreground" />
      </Button>
    </Link>
  );
};

export default FavoritesButton;