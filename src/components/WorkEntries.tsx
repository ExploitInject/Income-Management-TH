import React, { useState, useRef } from 'react';
import { Plus, Edit, Trash2, Download, Upload, CheckCircle, XCircle } from 'lucide-react';
import { WorkEntryForm } from './WorkEntryForm';
import { useSupabaseEntries } from '../hooks/useSupabaseEntries';
import { WorkEntry } from '../types';
import { getCurrencyByCode, convertToBDT } from '../data/currencies';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { format } from 'date-fns';

export function WorkEntries() {
  const { entries, addEntry, updateEntry, deleteEntry, exportData, importData, loading } = useSupabaseEntries();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<WorkEntry | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (data: Omit<WorkEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setSubmitting(true);
      if (editingEntry) {
        await updateEntry(editingEntry.id, data);
      } else {
        await addEntry(data);
      }
      setShowForm(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Failed to save entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: WorkEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this entry?')) {
      try {
        await deleteEntry(id);
      } catch (error) {
        console.error('Error deleting entry:', error);
        alert('Failed to delete entry. Please try again.');
      }
    }
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

  const getCategoryName = (categoryId: string) => {
    const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = DEFAULT_CATEGORIES.find(c => c.id === categoryId);
    return category?.color || '#6B7280';
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currency = getCurrencyByCode(currencyCode);
    return `${currency?.symbol || currencyCode} ${amount.toFixed(2)}`;
  };

  const formatBDT = (amount: number) => {
    return `৳${amount.toLocaleString('bn-BD')}`;
  };

  const totalBDT = entries.reduce((sum, entry) => 
    sum + convertToBDT(entry.amount, entry.currency), 0
  );

  const paidBDT = entries
    .filter(entry => entry.paymentStatus === 'paid')
    .reduce((sum, entry) => sum + convertToBDT(entry.amount, entry.currency), 0);

  const unpaidBDT = entries
    .filter(entry => entry.paymentStatus === 'unpaid')
    .reduce((sum, entry) => sum + convertToBDT(entry.amount, entry.currency), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Work Entries</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your work entries and track income
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
            className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {editingEntry ? 'Edit Entry' : 'Add New Entry'}
          </h2>
          <WorkEntryForm
            entry={editingEntry || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingEntry(null);
            }}
            isSubmitting={submitting}
          />
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Entries ({entries.length})
            </h2>
            <div className="flex space-x-6">
              <div className="text-center">
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatBDT(paidBDT)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Paid</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                  {formatBDT(unpaidBDT)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Unpaid</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatBDT(totalBDT)}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
              </div>
            </div>
          </div>
        </div>

        {entries.length === 0 ? (
          <div className="p-6 text-center text-gray-500 dark:text-gray-400">
            No entries found. Add your first entry to get started!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    BDT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(entry.date), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: getCategoryColor(entry.category) }}
                      >
                        {getCategoryName(entry.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                      {entry.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(entry.amount, entry.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatBDT(convertToBDT(entry.amount, entry.currency))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.paymentStatus === 'paid' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
                      }`}>
                        {entry.paymentStatus === 'paid' ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Unpaid
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}