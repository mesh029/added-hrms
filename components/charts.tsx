import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// Mock data for charts
const performanceData = [
  { name: 'Jan', Achieved: 4000, Target: 2400 },
  { name: 'Feb', Achieved: 3000, Target: 1398 },
  { name: 'Mar', Achieved: 2000, Target: 9800 },
  { name: 'Apr', Achieved: 2780, Target: 3908 },
  { name: 'May', Achieved: 1890, Target: 4800 },
  { name: 'Jun', Achieved: 2390, Target: 3800 },
];

// Prepare chart data
const data = {
  labels: performanceData.map(item => item.name), // Extract labels (months)
  datasets: [
    {
      label: 'Achieved',
      data: performanceData.map(item => item.Achieved), // Extract Achieved values
      backgroundColor: 'rgba(75, 192, 192, 0.6)', // Custom color
    },
    {
      label: 'Target',
      data: performanceData.map(item => item.Target), // Extract Target values
      backgroundColor: 'rgba(153, 102, 255, 0.6)', // Custom color
    },
  ],
};

// Chart options for styling
const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top' as const, // Type assertion for string literal
    },
    title: {
      display: true,
      text: 'Monthly Performance Overview',
    },
  },
};

// Create the PerformanceChart component
const PerformanceChart: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '400px' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default PerformanceChart;
