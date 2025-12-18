"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface StoreLocationInfo {
  id: string;
  store_name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface NearbyStorePromptProps {
  store: StoreLocationInfo | null;
  onViewStore: (storeId: string) => void;
  onDismiss: (storeId: string, addToMenu: boolean) => void;
}

const NearbyStorePrompt: React.FC<NearbyStorePromptProps> = ({ store, onViewStore, onDismiss }) => {
  if (!store) return null;

  return (
    <Dialog open={!!store} onOpenChange={() => onDismiss(store.id, false)}> {/* Dismiss if dialog is closed by user */}
      <DialogContent className="sm:max-w-[425px] z-[1000]"> {/* Increased z-index to ensure it's above other elements */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-brand-accent" />
            You're near a store!
          </DialogTitle>
          <DialogDescription>
            You're currently near <span className="font-semibold text-primary dark:text-foreground">{store.store_name}</span>.
            Would you like to view their products?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onDismiss(store.id, true)} className="w-full sm:w-auto">
            Dismiss & Add to Menu
          </Button>
          <Button onClick={() => onViewStore(store.id)} className="w-full sm:w-auto">
            View Store
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NearbyStorePrompt;