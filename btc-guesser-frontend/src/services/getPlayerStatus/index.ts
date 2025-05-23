import { useQuery } from "@tanstack/react-query";
import { queryFetcher } from "../utils";

export const useGetPlayerStatus = (playerId: string) => {
  return useQuery({
    queryKey: ['player-status', playerId],
    queryFn: () => queryFetcher(`https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/player-status/${playerId}`),
    enabled: !!playerId,
    refetchInterval: 5000,
  })
};
