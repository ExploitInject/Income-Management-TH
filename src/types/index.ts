export interface WorkEntry {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  currency: string;
  paymentStatus: 'paid' | 'unpaid';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  description?: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rate: number; // Exchange rate to USD
}

export interface ReportFilter {
  startDate?: string;
  endDate?: string;
  category?: string;
  currency?: string;
  paymentStatus?: 'paid' | 'unpaid';
}

export interface Statistics {
  totalIncome: number;
  todayIncome: number;
  monthIncome: number;
  yearIncome: number;
  avgDailyIncome: number;
  avgMonthlyIncome: number;
  topCategory: string;
  totalEntries: number;
  paidIncome: number;
  unpaidIncome: number;
  paidEntries: number;
  unpaidEntries: number;
}