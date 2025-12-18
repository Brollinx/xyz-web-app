import React from "react";
import { Phone, Clock } from "lucide-react";
import { cn, getStoreStatus } from "@/lib/utils";

interface OpeningHour {
  day: string;
  open: string;
  close: string;
}

interface StoreInfoDisplayProps {
  storeName: string;
  storeAddress: string;
  storePhoneNumber?: string;
  storeOpeningHours: OpeningHour[] | null;
  distance?: string | null;
  duration?: string | null;
}

const StoreInfoDisplay: React.FC<StoreInfoDisplayProps> = ({
  storeName,
  storeAddress,
  storePhoneNumber,
  storeOpeningHours,
  distance,
  duration,
}) => {
  const { statusText: storeStatusText, isOpen: isStoreOpen } = getStoreStatus(storeOpeningHours);

  return (
    <div className="space-y-2 text-center md:text-left">
      <h2 className="font-bold text-xl md:text-2xl">{storeName}</h2>
      <p className="text-sm md:text-base text-gray-600">{storeAddress}</p>
      {storeOpeningHours && (
        <p className={cn("text-sm md:text-base font-semibold flex items-center justify-center md:justify-start gap-1", isStoreOpen ? "text-green-600" : "text-red-600")}>
          <Clock className="h-4 w-4" /> {storeStatusText}
        </p>
      )}
      {storePhoneNumber && (
        <a href={`tel:${storePhoneNumber}`} className="text-sm md:text-base text-blue-600 hover:underline flex items-center justify-center md:justify-start gap-1">
          <Phone className="h-4 w-4" /> {storePhoneNumber}
        </a>
      )}
      {(distance || duration) && (
        <p className="text-sm md:text-base text-gray-700 mt-2">
          {duration && <span>{duration}</span>}
          {distance && duration && <span> • </span>}
          {distance && <span>{distance}</span>}
        </p>
      )}
    </div>
  );
};

export default StoreInfoDisplay;