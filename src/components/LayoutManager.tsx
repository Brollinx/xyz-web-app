import React from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import { ScrollArea } from "@/components/ui/scroll-area"; // Import ScrollArea for mobile content
import { cn } from "@/lib/utils";

interface LayoutManagerProps {
  mapContent: React.ReactNode;
  sheetContent: React.ReactNode;
  floatingControls?: React.ReactNode;
  // isSheetOpen, onSheetOpenChange, sheetSnapPoints are no longer needed without GlobalBottomSheet
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
          {/* Mobile: Map is NOT visible, sheet content is full screen and scrollable */}
          <div className="block md:hidden w-full h-full overflow-hidden bg-background text-foreground">
            <ScrollArea className="h-full w-full">
              {sheetContent}
            </ScrollArea>
          </div>
          {floatingControls}
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