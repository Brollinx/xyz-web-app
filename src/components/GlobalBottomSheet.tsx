"use client";

import React from "react";
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GlobalBottomSheetProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean; // For mobile drawer control
  onOpenChange?: (open: boolean) => void; // For mobile drawer control
  snapPoints?: number[]; // For mobile drawer snap points
}

const GlobalBottomSheet: React.FC<GlobalBottomSheetProps> = ({
  children,
  className,
  isOpen = true,
  onOpenChange,
  snapPoints = [0.5, 0.9], // Default to half-screen and almost full-screen
}) => {
  return (
    <Drawer shouldScaleBackground={false} open={isOpen} onOpenChange={onOpenChange} snapPoints={snapPoints}>
      <DrawerPortal>
        <DrawerOverlay className="fixed inset-0 bg-black/20 z-40" />
        <DrawerContent className={cn(
          "fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[10px] bg-background z-50", // Solid background, no fixed height
          className
        )}>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3 mb-2" />
          <ScrollArea className="flex-1">
            {children}
          </ScrollArea>
        </DrawerContent>
      </DrawerPortal>
    </Drawer>
  );
};

export default GlobalBottomSheet;