"use client";

import React from "react";
import { DrawerContent, DrawerPortal, DrawerOverlay } from "@/components/ui/drawer"; // Keep these from shadcn/ui
import { Drawer as VaulDrawer } from "@/components/CustomDrawerRoot"; // Import our custom typed Drawer and rename it
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GlobalBottomSheetProps {
  children: React.ReactNode;
  className?: string;
  // isOpen and onOpenChange are managed internally by the Drawer for its draggable behavior
  // but can be passed if external control is needed for initial mount/unmount.
}

const GlobalBottomSheet: React.FC<GlobalBottomSheetProps> = ({
  children,
  className,
}) => {
  // The Drawer component itself manages its open/close state and snap points
  // based on user interaction. We set initialSnap to 0.5 (50% height).
  return (
    <VaulDrawer shouldScaleBackground={false} snapPoints={[0.5, 0.9]} initialSnap={0.5}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/20 z-40" />
        <DrawerContent className={cn(
          "fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[10px] bg-background z-50",
          "h-[var(--vaul-drawer-height)]", // This ensures the height is controlled by snapPoints
          className
        )}>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3 mb-2" />
          <ScrollArea className="flex-1">
            {children}
          </ScrollArea>
        </DrawerContent>
      </DrawerPortal>
    </VaulDrawer>
  );
};

export default GlobalBottomSheet;