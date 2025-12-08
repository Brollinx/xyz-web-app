"use client";

import React, { useRef, useEffect, useState } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import mapboxgl from "mapbox-gl"; // Import mapboxgl for resize and easeTo
import MobileStaticSheet from "@/components/MobileStaticSheet"; // Import the new static sheet

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

  // State to track the sheet's Y position, managed by MobileStaticSheet
  const [currentSheetY, setCurrentSheetY] = useState(window.innerHeight * 0.50); // Initialize to MID snap point
  const prevSheetYRef = useRef(currentSheetY); // Ref to store previous sheetY for zoom logic

  // Map resize and easeTo effect
  useEffect(() => {
    if (isMobile && mapRef.current) {
      const mapInstance = mapRef.current;
      mapInstance.resize();

      const paddingBottom = window.innerHeight - currentSheetY;
      let newZoom = mapInstance.getZoom();

      // Implement subtle zoom reaction based on sheet movement
      if (prevSheetYRef.current !== currentSheetY) {
        if (currentSheetY > prevSheetYRef.current) { // Sheet moved down, map area decreased
          newZoom = newZoom + 0.2;
        } else { // Sheet moved up, map area increased
          newZoom = newZoom - 0.2;
        }
      }
      prevSheetYRef.current = currentSheetY; // Update previous sheetY

      mapInstance.easeTo({
        padding: { bottom: paddingBottom },
        zoom: newZoom, // Apply subtle zoom change
        duration: 250, // As requested
      });
    }
  }, [isMobile, mapRef, currentSheetY]); // Depend on currentSheetY

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes space above the static sheet */}
          <div
            className="h-full w-full fixed top-0 left-0 z-10 overflow-hidden" // Map container z-index is 10
            style={{
              height: `${currentSheetY}px`, // Map height is determined by sheet's top position
              transition: "height 0.25s ease", // Smooth transition for map height
            }}
          >
            {mapContent}
          </div>
          {/* Mobile Static Bottom Sheet */}
          <MobileStaticSheet onSheetYChange={setCurrentSheetY}> {/* Pass callback */}
            {sheetContent}
          </MobileStaticSheet>
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