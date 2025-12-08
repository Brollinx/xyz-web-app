"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface MobileStaticSheetProps {
  children: React.ReactNode;
  className?: string;
}

const MobileStaticSheet: React.FC<MobileStaticSheetProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        "xyz-mobile-sheet",
        "fixed left-0 right-0 bottom-0 w-full h-[50vh] bg-background", // Use theme equivalent for background
        "border-t-2 border-border", // Add a subtle border to separate from map
        "rounded-t-[16px] shadow-lg z-50 overflow-hidden",
        className
      )}
    >
      <div className="xyz-drag-handle" style={{
        width: '48px',
        height: '6px',
        background: 'rgba(0,0,0,0.25)',
        borderRadius: '6px',
        margin: '10px auto',
      }}></div>
      <div className="xyz-sheet-content" style={{
        height: 'calc(100% - 30px)', // 100% minus drag handle height + margin
        overflowY: 'auto',
      }}>
        {children}
      </div>
    </div>
  );
};

export default MobileStaticSheet;