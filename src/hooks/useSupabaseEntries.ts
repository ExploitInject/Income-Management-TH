import { useState, useEffect, useMemo } from 'react';
import { WorkEntry, Statistics, ReportFilter } from '../types';
import { supabase, Database } from '../lib/supabase';
import { useAuth } from './useAuth';
import { convertToBDT } from '../data/currencies';
import { format as formatDateFns, isToday, isThisMonth, isThisYear } from 'date-fns';

type SupabaseWorkEntry = Database['public']['Tables']['work_entries']['Row'];

export function useSupabaseEntries() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ReportFilter>({});

  // Convert Supabase entry to WorkEntry (database snake_case to app camelCase)
  const convertEntry = (entry: SupabaseWorkEntry): WorkEntry => ({
    id: entry.id,
    date: entry.date,
    category: entry.category,
    description: entry.description,
    amount: entry.amount,
    currency: entry.currency,
    paymentStatus: entry.payment_status,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  });

  // Fetch entries from Supabase
  const fetchEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('work_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setEntries(data.map(convertEntry));
    } catch (error) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const addEntry = async (entry: Omit<WorkEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { data, error } = await supabase
        .from('work_entries')
        .insert({
          user_id: user.id,
          date: entry.date,
          category: entry.category,
          description: entry.description,
          amount: entry.amount,
          currency: entry.currency,
          payment_status: entry.paymentStatus,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      const newEntry = convertEntry(data);
      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (error) {
      console.error('Error adding entry:', error);
      throw error;
    }
  };

  const updateEntry = async (id: string, updates: Partial<WorkEntry>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Convert camelCase to snake_case for database
      if (updates.date !== undefined) updateData.date = updates.date;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.amount !== undefined) updateData.amount = updates.amount;
      if (updates.currency !== undefined) updateData.currency = updates.currency;
      if (updates.paymentStatus !== undefined) updateData.payment_status = updates.paymentStatus;

      const { data, error } = await supabase
        .from('work_entries')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }

      const updatedEntry = convertEntry(data);
      setEntries(prev => prev.map(entry => 
        entry.id === id ? updatedEntry : entry
      ));
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  };

  const deleteEntry = async (id: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const { error } = await supabase
        .from('work_entries')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }

      setEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  };

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      if (filter.startDate && entry.date < filter.startDate) return false;
      if (filter.endDate && entry.date > filter.endDate) return false;
      if (filter.category && entry.category !== filter.category) return false;
      if (filter.currency && entry.currency !== filter.currency) return false;
      if (filter.paymentStatus && entry.paymentStatus !== filter.paymentStatus) return false;
      return true;
    });
  }, [entries, filter]);

  const statistics = useMemo((): Statistics => {
    const todayEntries = entries.filter(entry => isToday(new Date(entry.date)));
    const monthEntries = entries.filter(entry => isThisMonth(new Date(entry.date)));
    const yearEntries = entries.filter(entry => isThisYear(new Date(entry.date)));

    const paidEntries = entries.filter(entry => entry.paymentStatus === 'paid');
    const unpaidEntries = entries.filter(entry => entry.paymentStatus === 'unpaid');

    const totalIncome = entries.reduce((sum, entry) => 
      sum + convertToBDT(entry.amount, entry.currency), 0
    );

    const paidIncome = paidEntries.reduce((sum, entry) => 
      sum + convertToBDT(entry.amount, entry.currency), 0
    );

    const unpaidIncome = unpaidEntries.reduce((sum, entry) => 
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

    const today = new Date();
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
      paidIncome,
      unpaidIncome,
      paidEntries: paidEntries.length,
      unpaidEntries: unpaidEntries.length,
    };
  }, [entries]);

  const exportData = (format: 'csv' | 'json' = 'csv') => {
    try {
      const dataToExport = filteredEntries;
      const timestamp = formatDateFns(new Date(), 'yyyy-MM-dd-HHmm');
      
      if (format === 'json') {
        const jsonData = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `work-entries-${timestamp}.json`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      } else {
        const headers = ['Date', 'Category', 'Description', 'Amount', 'Currency', 'Payment Status', 'BDT Amount'];
        const csvRows = [
          headers.join(','),
          ...dataToExport.map(entry => [
            entry.date,
            entry.category,
            `"${entry.description.replace(/"/g, '""')}"`,
            entry.amount.toString(),
            entry.currency,
            entry.paymentStatus,
            convertToBDT(entry.amount, entry.currency).toFixed(2)
          ].join(','))
        ];
        
        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `work-entries-${timestamp}.csv`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  const importData = async (file: File): Promise<{ success: number; errors: string[] }> => {
    if (!user) throw new Error('User not authenticated');

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          let importedEntries: any[] = [];
          const errors: string[] = [];
          
          if (file.name.endsWith('.json')) {
            try {
              const jsonData = JSON.parse(content);
              importedEntries = Array.isArray(jsonData) ? jsonData : [jsonData];
            } catch (error) {
              errors.push('Invalid JSON format');
              resolve({ success: 0, errors });
              return;
            }
          } else if (file.name.endsWith('.csv')) {
            const lines = content.split('\n').filter(line => line.trim());
            if (lines.length < 2) {
              errors.push('CSV file must have at least a header and one data row');
              resolve({ success: 0, errors });
              return;
            }
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
            const dataLines = lines.slice(1);
            
            // Map CSV headers to our expected fields
            const fieldMap: Record<string, string> = {
              'date': 'date',
              'category': 'category', 
              'description': 'description',
              'amount': 'amount',
              'currency': 'currency',
              'payment status': 'paymentStatus',
              'paymentstatus': 'paymentStatus'
            };
            
            importedEntries = dataLines.map((line, index) => {
              try {
                const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                const entry: any = {};
                
                headers.forEach((header, i) => {
                  const field = fieldMap[header];
                  if (field && values[i] !== undefined) {
                    if (field === 'amount') {
                      entry[field] = parseFloat(values[i]);
                    } else if (field === 'paymentStatus') {
                      entry[field] = values[i].toLowerCase() === 'paid' ? 'paid' : 'unpaid';
                    } else {
                      entry[field] = values[i];
                    }
                  }
                });
                
                // Set default payment status if not provided
                if (!entry.paymentStatus) {
                  entry.paymentStatus = 'unpaid';
                }
                
                return entry;
              } catch (error) {
                errors.push(`Error parsing line ${index + 2}: ${error}`);
                return null;
              }
            }).filter(Boolean);
          } else {
            errors.push('Unsupported file format. Please use JSON or CSV files.');
            resolve({ success: 0, errors });
            return;
          }
          
          // Validate and import entries
          let successCount = 0;
          
          for (const [index, entry] of importedEntries.entries()) {
            try {
              // Validate required fields
              if (!entry.date || !entry.category || !entry.description || 
                  entry.amount === undefined || !entry.currency) {
                errors.push(`Entry ${index + 1}: Missing required fields`);
                continue;
              }
              
              // Validate date format
              const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
              if (!dateRegex.test(entry.date)) {
                errors.push(`Entry ${index + 1}: Invalid date format (use YYYY-MM-DD)`);
                continue;
              }
              
              // Validate amount
              if (isNaN(entry.amount) || entry.amount < 0) {
                errors.push(`Entry ${index + 1}: Invalid amount`);
                continue;
              }
              
              // Validate payment status
              if (entry.paymentStatus && !['paid', 'unpaid'].includes(entry.paymentStatus)) {
                entry.paymentStatus = 'unpaid';
              }
              
              // Import the entry
              await addEntry({
                date: entry.date,
                category: entry.category,
                description: entry.description,
                amount: parseFloat(entry.amount),
                currency: entry.currency,
                paymentStatus: entry.paymentStatus || 'unpaid'
              });
              
              successCount++;
            } catch (error) {
              errors.push(`Entry ${index + 1}: ${error}`);
            }
          }
          
          resolve({ success: successCount, errors });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  };

  return {
    entries: filteredEntries,
    allEntries: entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
    statistics,
    filter,
    setFilter,
    exportData,
    importData,
  };
}