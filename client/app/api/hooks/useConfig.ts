import { useQuery } from "@tanstack/react-query"
import { configEndpoints } from "../endpoints/config"

export const usePublicConfig = () => {
  return useQuery({
    queryKey: ["publicConfig"],
    queryFn: configEndpoints.getPublicConfig,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  })
}
