import { Currency } from '../types';

export const CURRENCIES: Currency[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$', rate: 110.0 },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', rate: 1.0 },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', rate: 1.32 },
  { code: 'EUR', name: 'Euro', symbol: '€', rate: 120.0 },
  { code: 'GBP', name: 'British Pound', symbol: '£', rate: 140.0 },
  { code: 'BTC', name: 'Bitcoin', symbol: '₿', rate: 4620000.0 },
  { code: 'ETH', name: 'Ethereum', symbol: 'Ξ', rate: 275000.0 },
];

export const getCurrencyByCode = (code: string): Currency | undefined => {
  return CURRENCIES.find(c => c.code === code);
};

export const convertToBDT = (amount: number, fromCurrency: string): number => {
  const currency = getCurrencyByCode(fromCurrency);
  return currency ? amount * currency.rate : amount;
};

export const convertFromBDT = (amount: number, toCurrency: string): number => {
  const currency = getCurrencyByCode(toCurrency);
  return currency ? amount / currency.rate : amount;
};

// Keep the old function names for backward compatibility but redirect to BDT
export const convertToUSD = convertToBDT;
export const convertFromUSD = convertFromBDT;