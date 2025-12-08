"use client";

import React, { createContext, useContext } from 'react';

interface FavoritesModalContextType {
  openFavoritesModal: (open: boolean) => void;
}

const FavoritesModalContext = createContext<FavoritesModalContextType | undefined>(undefined);

export const useFavoritesModal = () => {
  const context = useContext(FavoritesModalContext);
  if (!context) {
    throw new Error('useFavoritesModal must be used within a FavoritesModalProvider');
  }
  return context;
};

interface FavoritesModalProviderProps {
  children: React.ReactNode;
  setFavoritesModalOpen: (open: boolean) => void;
}

export const FavoritesModalProvider: React.FC<FavoritesModalProviderProps> = ({ children, setFavoritesModalOpen }) => {
  const value = { openFavoritesModal: setFavoritesModalOpen };
  return (
    <FavoritesModalContext.Provider value={value}>
      {children}
    </FavoritesModalContext.Provider>
  );
};