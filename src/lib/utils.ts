import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Haversine formula to calculate distance between two lat/lng points in meters
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000; // Radius of Earth in meters
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Formats distance based on rules: <10m, meters, km, or miles
export function formatDistance(meters: number): string {
  const MILE_IN_METERS = 1609.34;
  if (meters < 10) return '< 10 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  if (meters < MILE_IN_METERS) return `${(meters / 1000).toFixed(2)} km`;
  return `${(meters / MILE_IN_METERS).toFixed(2)} mi`;
}