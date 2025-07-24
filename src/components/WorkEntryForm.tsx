import React from 'react';
import { useForm } from 'react-hook-form';
import { WorkEntry } from '../types';
import { CURRENCIES } from '../data/currencies';
import { DEFAULT_CATEGORIES } from '../data/categories';
import { format } from 'date-fns';

interface WorkEntryFormProps {
  entry?: WorkEntry;
  onSubmit: (data: Omit<WorkEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function WorkEntryForm({ entry, onSubmit, onCancel, isSubmitting = false }: WorkEntryFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      date: entry?.date || format(new Date(), 'yyyy-MM-dd'),
      category: entry?.category || '',
      description: entry?.description || '',
      amount: entry?.amount || 0,
      currency: entry?.currency || 'BDT',
      paymentStatus: entry?.paymentStatus || 'unpaid',
    },
  });

  const handleFormSubmit = (data: any) => {
    onSubmit({
      date: data.date,
      category: data.category,
      description: data.description,
      amount: parseFloat(data.amount),
      currency: data.currency,
      paymentStatus: data.paymentStatus,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            {...register('date', { required: 'Date is required' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
          {errors.date && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            {...register('category', { required: 'Category is required' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="">Select a category</option>
            {DEFAULT_CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.category.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <textarea
          {...register('description', { required: 'Description is required' })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          placeholder="Describe the work performed..."
        />
        {errors.description && (
          <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            {...register('amount', { 
              required: 'Amount is required',
              min: { value: 0, message: 'Amount must be positive' }
            })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="0.00"
          />
          {errors.amount && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Currency
          </label>
          <select
            {...register('currency', { required: 'Currency is required' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </select>
          {errors.currency && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.currency.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Status
          </label>
          <select
            {...register('paymentStatus', { required: 'Payment status is required' })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
          {errors.paymentStatus && (
            <p className="text-red-500 dark:text-red-400 text-sm mt-1">{errors.paymentStatus.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </>
          ) : (
            entry ? 'Update Entry' : 'Add Entry'
          )}
        </button>
      </div>
    </form>
  );
}