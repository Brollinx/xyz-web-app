import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import FavoritesModal from "@/components/FavoritesModal";
import { FavoritesModalProvider } from "@/contexts/FavoritesModalContext";
import MenuSheet from "@/components/MenuSheet";
import TopLeftControls from "@/components/TopLeftControls";
import MobileFooterNav from "@/components/MobileFooterNav";
import { User as AuthUser } from '@supabase/supabase-js';
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { cn } from "@/lib/utils";
import { useProximityMonitor } from "@/hooks/useProximityMonitor";
import NearbyStorePrompt from "@/components/NearbyStorePrompt";
import { useProductReminderMonitor } from "@/hooks/useProductReminderMonitor";
import { toast } from "sonner";
// Removed: import { MapLayoutProvider } from "@/contexts/MapLayoutContext"; // New import

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [favoritesModalOpen, setFavoritesModalOpen] = useState(false);
  const [menuSheetOpen, setMenuSheetOpen] = useState(false);
  const layout = useResponsiveLayout();

  // Integrate useProximityMonitor
  const {
    nearbyStoreToPrompt,
    dismissedNearbyStores,
    dismissPrompt,
    clearDismissedStore,
    clearAllDismissedStores,
    loadingLocation,
    locationStatus,
    refreshLocation,
  } = useProximityMonitor(user);

  // Integrate useProductReminderMonitor
  const {
    reminders,
    notifyEnabled: productRemindersEnabled,
    dismissReminder,
    clearAllReminders,
  } = useProductReminderMonitor(user);

  useEffect(() => {
    const handleAuthStateChange = async (_event: string, session: any) => {
      const authUser = session?.user || null;
      setUser(authUser);
      setLoadingAuth(false);

      if (authUser) {
        // If user is logged in and tries to access /login or /signup, redirect to home
        if (location.pathname === "/login" || location.pathname === "/signup") {
          navigate("/");
        }
      }
      // No profile fetching or creation logic here, as per new requirements.
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    // Initial check for user session on mount
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error getting session:", error);
        setUser(null);
      } else {
        setUser(session?.user || null);
      }
      setLoadingAuth(false);
    };
    checkSession();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const showBackButton =
    location.pathname.startsWith("/route") ||
    location.pathname.startsWith("/store") ||
    location.pathname.startsWith("/profile") ||
    location.pathname.startsWith("/settings");

  const isMobile = layout === "mobile";

  const handleViewNearbyStore = (storeId: string) => {
    dismissPrompt(storeId, false);
    navigate(`/store/${storeId}`);
  };

  // Hard logout function to be passed to children
  const handleHardLogout = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    if (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out.");
    } else {
      toast.success("You have been signed out.");
      setUser(null); // Manually reset user state
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <FavoritesModalProvider setFavoritesModalOpen={setFavoritesModalOpen}>
        <TopLeftControls onOpenMenu={() => setMenuSheetOpen(true)} showBackButton={showBackButton} />
        <MenuSheet
          isOpen={menuSheetOpen}
          onOpenChange={setMenuSheetOpen}
          user={user}
          loadingAuth={loadingAuth}
          onLogout={handleHardLogout} // Pass the hard logout function
          dismissedNearbyStores={dismissedNearbyStores}
          clearDismissedStore={clearDismissedStore}
          clearAllDismissedStores={clearAllDismissedStores}
        />
        <main className={cn("flex-grow flex flex-col", isMobile && "pb-16")}>
          {children}
        </main>
        <FavoritesModal open={favoritesModalOpen} onOpenChange={setFavoritesModalOpen} />
        {isMobile && <MobileFooterNav user={user} loadingAuth={loadingAuth} />}

        <NearbyStorePrompt
          store={nearbyStoreToPrompt}
          onViewStore={handleViewNearbyStore}
          onDismiss={dismissPrompt}
        />
      </FavoritesModalProvider>
    </div>
  );
};

export default Layout;