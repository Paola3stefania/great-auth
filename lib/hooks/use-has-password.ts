"use client";

import useSWR from "swr";
import { useSession } from "@/lib/auth/client";

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch");
  }
  const data = await response.json();
  return data.hasPassword || false;
};

/**
 * Custom hook to check if the current user has a password account.
 * Uses SWR for automatic caching, deduplication, and revalidation.
 * Only fetches when user is logged in.
 */
export function useHasPassword() {
  const { data: session } = useSession();
  
  const { data, error, isLoading, mutate } = useSWR<boolean>(
    session?.user ? "/api/user/has-password" : null, // Only fetch if user is logged in
    fetcher,
    {
      // Revalidate on focus (when user switches back to tab)
      revalidateOnFocus: false,
      // Revalidate on reconnect
      revalidateOnReconnect: true,
      // Don't revalidate on mount if we have cached data
      revalidateIfStale: false,
      // Cache for 5 minutes (300 seconds) - prevents multiple calls within this window
      dedupingInterval: 300000,
      // Keep data when component unmounts (for sharing across components)
      keepPreviousData: true,
    }
  );

  return {
    hasPassword: data ?? null, // Return null when not logged in or loading
    isLoading: isLoading || !session?.user,
    error,
    mutate, // Allow manual revalidation if needed (e.g., after adding password)
  };
}

