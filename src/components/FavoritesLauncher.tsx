"use client";

import React, { useState } from "react";
import FavoritesModal from "@/components/FavoritesModal";
import FavoritesButton from "@/components/FavoritesButton";

const FavoritesLauncher: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating favorites button */}
      <div className="fixed z-[999] bottom-5 right-5">
        <FavoritesButton className="h-11 w-11" onClick={() => setOpen(true)} />
      </div>

      {/* Favorites popup (shows list and totals) */}
      <FavoritesModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default FavoritesLauncher;