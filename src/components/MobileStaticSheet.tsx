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
  const [dragging, setDragging] = useState(false); // Flag to control sheet dragging
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
    setDragging(true);
    setStartY(e.touches[0].clientY);
    setStartSheetY(sheetY);
  }, [sheetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!dragging) return;
    e.preventDefault(); // Prevent default scroll behavior when dragging the sheet

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    let newY = startSheetY + diff;

    // Clamp dragging between FULL and MINI snap points
    newY = Math.min(Math.max(newY, SNAP.FULL), SNAP.MINI);
    setSheetY(newY);
  }, [dragging, startY, startSheetY, SNAP]);

  const handleTouchEnd = useCallback(() => {
    if (!dragging) return;
    setDragging(false);

    // Snap to nearest point
    const currentSheetY = sheetY;
    const windowHeight = window.innerHeight;

    // Thresholds for snapping
    const fullThreshold = windowHeight * 0.30; // If sheetY is less than 30% from top, snap to FULL
    const miniThreshold = windowHeight * 0.70; // If sheetY is more than 70% from top, snap to MINI

    if (currentSheetY < fullThreshold) {
      setSheetY(SNAP.FULL);
    } else if (currentSheetY > miniThreshold) {
      setSheetY(SNAP.MINI);
    } else {
      setSheetY(SNAP.MID);
    }
  }, [dragging, sheetY, SNAP]);

  return (
    <div
      className={cn(
        "xyz-mobile-sheet",
        "fixed left-0 right-0 w-full bg-background z-60 shadow-lg", // Use theme equivalent for background, z-index changed to 60
        "flex flex-col", // Ensure flex column for drag handle and scroll area
        "border-t-2 border-border", // Add a subtle border to separate from map
        "rounded-t-[16px]",
        className
      )}
      style={{
        top: 0, // Sheet starts at the top of the viewport
        height: "100vh", // Sheet takes full viewport height
        transform: `translateY(${sheetY}px)`, // Translate it down to sheetY
        transition: dragging ? "none" : "transform 0.25s ease",
        boxShadow: '0 -6px 20px rgba(0,0,0,0.15)', // Apply box-shadow here
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