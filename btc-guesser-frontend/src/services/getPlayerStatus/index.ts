import { useQuery } from "@tanstack/react-query";
import { queryFetcher } from "../utils";

export const useGetPlayerStatus = (playerId: string) => {
  return useQuery({
    queryKey: ['player-status', playerId],
    queryFn: () => queryFetcher(`${import.meta.env.VITE_API_BASE_URL}/player-status/${playerId}`),
    enabled: !!playerId,
    refetchInterval: 5000,
  })
};
