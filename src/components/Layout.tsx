import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ShoppingCart } from "lucide-react"; // Import ShoppingCart icon
import { useCart } from "@/context/CartContext"; // Import useCart hook

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { totalItems } = useCart(); // Get totalItems from cart context

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
            <Home className="h-5 w-5 mr-2" /> Home
          </Button>
        </Link>
        <Link to="/shopping-list">
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80 relative">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </Link>
      </header>
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout;