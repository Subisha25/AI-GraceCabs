import React, { useEffect, useState, useCallback } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faCreditCard, faSpinner, 
  faCalendarAlt, faCoins 
} from '@fortawesome/free-solid-svg-icons';

interface Payment {
  paymentId: string;
  amount: number | string;
  paymentMode: string;
  transactionId: string;
  status: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  createdAt: string;
}

type StatusFilter = 'all' | 'pending' | 'success' | 'failed';
type MethodFilter = 'all' | 'cash' | 'online';

const PaymentList: React.FC = () => {
  const userRole = localStorage.getItem('role') || '';

  const [payments, setPayments] = useState<Payment[]>([]);
  const [filtered, setFiltered] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [methodFilter, setMethodFilter] = useState<MethodFilter>('all');
  const [dateFilter, setDateFilter] = useState('');

  const fetchPayments = useCallback(() => {
    setLoading(true);
    axiosInstance
      .get('/payments')
      .then((res) => {
        const rawData = res.data?.data || [];
        const data: Payment[] = rawData.map((p: any) => ({
          paymentId: p.id,
          amount: p.amount,
          paymentMode: p.payment_method ? p.payment_method.toLowerCase() : 'offline',
          transactionId: p.transaction_id || '—',
          status: p.status ? p.status.toLowerCase() : 'pending',
          invoiceId: p.invoice_id,
          invoiceNumber: p.invoice?.invoice_number || '—',
          clientName: p.invoice?.booking?.organization?.name || p.invoice?.booking?.customer?.name || '—',
          createdAt: p.paid_at || p.created_at,
        }));
        setPayments(data);
        setFiltered(data);
      })
      .catch(() => { showToast('Failed to load payments', 'error'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  useEffect(() => {
    let list = [...payments];

    // Status Filter
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }

    // Method Filter
    if (methodFilter !== 'all') {
      if (methodFilter === 'cash') {
        list = list.filter((p) => p.paymentMode === 'cash');
      } else {
        list = list.filter((p) => p.paymentMode === 'online');
      }
    }

    // Date Filter
    if (dateFilter) {
      list = list.filter((p) => {
        const payDate = new Date(p.createdAt).toISOString().split('T')[0];
        return payDate === dateFilter;
      });
    }

    // Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.transactionId.toLowerCase().includes(q) ||
        p.invoiceNumber.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q) ||
        p.paymentMode.toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [search, statusFilter, methodFilter, dateFilter, payments]);

  const handleConfirmCash = async (paymentId: string) => {
    if (!['superadmin', 'admin', 'accountant'].includes(userRole.toLowerCase())) {
      showToast('Unauthorized action', 'error');
      return;
    }
    
    if (!window.confirm('Are you sure you want to verify and confirm this cash payment?')) {
      return;
    }

    try {
      const res = await axiosInstance.post(`/payments/${paymentId}/confirm-cash`);
      showToast(res.data?.message || 'Cash payment verified and invoice marked PAID.', 'success');
      fetchPayments();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to verify payment', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const showConfirmButton = (payment: Payment) => {
    return (
      payment.paymentMode === 'cash' && 
      payment.status === 'pending' && 
      ['superadmin', 'admin', 'accountant'].includes(userRole.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payments</h1>
            <p className="text-sm text-gray-500 mt-0.5">Unified platform transaction history</p>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-6 flex flex-col md:flex-row flex-wrap gap-4 items-end">
          {/* Text Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Search</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FontAwesomeIcon icon={faSearch} className="text-gray-400 text-xs" />
              </span>
              <input 
                type="text" 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search transaction ID, invoice, client..."
                className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="w-full md:w-40">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Method Filter */}
          <div className="w-full md:w-40">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Method</label>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as MethodFilter)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="w-full md:w-44">
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Payment Date</label>
            <input 
              type="date" 
              value={dateFilter} 
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
            />
          </div>
          
          {/* Reset Filters Button */}
          {(search || statusFilter !== 'all' || methodFilter !== 'all' || dateFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setMethodFilter('all');
                setDateFilter('');
              }}
              className="text-xs text-blue-600 font-semibold hover:underline pb-2.5 h-10 flex items-center"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Ledger Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3 text-blue-500" />Loading payments...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FontAwesomeIcon icon={faCreditCard} className="text-4xl mb-3 text-gray-300" />
              <p className="font-medium text-gray-600">No payment records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4 text-left">Transaction ID</th>
                    <th className="px-6 py-4 text-left">Invoice No</th>
                    <th className="px-6 py-4 text-left">Client</th>
                    <th className="px-6 py-4 text-left">Amount</th>
                    <th className="px-6 py-4 text-left">Method</th>
                    <th className="px-6 py-4 text-left">Date</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((p) => (
                    <tr key={p.paymentId} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-600">{p.transactionId}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-600">{p.invoiceNumber}</td>
                      <td className="px-6 py-4 text-gray-700 font-medium">{p.clientName}</td>
                      <td className="px-6 py-4 font-extrabold text-gray-800">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase bg-blue-50 text-blue-800">
                          {p.paymentMode}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                          {new Date(p.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {showConfirmButton(p) ? (
                          <button
                            onClick={() => handleConfirmCash(p.paymentId)}
                            className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg shadow-sm transition"
                          >
                            <FontAwesomeIcon icon={faCoins} className="text-[10px]" />
                            Confirm Cash
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-4 text-right">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''} logged</p>
      </div>
    </div>
  );
};

export default PaymentList;
