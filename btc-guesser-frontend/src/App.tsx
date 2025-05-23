import { useState, useEffect, useMemo } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import TrendChart from './components/TrendChart';
import Notification, { NotificationType } from './components/Notification';
import { ChartOptions } from 'chart.js';
import { useGetBTCHistoricalPrice } from './services/getBTCHistoricalPrice';
import { useSetGuess } from './services/setGuess';
import { useGetPlayerStatus } from './services/getPlayerStatus';
import { useGetPrice } from './services/getPrice';
import debounce from 'lodash/debounce';

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
  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [debouncedQueryPlayerName, setDebouncedQueryPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [notification, setNotification] = useState<{ message: string; type: NotificationType } | null>(null);

  const { data: btcHistoricalPriceData, isLoading: btcHistoricalPriceLoading, error: btcHistoricalPriceError } = useGetBTCHistoricalPrice();
  const { data: playerStatusData, isLoading: playerStatusLoading, error: playerStatusError } = useGetPlayerStatus(debouncedQueryPlayerName);
  const guessMutation = useSetGuess();
  const { data: btcPriceData, isLoading: btcPriceLoading, error: btcPriceError } = useGetPrice();

  console.log(playerStatusData)

  const [guessAttempted, setGuessAttempted] = useState<string | null>(null);

  const updateDebouncedPlayerName = useMemo(() =>
    debounce((name: string) => {
      setDebouncedQueryPlayerName(name);
    }, 800),
    [setDebouncedQueryPlayerName]
  );

  useEffect(() => {
    // handles debouncing player name input so that the request to get player status is not fired
    // on every keystroke
    updateDebouncedPlayerName(playerName);

    return () => {
      updateDebouncedPlayerName.cancel();
    };
  }, [playerName, updateDebouncedPlayerName]);

  useEffect(() => {
    // handles app notifications triggered by external services 
    const handleShowAppNotification = (event: CustomEvent<{ message: string; type: NotificationType }>) => {
      setNotification({ message: event.detail.message, type: event.detail.type });
    };
    window.addEventListener('showAppNotification', handleShowAppNotification as EventListener);

    return () => {
      window.removeEventListener('showAppNotification', handleShowAppNotification as EventListener);
    };
  }, []);

  useEffect(() => {
    // autoclose notification after 3 seconds
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleGuess = async (guessDirection: string) => {
    if (playerName.trim() === '') {
      setNotification({ message: 'Player name cannot be empty!', type: 'error' });
      return;
    }
    setGuessAttempted(guessDirection);
    await guessMutation.mutateAsync({ playerId: playerName, guess: guessDirection });
    setGuessAttempted(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayerName(e.target.value);
    if (localStorage.getItem('playerName') !== e.target.value) {
      localStorage.setItem('playerName', e.target.value);
    }
  };

  return (<>
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
        {btcPriceError && <span className='text-red-500'>{btcPriceError.message}</span>}
        {btcPriceLoading ? (
          <ArrowPathIcon className='animate-spin h-5 w-5 text-gray-500' />
        ) : (
          <span>${btcPriceData?.price}</span>
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
          onChange={handleNameChange}
          placeholder="Enter your name"
          disabled={guessMutation.isPending}
        />
      </div>
      <div className='flex gap-4 items-center'>
        <span>Guess the next price movement:</span>
        <button
          className='flex items-center justify-center px-4 py-1 w-28 bg-green-400 text-white rounded hover:bg-green-600 disabled:opacity-50'
          onClick={() => handleGuess('up')}
          disabled={guessMutation.isPending || !!playerStatusData?.activeGuess}
        >
          {guessMutation.isPending && guessAttempted === 'up' ? <ArrowPathIcon className='animate-spin h-5 w-5' /> : <><ArrowUpIcon className='h-5 w-5 mr-2' /> UP</>}
        </button>
        <button
          className='flex items-center justify-center px-4 py-1 w-28 bg-red-400 text-white rounded hover:bg-red-600 disabled:opacity-50'
          onClick={() => handleGuess('down')}
          disabled={guessMutation.isPending || !!playerStatusData?.activeGuess}
        >
          {guessMutation.isPending && guessAttempted === 'down' ? <ArrowPathIcon className='animate-spin h-5 w-5' /> : <><ArrowDownIcon className='h-5 w-5 mr-2' /> DOWN</>}
        </button>
      </div>
      <div className='flex gap-2 items-center'>
        {playerStatusError && <span className='text-red-500'>{playerStatusError.message}</span>}
        {playerStatusLoading ? (
          <ArrowPathIcon className='animate-spin h-5 w-5 text-gray-500' />
        ) : (
          <span>Score: {playerStatusData?.score}</span>
        )}
      </div>
    </div>
    <div className='absolute bottom-0 p-4'>
      <div className='flex flex-col gap-2 text-left text-sm'>
        <span className='font-bold'>Active Guess:</span>
        {playerStatusData?.activeGuess && (
          <>
            <span>Last guess: {playerStatusData.activeGuess.direction}</span>
            <span>Initial Price: {playerStatusData.activeGuess.initialPrice}</span>
            <span>Timestamp: {new Date(playerStatusData.activeGuess.timestamp).toLocaleString()}</span>
          </>)
          || (
            <span> No active guess. You can make a new guess.</span>
          )}
      </div>
    </div>
  </>
  );
}

export default App;
