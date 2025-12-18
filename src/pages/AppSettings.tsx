"use client";

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Mail, Phone, Trash2, AlertCircle } from "lucide-react"; // Removed LogOut icon
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch"; // Import Switch component
import { Label } from "@/components/ui/label"; // Import Label component

const LOCAL_STORAGE_AUTO_OPEN_KEY = "xyz_auto_open_nearby_stores";
const LOCAL_STORAGE_NOTIFY_FAILED_SEARCHES_KEY = "xyz_notify_failed_searches"; // New key

interface CustomerProfile {
  full_name: string | null;
  email: string | null;
  phone_number: string | null;
  auto_open_nearby_stores: boolean | null;
  notify_failed_searches: boolean | null; // Add new field
}

const AppSettings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [userAuthId, setUserAuthId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoOpenEnabled, setAutoOpenEnabled] = useState<boolean>(true);
  const [notifyFailedSearchesEnabled, setNotifyFailedSearchesEnabled] = useState<boolean>(true); // New state for the toggle

  useEffect(() => {
    const checkUserAndFetchProfile = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("You need to be logged in to access app settings.");
        navigate("/login");
        return;
      }

      setUserAuthId(user.id);

      try {
        const { data, error } = await supabase
          .from("profiles") // Changed from customer_profiles to profiles
          .select("full_name, email, phone_number, auto_open_nearby_stores, notify_failed_searches") // Fetch new field
          .eq("auth_id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        setAutoOpenEnabled(data.auto_open_nearby_stores ?? true);
        setNotifyFailedSearchesEnabled(data.notify_failed_searches ?? true); // Set initial state for new toggle
      } catch (error) {
        console.error("Error fetching profile for settings:", error);
        toast.error("Failed to load your profile for settings.");
        setProfile(null);
        // Fallback to local storage if profile fetch fails or no profile
        const storedAutoOpenPreference = localStorage.getItem(LOCAL_STORAGE_AUTO_OPEN_KEY);
        setAutoOpenEnabled(storedAutoOpenPreference === "false" ? false : true);
        const storedNotifyPreference = localStorage.getItem(LOCAL_STORAGE_NOTIFY_FAILED_SEARCHES_KEY); // Load new preference
        setNotifyFailedSearchesEnabled(storedNotifyPreference === "false" ? false : true);
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetchProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/login"); // Redirect if user signs out
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  // Handle changes to the auto-open toggle
  const handleAutoOpenToggle = async (checked: boolean) => {
    setAutoOpenEnabled(checked);
    localStorage.setItem(LOCAL_STORAGE_AUTO_OPEN_KEY, String(checked)); // Always update local storage

    if (userAuthId) {
      try {
        const { error } = await supabase
          .from("profiles") // Update the main profiles table
          .update({ auto_open_nearby_stores: checked })
          .eq("auth_id", userAuthId);

        if (error) throw error;
        toast.success("Preference saved!");
        // Update local profile state immediately
        setProfile(prev => prev ? { ...prev, auto_open_nearby_stores: checked } : null);
      } catch (error) {
        console.error("Error updating auto_open_nearby_stores preference:", error);
        toast.error("Failed to save preference to your profile.");
        // Revert UI state if save fails
        setAutoOpenEnabled(!checked);
      }
    }
  };

  // Handle changes to the notify failed searches toggle
  const handleNotifyFailedSearchesToggle = async (checked: boolean) => {
    setNotifyFailedSearchesEnabled(checked);
    localStorage.setItem(LOCAL_STORAGE_NOTIFY_FAILED_SEARCHES_KEY, String(checked)); // Update local storage

    if (userAuthId) {
      try {
        const { error } = await supabase
          .from("profiles")
          .update({ notify_failed_searches: checked }) // Update new field
          .eq("auth_id", userAuthId);

        if (error) throw error;
        toast.success("Preference saved!");
        // Update local profile state immediately
        setProfile(prev => prev ? { ...prev, notify_failed_searches: checked } : null);
      } catch (error) {
        console.error("Error updating notify_failed_searches preference:", error);
        toast.error("Failed to save preference to your profile.");
        // Revert UI state if save fails
        setNotifyFailedSearchesEnabled(!checked);
      }
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-customer-account', {
        method: 'POST',
      });

      if (error) {
        console.error("Error deleting account:", error);
        toast.error(`Failed to delete account: ${error.message || 'Unknown error'}`);
      } else {
        toast.success("Your account has been successfully deleted.");
        await supabase.auth.signOut(); // Ensure local session is cleared
        navigate("/login");
      }
    } catch (error) {
      console.error("Unhandled error during account deletion:", error);
      toast.error("An unexpected error occurred during account deletion.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-slate-950">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-gray-700 dark:text-gray-300">Loading settings...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background dark:bg-slate-950 p-4 text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h1>
        <p className="text-gray-700 dark:text-gray-300 mb-6">You must be logged in to view app settings.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-background dark:bg-slate-950 p-4">
      <div className="w-full max-w-md text-center space-y-6 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">App Settings</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Manage your account and app preferences</p>
      </div>

      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <span className="text-lg font-medium">{profile.full_name || "Not set"}</span>
          </div>
          {profile.email && (
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg">{profile.email}</span>
            </div>
          )}
          {profile.phone_number && (
            <div className="flex items-center space-x-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg">{profile.phone_number}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-xl">App Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="auto-open-nearby" className="text-lg font-medium">
              Automatically open nearby stores
            </Label>
            <Switch
              id="auto-open-nearby"
              checked={autoOpenEnabled}
              onCheckedChange={handleAutoOpenToggle}
            />
          </div>
          <div className="flex items-center justify-between"> {/* New toggle */}
            <Label htmlFor="notify-failed-searches" className="text-lg font-medium">
              Notify me when nearby stores have products I searched for
            </Label>
            <Switch
              id="notify-failed-searches"
              checked={notifyFailedSearchesEnabled}
              onCheckedChange={handleNotifyFailedSearchesToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md bg-card text-card-foreground shadow-lg mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col space-y-4">
            {/* Removed Sign Out button from here */}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full" disabled={isDeleting}>
                  {isDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center text-red-600">
                    <AlertCircle className="mr-2 h-6 w-6" /> Are you absolutely sure?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {isDeleting ? "Deleting..." : "Delete My Account"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AppSettings;