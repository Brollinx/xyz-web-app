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
  if (meters < MILE_IN_METERS) return `${(meters / MILE_IN_METERS).toFixed(2)} km`;
  return `${(meters / MILE_IN_METERS).toFixed(2)} mi`;
}

interface OpeningHour {
  day: string; // e.g., "Monday", "Tuesday"
  open: string; // e.g., "09:00"
  close: string; // e.g., "17:00"
}

// Returns a string indicating if the store is open and its closing time, or "Closed".
// Also returns a boolean `isOpen` for styling purposes.
export function getStoreStatus(openingHours: OpeningHour[] | null): { statusText: string; isOpen: boolean } {
  if (!openingHours || openingHours.length === 0) {
    return { statusText: "Opened", isOpen: true }; // Assume open if no hours are specified
  }

  const now = new Date();
  const currentDayIndex = now.getDay(); // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysOfWeek[currentDayIndex];

  const todayHours = openingHours.find(oh => oh.day === currentDayName);

  if (!todayHours || !todayHours.open || !todayHours.close) {
    return { statusText: "Opened", isOpen: true }; // Assume open if today's hours are missing or malformed
  }

  try {
    const [openHour, openMinute] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);

    const openTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openHour, openMinute);
    let closeTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closeHour, closeMinute);

    // Handle overnight closing (e.g., open 22:00, close 02:00 next day)
    if (closeTime < openTime) {
      closeTime.setDate(closeTime.getDate() + 1); // Add a day to close time
    }

    const isOpen = now >= openTime && now <= closeTime;

    if (isOpen) {
      const formattedCloseTime = closeTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return { statusText: `Opened (closes at ${formattedCloseTime})`, isOpen: true };
    } else {
      return { statusText: "Closed", isOpen: false };
    }
  } catch (e) {
    console.error("Error parsing opening hours:", e);
    return { statusText: "Opened", isOpen: true }; // Fallback to open if parsing fails
  }
}