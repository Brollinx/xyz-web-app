"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const checkInitialUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
      setLoadingAuth(false);
    };
    checkInitialUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoadingAuth(false);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    if (error) {
      console.error("Error signing out:", error);
      toast.error("Failed to sign out.");
    } else {
      toast.success("You have been signed out.");
      setUser(null);
      navigate("/");
    }
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-gray-700 dark:text-gray-300">Checking authentication status...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background dark:bg-slate-950 p-4">
      <div className="w-full max-w-md text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">Authentication Status</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Manage your session</p>
      </div>

      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader className="flex flex-col items-center">
          <CardTitle className="text-2xl font-bold">
            {user ? "You are logged in" : "You are not logged in"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <p className="text-center text-muted-foreground">
              User ID: {user.id.substring(0, 8)}...
            </p>
          )}
          {user ? (
            <Button onClick={handleSignOut} className="w-full" variant="outline">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          ) : (
            <Button onClick={() => navigate("/login")} className="w-full">
              Go to Login / Sign Up
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;