import { useQuery } from "@tanstack/react-query"
import { queryFetcher } from "../utils"

export const useGetPrice = () => {
  return useQuery({
    queryKey: ['price'],
    queryFn: () => queryFetcher(`https://d1d64qf74g.execute-api.eu-west-1.amazonaws.com/Prod/price`)
  })
}
