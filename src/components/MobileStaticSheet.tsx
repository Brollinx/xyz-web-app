"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface MobileStaticSheetProps {
  children: React.ReactNode;
  className?: string;
  onSheetYChange?: (y: number) => void; // Callback to inform parent of sheetY changes
}

const MobileStaticSheet: React.FC<MobileStaticSheetProps> = ({ children, className, onSheetYChange }) => {
  // Define snap points dynamically based on window height
  const SNAP = useMemo(() => {
    if (typeof window === 'undefined') { // Handle SSR or initial render where window is not available
      return { FULL: 0, MID: 0, MINI: 0 };
    }
    return {
      FULL: window.innerHeight * 0.10, // 10% from top (fully open)
      MID: window.innerHeight * 0.50, // 50% from top (default open)
      MINI: window.innerHeight * 0.82, // 82% from top (mostly closed)
    };
  }, []);

  const [sheetY, setSheetY] = useState(SNAP.MID); // Y position of the sheet's top edge
  const [isDragging, setIsDragging] = useState(false); // Flag to control sheet dragging
  const [startY, setStartY] = useState(0); // Initial touch Y position
  const [startSheetY, setStartSheetY] = useState(0); // Sheet Y position at start of touch

  // Set initial sheet position on mount and window resize
  useEffect(() => {
    setSheetY(SNAP.MID);
  }, [SNAP]);

  // Inform parent about sheetY changes
  useEffect(() => {
    if (onSheetYChange) {
      onSheetYChange(sheetY);
    }
  }, [sheetY, onSheetYChange]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartSheetY(sheetY);
  }, [sheetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent default scroll behavior when dragging the sheet

    const delta = e.touches[0].clientY - startY;
    let newY = startSheetY + delta;

    // Clamp dragging between FULL and MINI snap points
    newY = Math.min(Math.max(newY, SNAP.FULL), SNAP.MINI);
    setSheetY(newY);
  }, [isDragging, startY, startSheetY, SNAP]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      className={cn(
        "xyz-mobile-sheet",
        "fixed left-0 right-0 w-full bg-background z-50 shadow-lg",
        "flex flex-col",
        "border-t-2 border-border",
        "rounded-t-[16px]",
        className
      )}
      style={{
        top: 0,
        height: "100vh",
        transform: `translateY(${sheetY}px)`,
        transition: isDragging ? "none" : "transform 0.25s ease",
        boxShadow: '0 -6px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div
        className="xyz-drag-handle"
        style={{
          width: '48px',
          height: '6px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '6px',
          margin: '10px auto',
          touchAction: 'none', // Prevents browser default touch actions
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      ></div>
      <div className="xyz-sheet-content flex-grow"
        style={{
          overflowY: 'auto',
          minHeight: '0',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobileStaticSheet;