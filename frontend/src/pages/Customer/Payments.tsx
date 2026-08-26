import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner, 
  faCalendarAlt, faReceipt, faSearch 
} from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

interface Payment {
  id: string;
  invoice_id: string;
  amount: number | string;
  payment_method: string;
  transaction_id: string;
  status: string;
  paid_at: string;
  created_at: string;
  invoice?: {
    invoice_number: string;
  };
}

type TabType = 'all' | 'pending' | 'success' | 'failed' | 'refunded';

const TAB_CONFIG: { key: TabType; label: string; color: string }[] = [
  { key: 'all',      label: 'All Transactions', color: 'bg-blue-500' },
  { key: 'pending',  label: 'Pending',          color: 'bg-yellow-500' },
  { key: 'success',  label: 'Success',          color: 'bg-green-500' },
  { key: 'failed',   label: 'Failed',           color: 'bg-red-500' },
  { key: 'refunded', label: 'Refunded',         color: 'bg-indigo-500' },
];

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'success':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'refunded':
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const CustomerPayments: React.FC = () => {
  const token = localStorage.getItem('token');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filtered, setFiltered] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const fetchPayments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get('/payments');
      setPayments(res.data?.data || []);
    } catch {
      showToast('Failed to load payment history', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    let list = [...payments];

    // Filter by Tab
    if (activeTab !== 'all') {
      list = list.filter((p) => p.status.toLowerCase() === activeTab);
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => 
        (p.invoice?.invoice_number || '').toLowerCase().includes(q) ||
        (p.transaction_id || '').toLowerCase().includes(q) ||
        p.payment_method.toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [activeTab, payments, search]);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Payment History</h1>
          <p className="text-sm text-gray-500 mt-1">Audit log of your payment transactions</p>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
          {TAB_CONFIG.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-6 text-sm font-medium border-b-2 whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-sm" />
          </span>
          <input
            type="text"
            placeholder="Search by transaction ID, invoice number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl mb-3 text-blue-500" />
            <p className="text-sm">Loading payment log...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <FontAwesomeIcon icon={faReceipt} className="text-5xl mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-1">No transactions found</h3>
            <p className="text-sm">We couldn't find any transaction log records matching the criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Transaction ID</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice No</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((pay) => (
                    <tr key={pay.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-bold text-gray-700">
                        {pay.transaction_id || 'CASH-COLLECT'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-semibold">
                        {pay.invoice?.invoice_number || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
                          {new Date(pay.paid_at || pay.created_at).toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold uppercase text-gray-700">
                        {pay.payment_method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-800">
                        ₹{Number(pay.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(pay.status)}`}>
                          {pay.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerPayments;
