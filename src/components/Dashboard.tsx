import React from 'react';
import { DollarSign, TrendingUp, Calendar, Target, CheckCircle, XCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { IncomeChart } from './IncomeChart';
import { CategoryChart } from './CategoryChart';
import { useSupabaseEntries } from '../hooks/useSupabaseEntries';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { convertToBDT } from '../data/currencies';

export function Dashboard() {
  const { statistics, allEntries, loading } = useSupabaseEntries();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate category totals with payment status
  const categoryBreakdown = React.useMemo(() => {
    return DEFAULT_CATEGORIES.map(category => {
      const categoryEntries = allEntries.filter(entry => entry.category === category.id);
      const paidEntries = categoryEntries.filter(entry => entry.paymentStatus === 'paid');
      const unpaidEntries = categoryEntries.filter(entry => entry.paymentStatus === 'unpaid');
      
      const totalAmount = categoryEntries.reduce((sum, entry) => 
        sum + convertToBDT(entry.amount, entry.currency), 0
      );
      const paidAmount = paidEntries.reduce((sum, entry) => 
        sum + convertToBDT(entry.amount, entry.currency), 0
      );
      const unpaidAmount = unpaidEntries.reduce((sum, entry) => 
        sum + convertToBDT(entry.amount, entry.currency), 0
      );

      return {
        ...category,
        totalAmount,
        paidAmount,
        unpaidAmount,
        totalEntries: categoryEntries.length,
        paidEntries: paidEntries.length,
        unpaidEntries: unpaidEntries.length,
      };
    });
  }, [allEntries]);

  // Get total income
  const totalIncome = React.useMemo(() => {
    return allEntries.reduce((sum, entry) => 
      sum + convertToBDT(entry.amount, entry.currency), 0
    );
  }, [allEntries]);

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
        </div>
        
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-4"></div>
              <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">Welcome back! Here's an overview of your income.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard
          title="Today's Income"
          value={formatCurrency(statistics.todayIncome)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Monthly Income"
          value={formatCurrency(statistics.monthIncome)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Yearly Income"
          value={formatCurrency(statistics.yearIncome)}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Avg. Daily"
          value={formatCurrency(statistics.avgDailyIncome)}
          icon={Target}
          color="orange"
        />
        <StatCard
          title="Paid Income"
          value={formatCurrency(statistics.paidIncome)}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Unpaid Income"
          value={formatCurrency(statistics.unpaidIncome)}
          icon={XCircle}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Income Trend</h3>
          <IncomeChart entries={allEntries} />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Income by Category</h3>
          <CategoryChart entries={allEntries} />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Quick Statistics</h3>
        
        {/* Main Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{statistics.totalEntries}</p>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Total Entries</p>
          </div>
          <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">{formatCurrency(statistics.avgMonthlyIncome)}</p>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Avg. Monthly</p>
          </div>
          <div className="text-center p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-100 dark:border-purple-800">
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">{statistics.topCategory || 'N/A'}</p>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Top Category</p>
          </div>
          <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">{formatCurrency(totalIncome)}</p>
            <p className="text-gray-600 dark:text-gray-400 font-medium">Total Income</p>
          </div>
        </div>

        {/* Payment Status Overview */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Status Overview</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
              <div className="w-14 h-14 bg-green-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white">
                <CheckCircle className="w-8 h-8" />
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-2">
                {formatCurrency(statistics.paidIncome)}
              </p>
              <p className="text-sm font-semibold text-green-700 dark:text-green-300 mb-1">
                Paid Income
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {statistics.paidEntries} entries
              </p>
            </div>

            <div className="text-center p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800">
              <div className="w-14 h-14 bg-orange-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white">
                <XCircle className="w-8 h-8" />
              </div>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                {formatCurrency(statistics.unpaidIncome)}
              </p>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-1">
                Unpaid Income
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {statistics.unpaidEntries} entries
              </p>
            </div>

            <div className="text-center p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="w-14 h-14 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                %
              </div>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {totalIncome > 0 ? ((statistics.paidIncome / totalIncome) * 100).toFixed(1) : 0}%
              </p>
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-1">
                Payment Rate
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                by amount
              </p>
            </div>

            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="w-14 h-14 bg-gray-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl">
                ∑
              </div>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Total Income
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {statistics.totalEntries} entries
              </p>
            </div>
          </div>
        </div>

        {/* All Categories with Payment Status */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">All Categories with Payment Status</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {categoryBreakdown.map((category) => (
              <div 
                key={category.id}
                className="rounded-xl border-2 p-6 transition-all duration-200 hover:scale-105 hover:shadow-lg"
                style={{ 
                  backgroundColor: `${category.color}08`,
                  borderColor: `${category.color}40`
                }}
              >
                <div 
                  className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-bold text-xl shadow-lg"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name.charAt(0)}
                </div>
                
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
                  {category.name}
                </h5>
                
                {/* Total Amount */}
                <div className="text-center mb-4">
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(category.totalAmount)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total ({category.totalEntries} entries)
                  </p>
                </div>
                
                {/* Paid/Unpaid Breakdown */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Paid:
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {formatCurrency(category.paidAmount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {category.paidEntries} entries
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-orange-600 dark:text-orange-400 font-medium flex items-center">
                      <XCircle className="w-3 h-3 mr-1" />
                      Unpaid:
                    </span>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                        {formatCurrency(category.unpaidAmount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {category.unpaidEntries} entries
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Payment Progress Bar */}
                {category.totalAmount > 0 && (
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Payment Progress</span>
                      <span>{((category.paidAmount / category.totalAmount) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min((category.paidAmount / category.totalAmount) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}