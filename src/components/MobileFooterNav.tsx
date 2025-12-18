"use client";

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Store, Sparkles, User, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { User as AuthUser } from '@supabase/supabase-js';

interface MobileFooterNavProps {
  user: AuthUser | null;
  loadingAuth: boolean;
}

const MobileFooterNav: React.FC<MobileFooterNavProps> = ({ user, loadingAuth }) => {
  const location = useLocation();

  const navItems = [
    {
      name: "Home",
      icon: Home,
      path: "/",
    },
    {
      name: "Nearby",
      icon: Store,
      path: "/nearby-stores",
    },
    {
      name: "Featured",
      icon: Sparkles,
      path: "/featured-products",
    },
    {
      name: user ? "Profile" : "Login",
      icon: user ? User : LogIn,
      path: user ? "/profile" : "/login",
    },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 z-50",
      "bg-card border-t border-border shadow-lg",
      "flex justify-around items-center h-16 md:hidden"
    )}>
      {navItems.map((item) => (
        <Button
          key={item.name}
          variant="ghost"
          className={cn(
            "flex flex-col items-center justify-center h-full w-1/4 text-xs gap-1",
            "font-semibold",
            "text-primary dark:text-foreground",
            "hover:text-primary dark:hover:text-foreground"
          )}
          asChild
          disabled={loadingAuth && (item.name === "Login" || item.name === "Profile")}
        >
          <Link to={item.path}>
            {loadingAuth && (item.name === "Login" || item.name === "Profile") ? (
              <item.icon className="h-5 w-5 animate-pulse" />
            ) : (
              <item.icon className="h-5 w-5" />
            )}
            <span>{item.name}</span>
          </Link>
        </Button>
      ))}
    </div>
  );
};

export default MobileFooterNav;