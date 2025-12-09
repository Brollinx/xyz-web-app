"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SimpleBottomSheetProps {
  children: React.ReactNode;
  className?: string;
}

const SimpleBottomSheet: React.FC<SimpleBottomSheetProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "xyz-simple-sheet",
        "fixed bottom-0 left-0 right-0 w-full bg-background z-50 shadow-lg",
        "border-t-2 border-border",
        "rounded-t-[16px]",
        className
      )}
      style={{
        height: "50vh", // Static height as requested
      }}
    >
      <div className="xyz-sheet-content h-full overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default SimpleBottomSheet;