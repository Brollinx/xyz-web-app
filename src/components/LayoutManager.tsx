"use client";

import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import mapboxgl from "mapbox-gl"; // Import mapboxgl for resize and easeTo

interface LayoutManagerProps {
  mapContent: React.ReactNode;
  sheetContent: React.ReactNode;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>; // Add mapRef prop
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  mapContent,
  sheetContent,
  mapRef, // Destructure mapRef
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

  // Define snap points dynamically based on window height
  const SNAP = useMemo(() => {
    if (typeof window === 'undefined') { // Handle SSR or initial render where window is not available
      return { MINI: 0, MID: 0, FULL: 0 };
    }
    return {
      FULL: window.innerHeight * 0.10, // 10% from top (fully open)
      MID: window.innerHeight * 0.50, // 50% from top (default open)
      MINI: window.innerHeight * 0.82, // 82% from top (mostly closed)
    };
  }, []);

  // Mobile sheet state
  const [sheetY, setSheetY] = useState(SNAP.MID); // Y position of the sheet's top edge
  const [startY, setStartY] = useState(0); // Initial touch Y position
  const [startSheetY, setStartSheetY] = useState(0); // Sheet Y position at start of touch
  const [dragging, setDragging] = useState(false); // Flag to control sheet dragging
  const dragHandleRef = useRef<HTMLDivElement>(null); // Ref for the drag handle

  // Set initial sheet position on mount for mobile
  useEffect(() => {
    if (isMobile) {
      setSheetY(SNAP.MID);
    }
  }, [isMobile, SNAP]);

  // Map resize and easeTo effect
  useEffect(() => {
    if (isMobile && mapRef.current) {
      const mapInstance = mapRef.current;
      const mapHeight = sheetY; // Map height is the sheet's top Y position

      // Resize map to fill the space above the sheet
      mapInstance.resize();

      // Pad the map view to keep the center visible when sheet moves
      const paddingBottom = window.innerHeight - sheetY;
      mapInstance.easeTo({
        padding: { bottom: paddingBottom },
        duration: 200,
      });
    }
  }, [sheetY, isMobile, mapRef]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobile) return;
    setDragging(true);
    setStartY(e.touches[0].clientY);
    setStartSheetY(sheetY);
  }, [isMobile, sheetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !dragging) return;
    e.preventDefault(); // Prevent default scroll behavior when dragging the sheet

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    let newY = startSheetY + diff;

    // Clamp dragging between FULL and MINI snap points
    newY = Math.min(Math.max(newY, SNAP.FULL), SNAP.MINI);
    setSheetY(newY);
  }, [isMobile, dragging, startY, startSheetY, SNAP]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !dragging) return;
    setDragging(false);

    // Snap to nearest point
    const distFull = Math.abs(sheetY - SNAP.FULL);
    const distMid = Math.abs(sheetY - SNAP.MID);
    const distMini = Math.abs(sheetY - SNAP.MINI);

    const minDist = Math.min(distFull, distMid, distMini);

    if (minDist === distFull) {
      setSheetY(SNAP.FULL);
    } else if (minDist === distMid) {
      setSheetY(SNAP.MID);
    } else {
      setSheetY(SNAP.MINI);
    }
  }, [isMobile, dragging, sheetY, SNAP]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes space above the sheet */}
          <div
            className="h-full w-full fixed top-0 left-0 z-10 overflow-hidden"
            style={{
              height: `${sheetY}px`, // Map height is determined by sheet's top position
              transition: dragging ? "none" : "height 0.25s ease",
            }}
          >
            {mapContent}
          </div>
          {/* Mobile Bottom Sheet */}
          <div
            className={cn(
              "fixed left-0 right-0 w-full bg-background z-20 shadow-lg",
              "flex flex-col", // Ensure flex column for drag handle and scroll area
              "border-t-2 border-border", // Add a subtle border to separate from map
            )}
            style={{
              top: 0, // Sheet starts at the top of the viewport
              height: "100vh", // Sheet takes full viewport height
              transform: `translateY(${sheetY}px)`, // Translate it down to sheetY
              transition: dragging ? "none" : "transform 0.25s ease",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              boxShadow: "0 -6px 20px rgba(0,0,0,0.15)",
            }}
          >
            <div
              ref={dragHandleRef}
              className="drag-handle"
              style={{ touchAction: 'none' }} // Drag handle with ref and touch-action
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
            <ScrollArea className="flex-1 relative h-full"> {/* Ensures ScrollArea takes remaining height and has relative position */}
              {sheetContent}
            </ScrollArea>
          </div>
        </>
      ) : (
        <>
          {/* Desktop: Map on left, sheet as right sidebar (UNCHANGED) */}
          <GlobalMapContainer className="hidden md:block fixed left-0 top-0 md:w-1/2 lg:w-3/5 h-screen">
            {mapContent}
          </GlobalMapContainer>
          <div
            className={cn(
              "hidden md:flex fixed right-0 top-0 md:w-1/2 lg:w-2/5 h-screen overflow-y-auto bg-card text-card-foreground shadow-lg border-l border-border"
            )}
          >
            <ScrollArea className="h-full w-full">
              {sheetContent}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};

export default LayoutManager;