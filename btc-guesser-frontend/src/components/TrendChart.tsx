import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface TrendChartProps {
  data: ChartData<'line'>;
  options: ChartOptions<'line'>;
}

const TrendChart = ({ data, options }: TrendChartProps) => {
  return (
    <Line options={options} data={data} />
  );
};

export default TrendChart;
