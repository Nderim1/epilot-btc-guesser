import { useQuery } from "@tanstack/react-query"
import { queryFetcher } from "../utils"

export const useGetPrice = () => {
  return useQuery({
    queryKey: ['price'],
    queryFn: () => queryFetcher(`${import.meta.env.VITE_API_BASE_URL}/price`)
  })
}
