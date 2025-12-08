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

  // No state or handlers for dragging in the static sheet
  // const [sheetY, setSheetY] = useState<number>(0);
  // const [startY, setStartY] = useState<number>(0);
  // const [startSheetY, setStartSheetY] = useState<number>(0);
  // const [dragging, setDragging] = useState(false);
  // const dragHandleRef = useRef<HTMLDivElement>(null);

  // No dynamic snap points for the static sheet
  // const SNAP = useMemo(() => {
  //   if (typeof window === 'undefined') {
  //     return { MINI: 0, MID: 0, FULL: 0 };
  //   }
  //   return {
  //     FULL: window.innerHeight * 0.10,
  //     MID: window.innerHeight * 0.50,
  //     MINI: window.innerHeight * 0.82,
  //   };
  // }, []);

  // No initial sheet position setting for the static sheet
  // useEffect(() => {
  //   if (isMobile) {
  //     setSheetY(SNAP.MID);
  //   }
  // }, [isMobile, SNAP]);

  // Map resize effect for static sheet
  useEffect(() => {
    if (isMobile && mapRef.current) {
      const mapInstance = mapRef.current;
      // Map height is fixed to 50vh (100vh - 50vh for sheet)
      mapInstance.resize();
      // No padding needed as sheet is static
    }
  }, [isMobile, mapRef]);

  // No touch handlers for the static sheet
  // const handleTouchStart = useCallback((e: React.TouchEvent) => { /* ... */ }, []);
  // const handleTouchMove = useCallback((e: React.TouchEvent) => { /* ... */ }, []);
  // const handleTouchEnd = useCallback(() => { /* ... */ }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes space above the static sheet */}
          <div
            className="h-full w-full fixed top-0 left-0 z-10 overflow-hidden"
            style={{
              height: `calc(100vh - 50vh)`, // Map height is 50% of viewport height
            }}
          >
            {mapContent}
          </div>
          {/* Mobile Static Bottom Sheet */}
          <div
            className="mobile-bottom-sheet"
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              width: '100%',
              height: '50vh', // Fixed height
              background: 'hsl(var(--background))', // Use theme equivalent
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              boxShadow: '0 -6px 20px rgba(0,0,0,0.15)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div className="drag-handle" style={{
              width: '48px',
              height: '6px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '6px',
              margin: '10px auto',
            }}></div>
            <div className="sheet-content" style={{
              height: 'calc(100% - 30px)', // 100% minus drag handle height + margin
              overflowY: 'auto',
            }}>
              {sheetContent}
            </div>
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