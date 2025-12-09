import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import FavoritesModal from "@/components/FavoritesModal";
import { FavoritesModalProvider } from "@/contexts/FavoritesModalContext";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout"; // Import useResponsiveLayout
import MobileFloatingBackButton from "@/components/MobileFloatingBackButton"; // Import new back button
import MobileFloatingMenuButton from "@/components/MobileFloatingMenuButton"; // Import new menu button
import MobileSideDrawer from "@/components/MobileSideDrawer"; // Import new side drawer

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for mobile drawer
  const layout = useResponsiveLayout();
  const isMobile = layout === "mobile";

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
        {isMobile && (
          <>
            <MobileFloatingBackButton />
            <MobileFloatingMenuButton onClick={() => setIsDrawerOpen(true)} />
            <MobileSideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
          </>
        )}
        <main className="flex-grow flex flex-col">
          {children}
        </main>
        <FavoritesModal open={favoritesModalOpen} onOpenChange={setFavoritesModalOpen} />
      </FavoritesModalProvider>
    </div>
  );
};

export default Layout;