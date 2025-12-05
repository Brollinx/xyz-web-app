"use client";

import React from "react";
// Import DrawerContent, DrawerPortal, DrawerOverlay from shadcn/ui's drawer.tsx
// These are generic sub-components that work with either vaul or Radix Dialog.
import { DrawerContent, DrawerPortal, DrawerOverlay } from "@/components/ui/drawer";
// Import our custom-typed Drawer root component, aliased to avoid conflict
import { Drawer as VaulDrawerRoot } from "@/components/CustomDrawerRoot";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GlobalBottomSheetProps {
  children: React.ReactNode;
  className?: string;
  // No isOpen, onOpenChange, snapPoints here. These are passed to VaulDrawerRoot directly.
}

const GlobalBottomSheet: React.FC<GlobalBottomSheetProps> = ({
  children,
  className,
}) => {
  // This component now *always* renders the vaul-based drawer.
  // The decision to use this component vs. a desktop sidebar is made in LayoutManager.
  return (
    <VaulDrawerRoot shouldScaleBackground={false} snapPoints={[0.5, 0.9]} initialSnap={0.5}>
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
    </VaulDrawerRoot>
  );
};

export default GlobalBottomSheet;