import React, { useRef } from 'react';
import { Calendar, Filter, Download, Upload, TrendingUp } from 'lucide-react';
import { useSupabaseEntries } from '../hooks/useSupabaseEntries';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { CURRENCIES } from '../data/currencies';
import { convertToBDT } from '../data/currencies';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';

export function Reports() {
  const { entries, filter, setFilter, exportData, importData, loading } = useSupabaseEntries();
  const [importing, setImporting] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilterChange = (key: string, value: string) => {
    setFilter(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilter({});
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const result = await importData(file);
      
      let message = `Import completed!\n\nSuccessfully imported: ${result.success} entries`;
      if (result.errors.length > 0) {
        message += `\n\nErrors encountered:\n${result.errors.slice(0, 5).join('\n')}`;
        if (result.errors.length > 5) {
          message += `\n... and ${result.errors.length - 5} more errors`;
        }
      }
      
      alert(message);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data. Please check the file format and try again.');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  // Calculate period comparisons
  const currentMonth = new Date();
  const lastMonth = subMonths(currentMonth, 1);
  const currentYear = new Date();
  const lastYear = subYears(currentYear, 1);

  const currentMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startOfMonth(currentMonth) && entryDate <= endOfMonth(currentMonth);
  });

  const lastMonthEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startOfMonth(lastMonth) && entryDate <= endOfMonth(lastMonth);
  });

  const currentYearEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startOfYear(currentYear) && entryDate <= endOfYear(currentYear);
  });

  const lastYearEntries = entries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entryDate >= startOfYear(lastYear) && entryDate <= endOfYear(lastYear);
  });

  const currentMonthTotal = currentMonthEntries.reduce((sum, entry) => 
    sum + convertToBDT(entry.amount, entry.currency), 0
  );

  const lastMonthTotal = lastMonthEntries.reduce((sum, entry) => 
    sum + convertToBDT(entry.amount, entry.currency), 0
  );

  const currentYearTotal = currentYearEntries.reduce((sum, entry) => 
    sum + convertToBDT(entry.amount, entry.currency), 0
  );

  const lastYearTotal = lastYearEntries.reduce((sum, entry) => 
    sum + convertToBDT(entry.amount, entry.currency), 0
  );

  const monthChange = lastMonthTotal > 0 ? ((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;
  const yearChange = lastYearTotal > 0 ? ((currentYearTotal - lastYearTotal) / lastYearTotal) * 100 : 0;

  // Category breakdown with payment status
  const categoryBreakdown = DEFAULT_CATEGORIES.map(category => {
    const categoryEntries = entries.filter(entry => entry.category === category.id);
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

  // Payment status breakdown
  const paidEntries = entries.filter(entry => entry.paymentStatus === 'paid');
  const unpaidEntries = entries.filter(entry => entry.paymentStatus === 'unpaid');
  const paidTotal = paidEntries.reduce((sum, entry) => sum + convertToBDT(entry.amount, entry.currency), 0);
  const unpaidTotal = unpaidEntries.reduce((sum, entry) => sum + convertToBDT(entry.amount, entry.currency), 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Detailed insights into your income and work patterns
          </p>
        </div>
        <div className="flex space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleImport}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg transition-colors"
          >
            {importing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </button>
          <button
            onClick={() => exportData('csv')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filter.startDate || ''}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filter.endDate || ''}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filter.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              {DEFAULT_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Currency
            </label>
            <select
              value={filter.currency || ''}
              onChange={(e) => handleFilterChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Currencies</option>
              {CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Payment Status
            </label>
            <select
              value={filter.paymentStatus || ''}
              onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* Payment Status Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Status Overview</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{formatBDT(paidTotal)}</p>
            <p className="text-gray-600 dark:text-gray-400">Paid Amount</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">{paidEntries.length} entries</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{formatBDT(unpaidTotal)}</p>
            <p className="text-gray-600 dark:text-gray-400">Unpaid Amount</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">{unpaidEntries.length} entries</p>
          </div>
          
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {paidEntries.length + unpaidEntries.length > 0 ? 
                ((paidTotal / (paidTotal + unpaidTotal)) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-gray-600 dark:text-gray-400">Payment Rate</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">by amount</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatBDT(paidTotal + unpaidTotal)}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Total Amount</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">{entries.length} entries</p>
          </div>
        </div>
      </div>

      {/* All Categories Breakdown */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">All Categories Breakdown</h3>
        
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
              
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-4">
                {category.name}
              </h4>
              
              {/* Total Amount */}
              <div className="text-center mb-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatBDT(category.totalAmount)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Total ({category.totalEntries} entries)
                </p>
              </div>
              
              {/* Paid/Unpaid Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-green-600 dark:text-green-400 font-medium">Paid:</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatBDT(category.paidAmount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.paidEntries} entries
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-orange-600 dark:text-orange-400 font-medium">Unpaid:</span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                      {formatBDT(category.unpaidAmount)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {category.unpaidEntries} entries
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Payment Progress Bar */}
              {category.totalAmount > 0 && (
                <div className="mt-4">
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

      {/* Period Comparisons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Comparison</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">This Month</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatBDT(currentMonthTotal)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Last Month</span>
              <span className="text-lg text-gray-700 dark:text-gray-300">
                {formatBDT(lastMonthTotal)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-400">Change</span>
              <div className="flex items-center">
                <TrendingUp className={`w-4 h-4 mr-1 ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`font-semibold ${monthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {monthChange >= 0 ? '+' : ''}{monthChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center mb-4">
            <Calendar className="w-5 h-5 text-green-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Yearly Comparison</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">This Year</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {formatBDT(currentYearTotal)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Last Year</span>
              <span className="text-lg text-gray-700 dark:text-gray-300">
                {formatBDT(lastYearTotal)}
              </span>
            </div>
            
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-400">Change</span>
              <div className="flex items-center">
                <TrendingUp className={`w-4 h-4 mr-1 ${yearChange >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={`font-semibold ${yearChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {yearChange >= 0 ? '+' : ''}{yearChange.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtered Results Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filtered Results</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{entries.length}</p>
            <p className="text-gray-600 dark:text-gray-400">Total Entries</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatBDT(entries.reduce((sum, entry) => sum + convertToBDT(entry.amount, entry.currency), 0))}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Total Income (BDT)</p>
          </div>
          
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {entries.length > 0 ? formatBDT(entries.reduce((sum, entry) => sum + convertToBDT(entry.amount, entry.currency), 0) / entries.length) : '৳0'}
            </p>
            <p className="text-gray-600 dark:text-gray-400">Average per Entry</p>
          </div>
        </div>
      </div>
    </div>
  );
}