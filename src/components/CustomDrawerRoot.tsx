"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

// This component acts as a wrapper to correctly type the Drawer.Root from vaul
// to ensure it accepts props like `initialSnap`.
const CustomDrawerRoot = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} {...props} />
);
CustomDrawerRoot.displayName = "CustomDrawerRoot";

export { CustomDrawerRoot as Drawer };