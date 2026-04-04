import { useQuery } from "@tanstack/react-query";
import { fetchMapSettings, type MapSettings } from "@/lib/adminApi";

const QUERY_KEY = ["mapSettings"];

export function useMapSettings(enabled = true) {
  return useQuery<MapSettings, Error>({
    queryKey: QUERY_KEY,
    queryFn: fetchMapSettings,
    enabled,
    staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
    gcTime: 10 * 60 * 1000,   // Keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: "always", // Refetch on mount if stale, but uses cache if fresh
  });
}

// For prefetching (optional - call in parent component)
export { QUERY_KEY };
