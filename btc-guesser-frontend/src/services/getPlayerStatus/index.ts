import { useMutation, useQuery } from "@tanstack/react-query";
import { queryFetcher } from "../utils";

export const useGetPlayerStatus = (playerId: string) => {
  return useQuery({
    queryKey: ['player-status', playerId],
    queryFn: () => queryFetcher(`https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/player-status/${playerId}`),
    enabled: !!playerId
  })
  // const mutation = useMutation({
  //   mutationFn: (playerId: string) => {
  //     if (!playerId || playerId.trim() === '') {
  //       throw new Error('Player ID is empty. Cannot fetch player status.');
  //     }

  //     return queryFetcher(`https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/player-status/${playerId}`)
  //   }
  // })

  // return mutation;
};
