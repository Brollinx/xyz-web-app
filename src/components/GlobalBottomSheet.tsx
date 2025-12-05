import React from "react";
import { Drawer, DrawerContent, DrawerPortal, DrawerOverlay } from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface GlobalBottomSheetProps {
  children: React.ReactNode;
  className?: string;
  isMobile: boolean;
  isOpen?: boolean; // For mobile drawer control
  onOpenChange?: (open: boolean) => void; // For mobile drawer control
  snapPoints?: number[]; // For mobile drawer snap points
}

const GlobalBottomSheet: React.FC<GlobalBottomSheetProps> = ({
  children,
  className,
  isMobile,
  isOpen = true,
  onOpenChange,
  snapPoints = [0.5, 0.9],
}) => {
  if (isMobile) {
    return (
      <Drawer shouldScaleBackground={false} open={isOpen} onOpenChange={onOpenChange} snapPoints={snapPoints}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 bg-black/20 z-40" />
          <DrawerContent className={cn(
            "fixed bottom-0 left-0 right-0 mt-24 flex h-[85%] flex-col rounded-t-[10px] bg-background/90 backdrop-blur-sm z-50",
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
  }

  return (
    <div className={cn(
      "hidden md:flex fixed right-0 top-0 md:w-1/2 lg:w-2/5 h-screen overflow-y-auto bg-card text-card-foreground shadow-lg border-l border-border",
      className
    )}>
      <ScrollArea className="h-full w-full">
        {children}
      </ScrollArea>
    </div>
  );
};

export default GlobalBottomSheet;