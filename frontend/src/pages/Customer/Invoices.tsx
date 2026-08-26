import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
   faSearch, faSpinner, faCalendarAlt, faFileInvoice, 
   faEye, faDownload, faCreditCard 
} from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  subtotal: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  status: string;
  issued_at: string;
  booking?: {
    id: string;
    booking_code: string;
    pickup_location: string;
    drop_location: string;
  };
}

type TabType = 'all' | 'pending' | 'paid' | 'cancelled';

const TAB_CONFIG: { key: TabType; label: string; color: string }[] = [
  { key: 'all',       label: 'All Invoices', color: 'bg-blue-500' },
  { key: 'pending',   label: 'Pending',      color: 'bg-yellow-500' },
  { key: 'paid',      label: 'Paid',         color: 'bg-green-500' },
  { key: 'cancelled', label: 'Cancelled',    color: 'bg-rose-500' },
];

const getStatusBadge = (status: string) => {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'payment_pending':
    case 'issued':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const CustomerInvoices: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get('/invoices');
      setInvoices(res.data?.data || []);
    } catch {
      showToast('Failed to load invoices', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    let list = [...invoices];

    // Filter by Tab
    if (activeTab === 'pending') {
      list = list.filter((inv) => ['payment_pending', 'issued', 'draft'].includes(inv.status));
    } else if (activeTab === 'paid') {
      list = list.filter((inv) => inv.status === 'paid');
    } else if (activeTab === 'cancelled') {
      list = list.filter((inv) => inv.status === 'cancelled');
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((inv) => 
        inv.invoice_number.toLowerCase().includes(q) ||
        (inv.booking?.booking_code || '').toLowerCase().includes(q) ||
        (inv.booking?.pickup_location || '').toLowerCase().includes(q) ||
        (inv.booking?.drop_location || '').toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [activeTab, invoices, search]);

  const handleDownloadPdf = async (e: React.MouseEvent, id: string, number: string) => {
    e.stopPropagation();
    try {
      const response = await axiosInstance.get(`/invoices/${id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showToast('Failed to download PDF invoice', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">My Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">View, track, and pay your ride invoices</p>
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
            placeholder="Search by invoice number, booking code, route..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-3xl mb-3 text-blue-500" />
            <p className="text-sm">Loading invoices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center text-gray-400">
            <FontAwesomeIcon icon={faFileInvoice} className="text-5xl mb-4 text-gray-300" />
            <h3 className="font-semibold text-gray-700 mb-1">No invoices found</h3>
            <p className="text-sm">We couldn't find any invoices matching the criteria.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Invoice Info</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Booking Ref</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Route Details</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Amount</th>
                    <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((inv) => (
                    <tr 
                      key={inv.id} 
                      onClick={() => navigate(`/customer/invoices/${inv.id}`)}
                      className="hover:bg-gray-50 cursor-pointer transition"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{inv.invoice_number}</div>
                        <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-[10px]" />
                          {new Date(inv.issued_at).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600">
                        {inv.booking?.booking_code || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-700 truncate max-w-xs">{inv.booking?.pickup_location || '—'}</div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">to {inv.booking?.drop_location || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          ₹{Number(inv.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(inv.status)}`}>
                          {inv.status === 'payment_pending' ? 'Pending' : inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/customer/invoices/${inv.id}`)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Invoice"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </button>
                          <button
                            onClick={(e) => handleDownloadPdf(e, inv.id, inv.invoice_number)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition"
                            title="Download PDF"
                          >
                            <FontAwesomeIcon icon={faDownload} />
                          </button>
                          {['payment_pending', 'issued'].includes(inv.status) && (
                            <button
                              onClick={() => navigate(`/customer/invoices/${inv.id}`)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Pay Now"
                            >
                              <FontAwesomeIcon icon={faCreditCard} />
                            </button>
                          )}
                        </div>
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

export default CustomerInvoices;
