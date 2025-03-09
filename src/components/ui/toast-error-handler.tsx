import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { StorageManager } from "@/components/storage/StorageManager";

/**
 * Component that provides global error handling for storage issues
 * and displays user-friendly toast notifications
 */
export function StorageErrorHandler() {
  const { toast } = useToast();
  const [hasStorageError, setHasStorageError] = useState(false);

  useEffect(() => {
    // Check if localStorage is available
    const isStorageAvailable = StorageManager.isLocalStorageAvailable();

    if (!isStorageAvailable && !hasStorageError) {
      setHasStorageError(true);
      toast({
        title: "Storage Warning",
        description:
          "Your browser storage appears to be disabled or restricted. The app will continue to work, but your data may not persist between sessions.",
        variant: "destructive",
        duration: 10000,
      });
    }

    // Set up global error handler for storage errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call the original console.error
      originalConsoleError(...args);

      // Check if this is a storage-related error
      const errorString = args.join(" ");
      if (
        (errorString.includes("localStorage") ||
          errorString.includes("storage") ||
          errorString.includes("quota")) &&
        !hasStorageError
      ) {
        setHasStorageError(true);
        toast({
          title: "Storage Error",
          description:
            "There was a problem saving your data. The app will continue to work, but some changes may not persist. Try clearing browser cache or using a different browser.",
          variant: "destructive",
          duration: 10000,
        });
      }
    };

    // Clean up
    return () => {
      console.error = originalConsoleError;
    };
  }, [toast, hasStorageError]);

  return null; // This component doesn't render anything
}
