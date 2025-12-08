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

  // Mobile sheet state
  const [sheetY, setSheetY] = useState<number>(0); // Y position of the sheet's top edge
  const [startY, setStartY] = useState<number>(0); // Initial touch Y position
  const [startSheetY, setStartSheetY] = useState<number>(0); // Sheet Y position at start of touch
  const [isDraggingSheet, setIsDraggingSheet] = useState(false); // Flag to control sheet dragging
  const dragHandleRef = useRef<HTMLDivElement>(null); // Ref for the drag handle

  // Define snap points dynamically based on window height
  const SNAP_POINTS = useMemo(() => {
    if (typeof window === 'undefined') { // Handle SSR or initial render where window is not available
      return { MINI: 0, MID: 0, FULL: 0 };
    }
    return {
      MINI: window.innerHeight * 0.82, // 82% from top (mostly closed)
      MID: window.innerHeight * 0.50, // 50% from top (default open)
      FULL: window.innerHeight * 0.10, // 10% from top (fully open)
    };
  }, []);

  // Set initial sheet position on mount for mobile
  useEffect(() => {
    if (isMobile) {
      setSheetY(SNAP_POINTS.MID);
    }
  }, [isMobile, SNAP_POINTS]);

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

    // Only start dragging the sheet if the touch began on the drag handle
    if (dragHandleRef.current && dragHandleRef.current.contains(e.target as Node)) {
      setIsDraggingSheet(true);
      setStartY(e.touches[0].clientY);
      setStartSheetY(sheetY);
    } else {
      setIsDraggingSheet(false); // Allow normal scrolling if not on drag handle
    }
  }, [isMobile, sheetY]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobile || !isDraggingSheet) return; // Only move if sheet dragging is active
    e.preventDefault(); // Prevent default scroll behavior when dragging the sheet

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    let newSheetY = startSheetY + deltaY;

    // Clamp dragging between FULL and MINI snap points
    newSheetY = Math.max(SNAP_POINTS.FULL, Math.min(SNAP_POINTS.MINI, newSheetY));
    setSheetY(newSheetY);
  }, [isMobile, isDraggingSheet, startY, startSheetY, SNAP_POINTS]);

  const handleTouchEnd = useCallback(() => {
    if (!isMobile || !isDraggingSheet) return;
    setIsDraggingSheet(false); // Reset dragging state

    // Snap to nearest point
    const distances = {
      mini: Math.abs(sheetY - SNAP_POINTS.MINI),
      mid: Math.abs(sheetY - SNAP_POINTS.MID),
      full: Math.abs(sheetY - SNAP_POINTS.FULL),
    };

    const closestSnapPoint = Object.keys(distances).reduce((a, b) =>
      distances[a as keyof typeof distances] < distances[b as keyof typeof distances] ? a : b
    );

    setSheetY(SNAP_POINTS[closestSnapPoint as keyof typeof SNAP_POINTS]);
  }, [isMobile, isDraggingSheet, sheetY, SNAP_POINTS]);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes space above the sheet */}
          <div
            className="h-full w-full fixed top-0 left-0 z-10 overflow-hidden"
            style={{
              height: `${sheetY}px`, // Map height is determined by sheet's top position
              transition: isDraggingSheet ? "none" : "height 0.25s ease",
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
              top: `${sheetY}px`,
              height: `calc(100vh - ${sheetY}px)`,
              transition: isDraggingSheet ? "none" : "transform 0.25s ease", // Use transform for smooth movement
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              boxShadow: "0 -6px 20px rgba(0,0,0,0.15)",
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div ref={dragHandleRef} className="drag-handle" /> {/* Drag handle with ref */}
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