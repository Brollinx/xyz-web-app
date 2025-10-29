import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ChevronLeft } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const showBackButton = location.pathname !== "/";
  const showHomeButton = location.pathname !== "/"; // Only show Home button if not on home page

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 mr-2" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {showHomeButton && ( // Conditionally render Home button
            <Link to="/">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                <Home className="h-5 w-5 mr-2" /> Home
              </Button>
            </Link>
          )}
        </div>
        {/* You can add more navigation items or a logo here if needed */}
      </header>
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout;