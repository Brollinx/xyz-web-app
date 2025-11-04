// This file will hold your API keys and other configuration settings.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
export const SUPABASE_URL = "https://sydvcptbzzytwllxnmhc.supabase.co"; // Your Supabase Project URL
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5ZHZjcHRienp5dHdsbHhubWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMzk2NTYsImV4cCI6MjA3NTkxNTY1Nn0.WeYjb7uCx1qakHKfRvpjCcm3qmHBSwLVLEr2zUEKQ1Q"; // Your Supabase Anon Key

if (!MAPBOX_TOKEN) {
  console.error("Mapbox Token is not set in your environment variables (.env file). Please add VITE_MAPBOX_TOKEN=... to your .env file.");
}