import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { WorkEntry } from '../types';
import { convertToBDT } from '../data/currencies';
import { DEFAULT_CATEGORIES } from '../data/categories';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CategoryChartProps {
  entries: WorkEntry[];
}

export function CategoryChart({ entries }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const categoryTotals = entries.reduce((acc, entry) => {
      const bdtAmount = convertToBDT(entry.amount, entry.currency);
      acc[entry.category] = (acc[entry.category] || 0) + bdtAmount;
      return acc;
    }, {} as Record<string, number>);

    const categories = Object.keys(categoryTotals);
    const totals = Object.values(categoryTotals);
    const colors = categories.map(categoryId => {
      const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
      return category?.color || '#6B7280';
    });

    return {
      labels: categories.map(categoryId => {
        const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
        return category?.name || categoryId;
      }),
      datasets: [
        {
          data: totals,
          backgroundColor: colors,
          borderColor: colors.map(color => color),
          borderWidth: 2,
        },
      ],
    };
  }, [entries]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          color: 'rgb(156, 163, 175)',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context: any) {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ৳${context.parsed.toLocaleString('bn-BD')} (${percentage}%)`;
          }
        }
      },
    },
  };

  if (entries.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data to display
      </div>
    );
  }

  return (
    <div className="h-64">
      <Pie data={chartData} options={options} />
    </div>
  );
}