"use client";

import React from "react";
import * as Vaul from "vaul"; // Import all exports from vaul under the alias 'Vaul'
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
  // This component now exclusively uses vaul's Drawer components for mobile behavior.
  return (
    <Vaul.Drawer.Root shouldScaleBackground={false} snapPoints={[0.5, 0.9]} initialSnap={0.5}>
      <Vaul.Drawer.Portal>
        <Vaul.Drawer.Overlay className="fixed inset-0 bg-black/20 z-40" />
        <Vaul.Drawer.Content className={cn(
          "fixed bottom-0 left-0 right-0 flex flex-col rounded-t-[10px] bg-background z-50",
          "h-[var(--vaul-drawer-height)]", // This ensures the height is controlled by snapPoints
          className
        )}>
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted-foreground/50 mt-3 mb-2" />
          <ScrollArea className="flex-1">
            {children}
          </ScrollArea>
        </Vaul.Drawer.Content>
      </Vaul.Drawer.Portal>
    </Vaul.Drawer.Root>
  );
};

export default GlobalBottomSheet;