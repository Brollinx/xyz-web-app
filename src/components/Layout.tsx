import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ChevronLeft, Heart } from "lucide-react"; // Import Heart icon
import { supabase } from "@/lib/supabase"; // Import supabase client
import { ThemeToggle } from "@/components/ThemeToggle"; // Import ThemeToggle

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  // The isLoggedIn state is no longer used to conditionally render the Favorites link,
  // but it's kept here for potential future use or other parts of the app.
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

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

  const showHeader = location.pathname !== "/search-results"; // Hide header on search results page

  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && (
        <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
          <div className="flex items-center">
            {location.pathname !== "/" && ( // Show back/home button only if not on root
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 mr-2" onClick={() => navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            {location.pathname !== "/" && (
              <Link to="/">
                <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                  <Home className="h-5 w-5 mr-2" /> Home
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/favorites">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                <Heart className="h-5 w-5 mr-2" /> Favorites
              </Button>
            </Link>
            <ThemeToggle />
          </div>
        </header>
      )}
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout;