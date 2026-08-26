import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';

interface Invoice {
  invoiceId: string;
  invoiceNumber?: string;
  invoiceAmount?: number | string;
  companyName?: string;
}

const AddPayment: React.FC = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [form, setForm] = useState({
    invoiceId: '',
    amount: '',
    paymentMode: 'Cash',
    transactionId: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/invoices?status=payment_pending').then((res) => {
      const raw = res.data?.data || [];
      const formatted = raw.map((inv: any) => ({
        invoiceId: inv.id,
        invoiceNumber: inv.invoice_number,
        invoiceAmount: inv.total_amount,
        companyName: inv.booking?.organization?.name || inv.booking?.customer?.name || 'Individual Customer',
      }));
      setInvoices(formatted);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.invoiceId || !form.amount) {
      showToast('Invoice and amount are required', 'error');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post(`/invoices/${form.invoiceId}/pay/offline`, {
        paymentMode: form.paymentMode,
        amount: parseFloat(form.amount),
        transactionId: form.transactionId,
        notes: form.notes,
      });
      showToast('Payment recorded successfully!', 'success');
      navigate('/payments');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedInvoice = invoices.find((inv) => inv.invoiceId === form.invoiceId);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Record Payment</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record an offline or manual payment against an invoice</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Invoice <span className="text-red-500">*</span></label>
            <select name="invoiceId" value={form.invoiceId} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select pending invoice</option>
              {invoices.map((inv) => (
                <option key={inv.invoiceId} value={inv.invoiceId}>
                  {inv.invoiceNumber || inv.invoiceId.slice(0, 8)} — {inv.companyName || 'Unknown'} — ₹{Number(inv.invoiceAmount || 0).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
            {selectedInvoice && (
              <div className="mt-2 px-3 py-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                Invoice amount: <strong>₹{Number(selectedInvoice.invoiceAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount Paid (₹) <span className="text-red-500">*</span></label>
              <input type="number" name="amount" value={form.amount} onChange={handleChange} required min="1" step="0.01"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.00" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Mode <span className="text-red-500">*</span></label>
              <select name="paymentMode" value={form.paymentMode} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Cash</option>
                <option>Cheque</option>
                <option>Bank Transfer</option>
                <option>NEFT</option>
                <option>RTGS</option>
                <option>UPI</option>
                <option>Online</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Transaction / Reference ID</label>
              <input name="transactionId" value={form.transactionId} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Cheque no., UTR, or transaction ID" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60">
              {loading ? 'Recording...' : 'Record Payment'}
            </button>
            <button type="button" onClick={() => navigate('/payments')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPayment;
