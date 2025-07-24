import { useState, useMemo } from 'react';
import { WorkEntry, Statistics, ReportFilter } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { convertToBDT } from '../data/currencies';
import { format, isToday, isThisMonth, isThisYear, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export function useWorkEntries() {
  const [entries, setEntries] = useLocalStorage<WorkEntry[]>('workEntries', []);
  const [filter, setFilter] = useState<ReportFilter>({});

  const addEntry = (entry: Omit<WorkEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newEntry: WorkEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEntries(prev => [newEntry, ...prev]);
    return newEntry;
  };

  const updateEntry = (id: string, updates: Partial<WorkEntry>) => {
    setEntries(prev => prev.map(entry => 
      entry.id === id 
        ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
        : entry
    ));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filter.startDate && entry.date < filter.startDate) return false;
      if (filter.endDate && entry.date > filter.endDate) return false;
      if (filter.category && entry.category !== filter.category) return false;
      if (filter.currency && entry.currency !== filter.currency) return false;
      return true;
    });
  }, [entries, filter]);

  const statistics = useMemo((): Statistics => {
    const today = new Date();
    const todayEntries = entries.filter(entry => isToday(new Date(entry.date)));
    const monthEntries = entries.filter(entry => isThisMonth(new Date(entry.date)));
    const yearEntries = entries.filter(entry => isThisYear(new Date(entry.date)));

    const totalIncome = entries.reduce((sum, entry) => 
      sum + convertToBDT(entry.amount, entry.currency), 0
    );

    const todayIncome = todayEntries.reduce((sum, entry) => 
      sum + convertToBDT(entry.amount, entry.currency), 0
    );

    const monthIncome = monthEntries.reduce((sum, entry) => 
      sum + convertToBDT(entry.amount, entry.currency), 0
    );

    const yearIncome = yearEntries.reduce((sum, entry) => 
      sum + convertToBDT(entry.amount, entry.currency), 0
    );

    const categoryTotals = entries.reduce((acc, entry) => {
      const bdtAmount = convertToBDT(entry.amount, entry.currency);
      acc[entry.category] = (acc[entry.category] || 0) + bdtAmount;
      return acc;
    }, {} as Record<string, number>);

    const topCategory = Object.entries(categoryTotals)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const avgDailyIncome = monthIncome / today.getDate();
    const avgMonthlyIncome = yearIncome / (today.getMonth() + 1);

    return {
      totalIncome,
      todayIncome,
      monthIncome,
      yearIncome,
      avgDailyIncome,
      avgMonthlyIncome,
      topCategory,
      totalEntries: entries.length,
    };
  }, [entries]);

  const exportData = (format: 'csv' | 'json' = 'csv') => {
    const dataToExport = filteredEntries;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-entries-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csvContent = [
        'Date,Category,Description,Amount,Currency,BDT Amount',
        ...dataToExport.map(entry => [
          entry.date,
          entry.category,
          `"${entry.description.replace(/"/g, '""')}"`,
          entry.amount,
          entry.currency,
          convertToBDT(entry.amount, entry.currency).toFixed(2)
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `work-entries-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return {
    entries: filteredEntries,
    allEntries: entries,
    addEntry,
    updateEntry,
    deleteEntry,
    statistics,
    filter,
    setFilter,
    exportData,
  };
}