import { useGeolocation } from '@/hooks/useGeolocation';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Compass } from 'lucide-react';

const LocationPermissionBanner = () => {
  const { status, retry } = useGeolocation();

  if (status !== 'denied' && status !== 'error') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-md rounded-lg bg-destructive/90 p-4 text-destructive-foreground shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-6 w-6 flex-shrink-0" />
          <div>
            <p className="font-bold">Location Services Unavailable</p>
            {status === 'denied' ? (
              <p className="mt-1 text-sm">
                Please enable location access in your browser settings to see distances and get directions.
              </p>
            ) : (
              <p className="mt-1 text-sm">
                We couldn't determine your location. Please check your connection and try again.
              </p>
            )}
          </div>
        </div>
        {status === 'error' && (
          <Button onClick={retry} variant="outline" size="sm" className="flex-shrink-0 border-destructive-foreground text-destructive-foreground hover:bg-destructive hover:text-destructive-foreground">
            <Compass className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </div>
    </div>
  );
};

export default LocationPermissionBanner;