import { useState, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import TrendChart from './components/TrendChart';
import Notification, { NotificationType } from './components/Notification';
import { ChartOptions } from 'chart.js';
import { useGetBTCHistoricalPrice } from './services/getBTCHistoricalPrice';

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
  const [isCurrentPriceLoading, setIsCurrentPriceLoading] = useState(true);
  const [currentBtcPrice, setCurrentBtcPrice] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentBtcPrice('42,069.69');
      setIsCurrentPriceLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
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

  const handleSavePlayerName = () => {
    if (playerName.trim() === '') {
      showNotification('Player name cannot be empty!', 'error');
      return;
    }
    showNotification(`Player name '${playerName}' saved!`, 'success');
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
      <div className='flex gap-2 items-center'>
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
        />
        <button
          className='flex items-center px-4 py-1 text-white rounded bg-blue-500 hover:bg-blue-600'
          onClick={handleSavePlayerName}
        >
          Save
        </button>
      </div>
      <div className='flex gap-4 items-center'>
        <span>Guess the next price movement:</span>
        <button className='flex items-center px-4 py-1 bg-green-400 text-white rounded hover:bg-green-600'>
          <ArrowUpIcon className='h-5 w-5 mr-2' />
          UP
        </button>
        <button className='flex items-center px-4 py-1 bg-red-400 text-white rounded hover:bg-red-600'>
          <ArrowDownIcon className='h-5 w-5 mr-2' />
          DOWN
        </button>
      </div>
      <div className='flex gap-2 items-center'>
        <span>Score: 0</span>
      </div>
    </div>
  );
}

export default App;
