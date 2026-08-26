import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faSpinner, faFileInvoice, faCircle, faRefresh, faEye } from '@fortawesome/free-solid-svg-icons';

type InvTab = 'all' | 'pending' | 'paid';

interface Invoice {
  invoiceId: string;
  invoiceNumber?: string;
  invoiceAmount?: number | string;
  invoiceDate?: string;
  dueDate?: string;
  companyName?: string;
  userName?: string;
  status?: string;
  paymentId?: string;
}

const TAB_CONFIG: { key: InvTab; label: string; color: string }[] = [
  { key: 'all',     label: 'All Invoices', color: 'bg-gray-500' },
  { key: 'pending', label: 'Pending',      color: 'bg-yellow-500' },
  { key: 'paid',    label: 'Paid',         color: 'bg-green-500' },
];

const InvoiceList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<InvTab>('all');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filtered, setFiltered] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchInvoices = useCallback(async (tab: InvTab) => {
    setLoading(true);
    try {
      let url = '/invoices';
      if (tab === 'paid') url = '/invoices?status=paid';
      else if (tab === 'pending') url = '/invoices?status=payment_pending';
      const res = await axiosInstance.get(url);
      const rawData = res.data?.data || [];
      const data: Invoice[] = rawData.map((inv: any) => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        invoiceAmount: inv.total_amount,
        invoiceDate: inv.issued_at,
        dueDate: inv.issued_at,
        companyName: inv.booking?.organization?.name || '—',
        userName: inv.booking?.customer?.name || '—',
        status: inv.status === 'payment_pending' ? 'pending' : inv.status,
      }));
      setInvoices(data);
      setFiltered(data);
    } catch {
      showToast('Failed to load invoices', 'error');
      setInvoices([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(activeTab); }, [activeTab, fetchInvoices]);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(invoices); return; }
    setFiltered(invoices.filter((inv) =>
      [inv.invoiceNumber, inv.companyName, inv.userName].some((f) => (f || '').toLowerCase().includes(q))
    ));
  }, [search, invoices]);

  const STATUS_BADGE: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid:    'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track and manage all platform invoices</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-5">
        {TAB_CONFIG.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key ? `${tab.color} text-white shadow-md` : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}>
            {activeTab === tab.key && <FontAwesomeIcon icon={faCircle} className="text-[8px]" />}
            {tab.label}
          </button>
        ))}
        <button onClick={() => fetchInvoices(activeTab)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition">
          <FontAwesomeIcon icon={faRefresh} />
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search invoices..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3" />Loading invoices...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faFileInvoice} className="text-4xl mb-3" />
            <p className="font-medium">No invoices found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['#', 'Invoice #', 'Client', 'Date', 'Due Date', 'Amount', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((inv, i) => {
                  const st = inv.status || (inv.paymentId ? 'paid' : 'pending');
                  return (
                    <tr key={inv.invoiceId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-800 text-xs">{inv.invoiceNumber || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{inv.companyName || inv.userName || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {inv.invoiceAmount ? `₹${Number(inv.invoiceAmount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[st.toLowerCase()] || 'bg-gray-100 text-gray-600'}`}>
                          {st}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/invoice/pending`)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} invoice{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default InvoiceList;
