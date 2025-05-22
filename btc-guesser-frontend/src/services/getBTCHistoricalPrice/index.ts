import { useQuery } from "@tanstack/react-query"
import { queryFetcher } from "../utils";
import { ChartData } from 'chart.js';

type CoinbaseCandle = [
  timestamp: number,
  low: number,
  high: number,
  open: number,
  close: number,
  volume: number
];

interface UseGetBTCHistoricalPriceReturn {
  data: ChartData<'line'> | undefined;
  isLoading: boolean;
  error: Error | null;
}

export const useGetBTCHistoricalPrice = (): UseGetBTCHistoricalPriceReturn => {
  const { data, isLoading, error } = useQuery<CoinbaseCandle[], Error, ChartData<'line'>>({
    queryKey: ['btc-price'],
    queryFn: () => queryFetcher(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400&start=2025-05-01T00:00:00Z&end=${new Date().toISOString()}`),
    select: (apiData: CoinbaseCandle[]): ChartData<'line'> => {
      if (!Array.isArray(apiData)) {
        console.error('API did not return an array:', apiData);
        return {
          labels: [],
          datasets: [{
            label: 'BTC Price',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
          }]
        };
      }
      const chronologicalData = [...apiData].reverse();

      const labels = chronologicalData.map(candle => {
        const date = new Date(candle[0] * 1000);
        return date.toLocaleDateString('de-DE');
      });

      const closePrices = chronologicalData.map(candle => candle[4]);

      return {
        labels,
        datasets: [
          {
            label: 'BTC Close Price',
            data: closePrices,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1,
          },
        ],
      };
    },
  });

  return { data, isLoading, error: error || null };
}