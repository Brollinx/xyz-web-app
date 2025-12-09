"use client";

import React from "react";
import { useNavigate } from "react-router-dom";

interface MobileFloatingBackButtonProps {
  className?: string;
}

const MobileFloatingBackButton: React.FC<MobileFloatingBackButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/"); // Fallback to home if no history
    }
  };

  return (
    <div className={className || "floating-back-btn"} onClick={handleBack}>
      ←
    </div>
  );
};

export default MobileFloatingBackButton;