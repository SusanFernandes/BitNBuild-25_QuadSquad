
import { create } from 'zustand';

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: 'Income' | 'EMI' | 'SIP' | 'Rent' | 'Insurance' | 'Food' | 'Shopping' | 'Other';
  type: 'credit' | 'debit';
}

export interface TaxLiability {
  old: number;
  new: number;
}

export interface CibilScore {
  current: number;
  improvement: number;
}

export interface SpendingSummary {
  thisMonth: number;
  change: number;
}

interface FinanceState {
  transactions: Transaction[];
  taxLiability: TaxLiability;
  cibilScore: CibilScore;
  totalSavings: number;
  spendingSummary: SpendingSummary;
  setTransactions: (transactions: Transaction[]) => void;
  updateTransactionCategory: (id: string, category: Transaction['category']) => void;
  addTransaction: (transaction: Transaction) => void;
}

export const useFinanceStore = create<FinanceState>((set) => ({
  transactions: [
    {
      id: '1',
      date: '2024-01-15',
      description: 'Salary Credit',
      amount: 85000,
      category: 'Income',
      type: 'credit',
    },
    {
      id: '2',
      date: '2024-01-16',
      description: 'Home Loan EMI',
      amount: 25000,
      category: 'EMI',
      type: 'debit',
    },
    {
      id: '3',
      date: '2024-01-18',
      description: 'SIP - Mutual Fund',
      amount: 10000,
      category: 'SIP',
      type: 'debit',
    },
    {
      id: '4',
      date: '2024-01-20',
      description: 'House Rent',
      amount: 20000,
      category: 'Rent',
      type: 'debit',
    },
    {
      id: '5',
      date: '2024-01-22',
      description: 'Health Insurance Premium',
      amount: 8000,
      category: 'Insurance',
      type: 'debit',
    },
  ],
  taxLiability: {
    old: 125000,
    new: 98000,
  },
  cibilScore: {
    current: 742,
    improvement: 15,
  },
  totalSavings: 46500,
  spendingSummary: {
    thisMonth: 63000,
    change: -8,
  },
  setTransactions: (transactions) => set({ transactions }),
  updateTransactionCategory: (id, category) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, category } : t
      ),
    })),
  addTransaction: (transaction) =>
    set((state) => ({
      transactions: [transaction, ...state.transactions],
    })),
}));