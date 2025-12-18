"use client";

import React from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

const Signup = () => {
  const navigate = useNavigate();

  // The Layout.tsx component will handle redirects for authenticated users.

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">Sign Up</h1>
        <Auth
          supabaseClient={supabase}
          providers={[]} // Disable all providers
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: 'hsl(var(--primary))',
                  brandAccent: 'hsl(var(--primary-foreground))',
                },
              },
            },
          }}
          theme="light" // Theme will be handled by next-themes, but Auth UI needs a base
          redirectTo={window.location.origin} // Redirects back to the app's origin
          view="sign_up" // Explicitly set view to 'sign_up' for registration
        />
        <p className="text-center text-sm text-muted-foreground mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;