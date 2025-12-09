import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import FavoritesModal from "@/components/FavoritesModal";
import { FavoritesModalProvider } from "@/contexts/FavoritesModalContext";
import MenuSheet from "@/components/MenuSheet";
import TopLeftControls from "@/components/TopLeftControls"; // Import the new TopLeftControls component

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsLoggedIn(!!user);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <FavoritesModalProvider setFavoritesModalOpen={setFavoritesModalOpen}>
        {/* Top-left controls (Menu and Back buttons) */}
        <TopLeftControls onOpenMenu={() => setMenuSheetOpen(true)} />
        {/* The actual menu sheet/drawer */}
        <MenuSheet isOpen={menuSheetOpen} onOpenChange={setMenuSheetOpen} />
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        {/* Render FavoritesModal here, controlled by context */}
        <FavoritesModal open={favoritesModalOpen} onOpenChange={setFavoritesModalOpen} />
      </FavoritesModalProvider>
    </div>
  );
};

export default Layout;