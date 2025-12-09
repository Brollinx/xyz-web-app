"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SimpleBottomSheetProps {
  children: React.ReactNode;
  className?: string;
  onSheetYChange?: (y: number) => void; // Callback to inform parent of sheetY changes
}

const SimpleBottomSheet: React.FC<SimpleBottomSheetProps> = ({ children, className, onSheetYChange }) => {
  // Define snap points dynamically based on window height
  const SNAP = useMemo(() => {
    if (typeof window === 'undefined') { // Handle SSR or initial render where window is not available
      return { FULL: 0, MID: 0, MINI: 0 };
    }
    return {
      FULL: window.innerHeight * 0.15, // 15% from top (fully open)
      MID: window.innerHeight * 0.50, // Adjusted to 50% from top (default open)
      MINI: window.innerHeight * 0.82, // 82% from top (mostly closed)
    };
  }, []);

  const [sheetY, setSheetY] = useState(SNAP.MID); // Y position of the sheet's top edge
  const [dragging, setDragging] = useState(false); // Flag to control sheet dragging
  const [startY, setStartY] = useState(0); // Initial touch Y position
  const [startSheetY, setStartSheetY] = useState(0); // Sheet Y position at start of touch
  const [startScrollTop, setStartScrollTop] = useState(0); // Scroll position at start of touch
  const contentRef = useRef<HTMLDivElement>(null); // Ref for the scrollable content

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
    const touchY = e.touches[0].clientY;
    const sheetTop = sheetY; // sheetY represents the top edge of the sheet

    // Broaden drag zone: allow dragging if touch starts inside drag handle OR top 60px of sheet
    if (touchY <= sheetTop + 60) {
      setDragging(true);
      setStartY(touchY);
      setStartSheetY(sheetY);
      if (contentRef.current) {
        setStartScrollTop(contentRef.current.scrollTop);
      }
    }
  }, [sheetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const delta = (currentY - startY) * 1.4; // Increased drag sensitivity

    if (dragging) {
      e.preventDefault(); // Prevent default scroll behavior when dragging the sheet
      let newY = startSheetY + delta;
      newY = Math.min(Math.max(newY, SNAP.FULL), SNAP.MINI);
      setSheetY(newY);
    } else if (contentRef.current) {
      // Phone-like scroll + pull behavior
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const isScrollingDown = delta > 0;
      const isScrollingUp = delta < 0;

      if (scrollTop === 0 && isScrollingDown) {
        // If at top and trying to scroll down further, start dragging the sheet
        e.preventDefault();
        setDragging(true);
        setStartY(currentY); // Reset startY to current touch position
        setStartSheetY(sheetY); // Reset startSheetY to current sheet position
        setSheetY(Math.min(Math.max(sheetY + delta, SNAP.FULL), SNAP.MINI));
      } else if (scrollTop + clientHeight >= scrollHeight - 1 && isScrollingUp) { // -1 for float precision
        // If at bottom and trying to scroll up further, start dragging the sheet
        e.preventDefault();
        setDragging(true);
        setStartY(currentY); // Reset startY to current touch position
        setStartSheetY(sheetY); // Reset startSheetY to current sheet position
        setSheetY(Math.min(Math.max(sheetY + delta, SNAP.FULL), SNAP.MINI));
      }
    }
  }, [dragging, startY, startSheetY, sheetY, SNAP]);

  const handleTouchEnd = useCallback(() => {
    setDragging(false);

    // Snapping logic
    const h = window.innerHeight;
    if (sheetY < h * 0.3) { // If sheetY is less than 30% of screen height
      setSheetY(SNAP.FULL);
    } else if (sheetY < h * 0.66) { // If sheetY is between 30% and 66% (arbitrary midpoint for MID)
      setSheetY(SNAP.MID);
    } else { // If sheetY is greater than or equal to 66%
      setSheetY(SNAP.MINI);
    }
  }, [sheetY, SNAP]);

  return (
    <div
      className={cn(
        "xyz-simple-sheet",
        "fixed left-0 right-0 w-full z-50 shadow-lg",
        "flex flex-col",
        "border-t-2 border-border",
        "rounded-t-[16px]",
        className
      )}
      style={{
        top: 0, // Position from top, then translateY moves it down
        height: "100vh", // Full height, then translateY positions it
        transform: `translateY(${sheetY}px)`,
        transition: dragging ? "none" : "transform 0.25s ease",
        boxShadow: '0 -6px 20px rgba(0,0,0,0.15)',
        // background: 'var(--sheet-bg)', // Use CSS variable for theme support - REMOVED, now in CSS class
        touchAction: 'none', // Prevents browser default touch actions on the entire sheet
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="xyz-drag-handle"
        style={{
          width: '50px',
          height: '6px',
          background: 'rgba(0,0,0,0.25)',
          borderRadius: '6px',
          margin: '12px auto 8px auto',
        }}
      ></div>
      <div
        ref={contentRef}
        className="xyz-sheet-content flex-grow"
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

export default SimpleBottomSheet;