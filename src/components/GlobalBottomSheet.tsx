"use client";

import React from "react";
import { Drawer } from "vaul"; // Import the main Drawer object from vaul
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
  // Removed explicit type annotation for rootProps to allow TypeScript to infer the correct type
  // directly from the Drawer.Root component, resolving the 'initialSnap' error.
  const rootProps = {
    shouldScaleBackground: false,
    snapPoints: [0.5, 0.9],
    initialSnap: 0.5,
  };

  return (
    <Drawer.Root {...rootProps}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/20 z-40" />
        <Drawer.Content className={cn(
          "fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[10px] bg-background z-50",
          "h-[var(--vaul-drawer-height)]", // This ensures the height is controlled by snapPoints
          className
        )}>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3 mb-2" />
          <ScrollArea className="flex-1">
            {children}
          </ScrollArea>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};

export default GlobalBottomSheet;