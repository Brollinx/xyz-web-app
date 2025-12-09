"use client";

import React, { useRef, useEffect, useState } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import mapboxgl from "mapbox-gl";
import SimpleBottomSheet from "@/components/SimpleBottomSheet"; // Changed import

interface LayoutManagerProps {
  mapContent: React.ReactNode;
  sheetContent: React.ReactNode;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  mapContent,
  sheetContent,
  mapRef,
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

  // Removed currentSheetY state and related logic as per instructions.
  // The map padding/zoom logic tied to sheetY is also removed.

  useEffect(() => {
    if (!isMobile && mapRef.current) {
      // For desktop, ensure map resizes if window changes
      mapRef.current.resize();
    } else if (isMobile && mapRef.current) {
      // For mobile, map takes 50vh, sheet takes 50vh.
      // Map needs to be resized and potentially centered.
      const mapInstance = mapRef.current;
      mapInstance.resize();
      // If you want to center the map to account for the bottom sheet,
      // you might need to adjust its center or padding here.
      // For now, we'll just resize.
      mapInstance.easeTo({
        padding: { bottom: window.innerHeight * 0.50 }, // Adjust map view to account for static 50vh sheet
        duration: 200,
      });
    }
  }, [isMobile, mapRef]);


  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes space above the static sheet */}
          <div
            className="h-full w-full fixed top-0 left-0 z-10 overflow-hidden"
            style={{
              height: `50vh`, // Map height is fixed to 50vh
            }}
          >
            {mapContent}
          </div>
          {/* Mobile Static Bottom Sheet */}
          <SimpleBottomSheet> {/* Using the new SimpleBottomSheet */}
            {sheetContent}
          </SimpleBottomSheet>
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