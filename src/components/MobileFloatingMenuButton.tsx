"use client";

import React from "react";

interface MobileFloatingMenuButtonProps {
  onClick: () => void;
  className?: string;
}

const MobileFloatingMenuButton: React.FC<MobileFloatingMenuButtonProps> = ({ onClick, className }) => {
  return (
    <div className={className || "floating-menu-btn"} onClick={onClick}>
      ☰
    </div>
  );
};

export default MobileFloatingMenuButton;