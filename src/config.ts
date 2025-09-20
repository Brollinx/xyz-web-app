// This file will hold your API keys and other configuration settings.
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
export const SUPABASE_URL = "https://mcdmcxjoxirayfwmyihb.supabase.co"; // Your Supabase Project URL
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jZG1jeGpveGlyYXlmd215aWhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MDAxOTUsImV4cCI6MjA2Nzk3NjE5NX0.5R6N8N2T7NW-nrZJ-ojL3Fgg6eQd6mXuo79rVdLpYVs"; // Your Supabase Anon Key

if (!MAPBOX_TOKEN) {
  console.error("Mapbox Token is not set in your environment variables (.env file). Please add VITE_MAPBOX_TOKEN=... to your .env file.");
}