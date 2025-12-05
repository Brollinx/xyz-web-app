"use client";

import React from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
// GlobalBottomSheet is no longer used for the main content area in mobile.

interface LayoutManagerProps {
  mapContent: React.ReactNode;
  sheetContent: React.ReactNode;
  // floatingControls prop is no longer used for mobile layout in LayoutManager
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  mapContent,
  sheetContent,
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes top 50%, fixed at top, never overlapped by bottom sheet */}
          <div className="h-1/2 w-full fixed top-0 left-0 z-10 overflow-hidden">
            {mapContent}
          </div>
          {/* NEW BOTTOM SHEET SECTION: Starts at 50vh, fixed to bottom, 50vh height, theme-adaptive background */}
          <div className={cn(
            "fixed bottom-0 left-0 right-0 w-full h-1/2 bg-background z-20 shadow-lg", // z-index 20 places it above map (z-10)
            "overflow-y-auto" // Ensure scrollability for content
          )}>
            {/* SCROLLABLE CONTENT WITHIN BOTTOM SHEET */}
            <ScrollArea className="h-full w-full"> {/* Ensures ScrollArea takes full height of the fixed bottom sheet */}
              {sheetContent}
            </ScrollArea>
          </div>
          {/* Floating buttons (like back button, theme toggle) will be rendered directly in pages, above z-20 */}
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