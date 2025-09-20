import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 shadow-md flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" className="text-primary-foreground hover:bg-primary/80">
            <Home className="h-5 w-5 mr-2" /> Home
          </Button>
        </Link>
        {/* You can add more navigation items or a logo here if needed */}
      </header>
      <main className="flex-grow flex flex-col">
        {children}
      </main>
    </div>
  );
};

export default Layout;