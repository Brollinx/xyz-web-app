import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import FloatingMenu from "@/components/FloatingMenu";
import FavoritesModal from "@/components/FavoritesModal";
import { FavoritesModalProvider } from "@/contexts/FavoritesModalContext";
import MenuSheet from "@/components/MenuSheet"; // Import the new MenuSheet

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false); // State for MenuSheet

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
        {/* Floating hamburger menu button */}
        <FloatingMenu onOpen={() => setMenuSheetOpen(true)} />
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