import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import FloatingMenu from "@/components/FloatingMenu";
import FavoritesModal from "@/components/FavoritesModal"; // Import FavoritesModal
import { FavoritesModalProvider } from "@/contexts/FavoritesModalContext"; // Import the new context provider

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false); // State for FavoritesModal

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
        {/* Floating hamburger menu - now inside the provider */}
        <FloatingMenu />
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