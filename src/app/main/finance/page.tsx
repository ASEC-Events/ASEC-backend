'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Download, Trash2 } from 'lucide-react';
import { useTheme } from '../../components/ThemeProvider';
import { useToast } from '../../components/Toast';

interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: string;
  date: string;
  paymentMethod: string;
}

const categories = ['Venue Rental', 'Catering', 'Equipment', 'Decoration', 'Staff', 'Maintenance', 'Other'];

export default function FinancePage() {
  const { theme, mounted } = useTheme();
  const isDark = mounted && theme === 'dark';
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [showModal, setShowModal] = useState(false);
  const [deleteTransaction, setDeleteTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    category: 'Venue Rental',
    amount: '',
    type: 'income',
    date: '',
    paymentMethod: 'Bank Transfer',
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/finance');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
  const netBalance = totalIncome - totalExpense;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        amount: formData.type === 'expense' ? -Math.abs(Number(formData.amount)) : Number(formData.amount),
      };

      await fetch('/api/finance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      showToast("Transaction added successfully", "success");

      setShowModal(false);
      setFormData({ description: '', category: 'Venue Rental', amount: '', type: 'income', date: '', paymentMethod: 'Bank Transfer' });
      fetchTransactions();
    } catch (error) {
      showToast("Failed to add transaction", "error");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTransaction) return;
    try {
      await fetch(`/api/finance?id=${deleteTransaction.id}`, { method: 'DELETE' });
      showToast("Transaction deleted successfully", "success");
      fetchTransactions();
    } catch (error) {
      showToast("Failed to delete transaction", "error");
    } finally {
      setDeleteTransaction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Finance</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-500'}>Track income and expenses</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Income</p>
              <p className="text-2xl font-bold text-green-600">₦{totalIncome.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">₦{totalExpense.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Net Balance</p>
              <p className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₦{netBalance.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className={`card ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                typeFilter === 'all' 
                  ? (isDark ? 'bg-primary text-white' : 'bg-slate-800 text-white')
                  : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTypeFilter('income')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                typeFilter === 'income' 
                  ? 'bg-green-600 text-white'
                  : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }`}
            >
              Income
            </button>
            <button
              onClick={() => setTypeFilter('expense')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                typeFilter === 'expense' 
                  ? 'bg-red-600 text-white'
                  : (isDark ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
              }`}
            >
              Expenses
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Description</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Category</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Date</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Payment Method</th>
                <th className={`text-right py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Amount</th>
                <th className={`text-left py-3 px-4 text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className={`border-b ${isDark ? 'border-slate-700 hover:bg-slate-700/50' : 'border-slate-100 hover:bg-slate-50'}`}>
                    <td className="py-4 px-4">
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-800'}`}>{transaction.description}</p>
                    </td>
                    <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{transaction.category}</td>
                    <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{transaction.date}</td>
                    <td className={`py-4 px-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{transaction.paymentMethod}</td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-semibold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}₦{Math.abs(transaction.amount || 0).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <button onClick={() => setDeleteTransaction(transaction)} className="p-2 hover:bg-red-50 rounded-lg">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className={`py-8 text-center ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-slate-800' : 'bg-white'} rounded-xl w-full max-w-lg`}>
            <div className={`p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>Add Transaction</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Type</label>
                <div className="flex gap-4">
                  <label className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="income"
                      checked={formData.type === 'income'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    />
                    Income
                  </label>
                  <label className={`flex items-center gap-2 ${isDark ? 'text-slate-300' : ''}`}>
                    <input
                      type="radio"
                      name="type"
                      value="expense"
                      checked={formData.type === 'expense'}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    />
                    Expense
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₦)</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input w-full max-w-50 xs:max-w-full"
                    required
                  />
                </div>
                <div>
                  <label className="label">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="input"
                  >
                    <option>Bank Transfer</option>
                    <option>Credit Card</option>
                    <option>Cash</option>
                    <option>Cheque</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Transaction
                </button>
</div>
            </form>
          </div>
        </div>
      )}

      {deleteTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-xl w-full max-w-md p-6 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Delete Transaction
            </h2>
            <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Are you sure you want to delete <span className="font-medium">{deleteTransaction.description}</span>?
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setDeleteTransaction(null)} className="btn-secondary">Cancel</button>
              <button onClick={confirmDelete} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}