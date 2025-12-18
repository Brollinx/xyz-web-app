"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import mapboxgl from "mapbox-gl";
import SimpleBottomSheet from "@/components/SimpleBottomSheet";

interface LayoutManagerProps {
  mapContent: (props: { paddingBottom: number; isMobile: boolean }) => React.ReactNode;
  sheetContent: (props: { paddingBottom: number; isMobile: boolean }) => React.ReactNode;
  mapRef: React.MutableRefObject<mapboxgl.Map | null>;
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  mapContent,
  sheetContent,
  mapRef,
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";
  const [currentSheetY, setCurrentSheetY] = useState(0); // State to receive sheetY from SimpleBottomSheet
  const prevSheetYRef = useRef(currentSheetY); // Ref to store previous sheetY for zoom logic

  // Callback to update currentSheetY state
  const handleSheetYChange = useCallback((y: number) => {
    setCurrentSheetY(y);
  }, []);

  // Calculate paddingBottom based on sheet position
  const paddingBottom = isMobile ? (window.innerHeight - currentSheetY) : 0;

  // Effect to add subtle zoom reaction when sheet moves
  useEffect(() => {
    if (!isMobile || !mapRef.current) return;

    const mapInstance = mapRef.current;
    const currentZoom = mapInstance.getZoom();

    // Add subtle zoom reaction
    if (currentSheetY !== prevSheetYRef.current) {
      if (currentSheetY > prevSheetYRef.current) { // Sheet is moving down (more of the map is covered)
        mapInstance.zoomTo(currentZoom + 0.15, { duration: 200 });
      } else if (currentSheetY < prevSheetYRef.current) { // Sheet is moving up (more of the map is revealed)
        mapInstance.zoomTo(currentZoom - 0.15, { duration: 200 });
      }
    }
    prevSheetYRef.current = currentSheetY; // Update previous sheetY for next render
  }, [currentSheetY, isMobile, mapRef]);

  const renderProps = { paddingBottom, isMobile };

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes full screen, sheet overlays it */}
          <div
            className="h-screen w-full fixed top-0 left-0 z-10 overflow-hidden"
          >
            {mapContent(renderProps)}
          </div>
          {/* Mobile Static Bottom Sheet */}
          <SimpleBottomSheet onSheetYChange={handleSheetYChange}>
            {sheetContent(renderProps)}
          </SimpleBottomSheet>
        </>
      ) : (
        <>
          {/* Desktop: Map on left, sheet as right sidebar */}
          <GlobalMapContainer className="hidden md:block fixed left-0 top-0 md:w-1/2 lg:w-3/5 h-screen">
            {mapContent(renderProps)}
          </GlobalMapContainer>
          <div
            className={cn(
              "hidden md:flex fixed right-0 top-0 md:w-1/2 lg:w-2/5 h-screen overflow-y-auto bg-card text-card-foreground shadow-lg border-l border-border"
            )}
          >
            <ScrollArea className="h-full w-full">
              {sheetContent(renderProps)}
            </ScrollArea>
          </div>
        </>
      )}
    </div>
  );
};

export default LayoutManager;