"use client";

import React from "react";
import { Drawer as DrawerPrimitive } from "vaul"; // Explicitly import DrawerPrimitive from vaul
import type { DrawerRootProps } from "vaul"; // Import the specific type for Drawer.Root props
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GlobalBottomSheetProps {
  children: React.ReactNode;
  className?: string;
}

const GlobalBottomSheet: React.FC<GlobalBottomSheetProps> = ({
  children,
  className,
}) => {
  // Explicitly define the props object with the correct type from vaul
  const rootProps: DrawerRootProps = {
    shouldScaleBackground: false,
    snapPoints: [0.5, 0.9],
    initialSnap: 0.5,
  };

  return (
    <DrawerPrimitive.Root {...rootProps}>
      <DrawerPrimitive.Portal>
        <DrawerPrimitive.Overlay className="fixed inset-0 bg-black/20 z-40" />
        <DrawerPrimitive.Content className={cn(
          "fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[10px] bg-background z-50",
          "h-[var(--vaul-drawer-height)]", // This ensures the height is controlled by snapPoints
          className
        )}>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3 mb-2" />
          <ScrollArea className="flex-1">
            {children}
          </ScrollArea>
        </DrawerPrimitive.Content>
      </DrawerPrimitive.Portal>
    </DrawerPrimitive.Root>
  );
};

export default GlobalBottomSheet;