import React from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import GlobalBottomSheet from "@/components/GlobalBottomSheet"; // Import the recreated GlobalBottomSheet

interface LayoutManagerProps {
  mapContent: React.ReactNode;
  sheetContent: React.ReactNode;
  floatingControls?: React.ReactNode;
  isSheetOpen?: boolean; // For mobile drawer control
  onSheetOpenChange?: (open: boolean) => void; // For mobile drawer control
  sheetSnapPoints?: number[]; // For mobile drawer snap points
}

const LayoutManager: React.FC<LayoutManagerProps> = ({
  mapContent,
  sheetContent,
  floatingControls,
  isSheetOpen,
  onSheetOpenChange,
  sheetSnapPoints,
}) => {
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {isMobile ? (
        <>
          {/* Mobile: Map in top half, sheet content in bottom half via GlobalBottomSheet */}
          <GlobalMapContainer className="block md:hidden h-1/2 w-full">
            {mapContent}
            {floatingControls} {/* Floating controls over the map */}
          </GlobalMapContainer>
          <GlobalBottomSheet
            isOpen={isSheetOpen}
            onOpenChange={onSheetOpenChange}
            snapPoints={sheetSnapPoints}
          >
            {sheetContent}
          </GlobalBottomSheet>
        </>
      ) : (
        <>
          {/* Desktop: Map on left, sheet as right sidebar */}
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