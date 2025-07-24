import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { WorkEntry } from '../types';
import { convertToBDT } from '../data/currencies';
import { format, subDays, eachDayOfInterval } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface IncomeChartProps {
  entries: WorkEntry[];
}

export function IncomeChart({ entries }: IncomeChartProps) {
  const chartData = useMemo(() => {
    const endDate = new Date();
    const startDate = subDays(endDate, 29); // Last 30 days
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dailyIncome = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayEntries = entries.filter(entry => entry.date === dateStr);
      const total = dayEntries.reduce((sum, entry) => 
        sum + convertToBDT(entry.amount, entry.currency), 0
      );
      return {
        date: format(date, 'MMM dd'),
        income: total,
      };
    });

    return {
      labels: dailyIncome.map(d => d.date),
      datasets: [
        {
          label: 'Daily Income (BDT)',
          data: dailyIncome.map(d => d.income),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    };
  }, [entries]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context: any) {
            return `Income: ৳${context.parsed.y.toLocaleString('bn-BD')}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function(value: any) {
            return '৳' + value.toLocaleString('bn-BD');
          }
        }
      },
      x: {
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
        }
      }
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}