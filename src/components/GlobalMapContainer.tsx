import React from "react";
import { cn } from "@/lib/utils";

interface GlobalMapContainerProps {
  children: React.ReactNode;
  className?: string;
}

const GlobalMapContainer: React.FC<GlobalMapContainerProps> = ({ children, className }) => {
  return (
    <div className={cn("relative h-full w-full", className)}>
      {children}
    </div>
  );
};

export default GlobalMapContainer;