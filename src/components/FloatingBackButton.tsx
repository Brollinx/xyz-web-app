"use client";

import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface FloatingBackButtonProps {
  className?: string;
  fallbackHref?: string; // if cannot go back
}

const FloatingBackButton: React.FC<FloatingBackButtonProps> = ({ className, fallbackHref = "/" }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackHref);
    }
  };

  return (
    <div className={className || "fixed top-4 left-16 z-40"}>
      <Button
        variant="secondary"
        size="icon"
        className="rounded-full shadow-md hover:shadow-lg transition-all duration-200 bg-background/80 backdrop-blur-sm dark:bg-background/60"
        aria-label="Go back"
        onClick={handleBack}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default FloatingBackButton;