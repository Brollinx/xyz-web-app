import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ChevronLeft, ShoppingCart } from "lucide-react"; // Import ShoppingCart icon
import ShoppingCartSheet from "./ShoppingCartSheet"; // Import the ShoppingCartSheet
import { useShoppingCart } from "@/hooks/useShoppingCart"; // Import the hook to get item count

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items } = useShoppingCart(); // Get items from the shopping cart hook

  const showBackButton = location.pathname !== "/";
  const showHomeButton = location.pathname !== "/"; // Hide Home button on the root path

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
        <div className="flex items-center">
          {showBackButton && (
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 mr-2" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
          {showHomeButton && ( // Conditionally render the Home button
            <Link to="/">
              <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
                <Home className="h-5 w-5 mr-2" /> Home
              </Button>
            </Link>
          )}
        </div>
        <div className="relative">
          <ShoppingCartSheet>
            <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Button>
          </ShoppingCartSheet>
        </div>
      </header>
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout;