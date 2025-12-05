import React from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import GlobalBottomSheet from "@/components/GlobalBottomSheet"; // Import GlobalBottomSheet

interface LayoutManagerProps {
  mapContent: React.ReactNode;
  sheetContent: React.ReactNode;
  floatingControls?: React.ReactNode;
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  mapContent,
  sheetContent,
  floatingControls,
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map takes top 50%, Bottom Sheet takes bottom 50% and is draggable */}
          <div className="block md:hidden h-1/2 w-full relative overflow-hidden">
            {mapContent}
          </div>
          <div className="block md:hidden h-1/2 w-full"> {/* This div acts as the initial space for the drawer */}
            <GlobalBottomSheet> {/* Use GlobalBottomSheet here for mobile */}
              {sheetContent}
            </GlobalBottomSheet>
          </div>
          {floatingControls} {/* Floating controls are always on top */}
        </>
      ) : (
        <>
          {/* Desktop: Map on left, sheet as right sidebar (NO CHANGES) */}
          <GlobalMapContainer className="hidden md:block fixed left-0 top-0 md:w-1/2 lg:w-3/5 h-screen">
            {mapContent}
            {floatingControls}
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