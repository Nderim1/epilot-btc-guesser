import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import TrendChart from './components/TrendChart';
import Notification, { NotificationType } from './components/Notification';
import { ChartOptions } from 'chart.js';
import { useGetBTCHistoricalPrice } from './services/getBTCHistoricalPrice';
import { useSetGuess } from './services/setGuess';

const initialChartOptions: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: 'Bitcoin Price Trend',
    },
  },
  scales: {
    y: {
      beginAtZero: false
    }
  }
};

const App = (): JSX.Element => {
  const [playerName, setPlayerName] = useState('');
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);
  const { data: btcHistoricalPriceData, isLoading: btcHistoricalPriceLoading, error: btcHistoricalPriceError } = useGetBTCHistoricalPrice();
  const guessMutation = useSetGuess();
  const [isCurrentPriceLoading, setIsCurrentPriceLoading] = useState(true);
  const [currentBtcPrice, setCurrentBtcPrice] = useState<string | null>(null);
  const [guessAttempted, setGuessAttempted] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentBtcPrice('42,069.69');
      setIsCurrentPriceLoading(false);
    }, 2000);

    const handleShowAppNotification = (event: CustomEvent<{ message: string; type: NotificationType }>) => {
      setNotification({ message: event.detail.message, type: event.detail.type });
    };
    window.addEventListener('showAppNotification', handleShowAppNotification as EventListener);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('showAppNotification', handleShowAppNotification as EventListener);
    };
  }, []);

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleGuess = async (guessDirection: string) => {
    if (playerName.trim() === '') {
      showNotification('Player name cannot be empty!', 'error');
      return;
    }
    setGuessAttempted(guessDirection);
    await guessMutation.mutateAsync({ playerId: playerName, guess: guessDirection });
    setGuessAttempted(null);
  };

  return (
    <div className='flex flex-col gap-4 items-center justify-center min-h-screen p-4 relative'>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      <h1 className='text-5xl font-bold text-center'>Bitcoin Price Guesser</h1>
      <div className='flex gap-2 items-center h-6'>
        <span>Current BTC price: </span>
        {isCurrentPriceLoading ? (
          <ArrowPathIcon className='animate-spin h-5 w-5 text-gray-500' />
        ) : (
          <span>${currentBtcPrice}</span>
        )}
      </div>
      <div className='w-full max-w-2xl my-2 min-h-[280px] flex items-center justify-center'>
        {btcHistoricalPriceLoading && <ArrowPathIcon className='animate-spin h-5 w-5 text-gray-500' />}
        {btcHistoricalPriceError && <p className="text-red-500">Error loading chart data: {btcHistoricalPriceError.message}</p>}
        {btcHistoricalPriceData && !btcHistoricalPriceLoading && !btcHistoricalPriceError && (
          <TrendChart data={btcHistoricalPriceData} options={initialChartOptions} />
        )}
      </div>

      <div className='flex flex-col sm:flex-row gap-2 items-center'>
        <span>Player name:</span>
        <input
          type="text"
          className='border border-gray-300 rounded px-2 py-1'
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          disabled={guessMutation.isPending}
        />
      </div>
      <div className='flex gap-4 items-center'>
        <span>Guess the next price movement:</span>
        <button
          className='flex items-center justify-center px-4 py-1 w-24 bg-green-400 text-white rounded hover:bg-green-600 disabled:opacity-50'
          onClick={() => handleGuess('up')}
          disabled={guessMutation.isPending}
        >
          {guessMutation.isPending && guessAttempted === 'up' ? <ArrowPathIcon className='animate-spin h-5 w-5' /> : <><ArrowUpIcon className='h-5 w-5 mr-2' /> UP</>}
        </button>
        <button
          className='flex items-center justify-center px-4 py-1 w-24 bg-red-400 text-white rounded hover:bg-red-600 disabled:opacity-50'
          onClick={() => handleGuess('down')}
          disabled={guessMutation.isPending}
        >
          {guessMutation.isPending && guessAttempted === 'down' ? <ArrowPathIcon className='animate-spin h-5 w-5' /> : <><ArrowDownIcon className='h-5 w-5 mr-2' /> DOWN</>}
        </button>
      </div>
      <div className='flex gap-2 items-center'>
        <span>Score: 0</span>
      </div>
    </div>
  );
}

export default App;
