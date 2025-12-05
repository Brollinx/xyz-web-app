import React from "react";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import GlobalMapContainer from "@/components/GlobalMapContainer";
import GlobalBottomSheet from "@/components/GlobalBottomSheet";

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
          {/* Mobile: Map is NOT visible, sheet is full screen */}
          <GlobalBottomSheet
            isMobile={true}
            isOpen={isSheetOpen}
            onOpenChange={onSheetOpenChange}
            snapPoints={sheetSnapPoints}
            className="block md:hidden w-full h-full overflow-y-auto"
          >
            {sheetContent}
          </GlobalBottomSheet>
          {floatingControls}
        </>
      ) : (
        <>
          {/* Desktop: Map on left, sheet as right sidebar */}
          <GlobalMapContainer className="hidden md:block fixed left-0 top-0 md:w-1/2 lg:w-3/5 h-screen">
            {mapContent}
            {floatingControls}
          </GlobalMapContainer>
          <GlobalBottomSheet
            isMobile={false}
            className="hidden md:flex fixed right-0 top-0 md:w-1/2 lg:w-2/5 h-screen overflow-y-auto"
          >
            {sheetContent}
          </GlobalBottomSheet>
        </>
      )}
    </div>
  );
};

export default LayoutManager;