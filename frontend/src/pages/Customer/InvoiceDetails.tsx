import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faDownload, faSpinner, faCheckCircle, 
  faExclamationTriangle, faFileInvoiceDollar, faCreditCard, faMoneyBillAlt 
} from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

interface Payment {
  id: string;
  amount: number | string;
  payment_method: string;
  transaction_id: string;
  status: string;
  paid_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  subtotal: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  status: string;
  issued_at: string;
  paid_at?: string;
  booking?: {
    booking_code: string;
    booking_date: string;
    booking_time: string;
    pickup_location: string;
    drop_location: string;
    estimated_distance_km: number | string;
    actual_distance_km?: number | string;
    customer?: {
      name: string;
      email: string;
      mobile: string;
    };
    vehicle?: {
      vehicle_name: string;
      vehicle_number: string;
      price_per_km: number | string;
    };
    driver?: {
      name: string;
    };
    trip?: {
      duration_seconds?: number;
    };
  };
  payments?: Payment[];
}

const CustomerInvoiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [sandboxTxnId, setSandboxTxnId] = useState('');

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/invoices/${id}`);
      setInvoice(res.data?.data || null);
    } catch {
      showToast('Failed to load invoice details', 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetails();
  }, [id, fetchDetails]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      const response = await axiosInstance.get(`/invoices/${invoice.id}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoice.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showToast('Failed to download PDF invoice', 'error');
    }
  };

  const handleCashPayment = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      const res = await axiosInstance.post(`/invoices/${invoice.id}/pay/cash`);
      showToast(res.data?.message || 'Cash payment initiated successfully.', 'success');
      fetchDetails();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to initiate cash payment.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleOnlinePaymentInit = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      const res = await axiosInstance.post(`/invoices/${invoice.id}/pay/online`);
      showToast(res.data?.message || 'Online payment checkout session created.', 'success');
      
      // Extract mock checkout txn ID to allow sandbox simulation
      // We parse transaction ID from mock URL or read from pending payments
      // We open sandbox simulation modal
      const parts = new URL(res.data?.paymentUrl);
      const tx = parts.searchParams.get('tx') || '';
      setSandboxTxnId(tx);
      setShowSandboxModal(true);
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to initiate online payment.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const handleSandboxWebhookSimulate = async (success: boolean) => {
    setShowSandboxModal(false);
    setPaying(true);
    try {
      // Simulate webhook payload to the public webhook endpoint
      await axiosInstance.post('/payments/webhook', {
        transaction_id: sandboxTxnId,
        status: success ? 'success' : 'failed'
      });
      if (success) {
        showToast('Sandbox payment simulation completed successfully!', 'success');
      } else {
        showToast('Sandbox payment simulation reported failure.', 'error');
      }
      fetchDetails();
    } catch (err: any) {
      showToast('Webhook simulation failed.', 'error');
    } finally {
      setPaying(false);
    }
  };

  const formatDuration = (secs?: number) => {
    if (secs === undefined || secs === null) return '—';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500 mb-3" />
          <p>Fetching invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full text-center bg-white rounded-xl border border-gray-100 p-8 shadow-sm">
          <FontAwesomeIcon icon={faExclamationTriangle} className="text-4xl text-yellow-500 mb-3" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Invoice Not Found</h2>
          <p className="text-sm text-gray-500 mb-4">The invoice you are trying to view does not exist or you do not have permission to access it.</p>
          <button onClick={() => navigate('/customer/invoices')} className="text-sm text-blue-600 font-semibold hover:underline">
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const actualDistance = invoice.booking?.actual_distance_km ?? invoice.booking?.estimated_distance_km ?? 0;
  const ratePerKm = invoice.booking?.vehicle?.price_per_km ?? 0;

  // Find confirmed paid payment details
  const confirmedPayment = invoice.payments?.find(p => p.status === 'success');
  const pendingCashPayment = invoice.payments?.find(p => p.status === 'pending' && p.payment_method === 'cash');

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation / Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/customer/invoices')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition font-medium"
          >
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Invoices
          </button>
          
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-semibold shadow-sm transition"
          >
            <FontAwesomeIcon icon={faDownload} /> Download PDF
          </button>
        </div>

        {/* Invoice Container */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          {/* Header Row */}
          <div className="bg-blue-900 text-white p-6 md:p-8 flex flex-col md:flex-row justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-300 text-xl" />
                <span className="text-xs font-bold tracking-wider text-blue-300 uppercase">Ride Invoice</span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold">{invoice.invoice_number}</h2>
              <p className="text-xs text-blue-200 mt-0.5">Issued on: {new Date(invoice.issued_at).toLocaleDateString('en-IN')}</p>
            </div>
            
            <div className="md:text-right flex flex-col justify-between">
              <div>
                <span className="text-xs text-blue-200 block">Total Amount</span>
                <span className="text-2xl md:text-3xl font-extrabold">
                  ₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="mt-2.5">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                  invoice.status === 'paid' 
                    ? 'bg-green-800 text-green-100 border-green-700' 
                    : (invoice.status === 'cancelled' ? 'bg-red-800 text-red-100 border-red-700' : 'bg-yellow-800 text-yellow-100 border-yellow-700')
                }`}>
                  Status: {invoice.status === 'payment_pending' ? 'Pending' : invoice.status}
                </span>
              </div>
            </div>
          </div>

          {/* Details Body */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-gray-100">
            {/* Operator and Customer Meta */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billing Details</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-400 block">Customer Name</span>
                  <span className="text-sm font-semibold text-gray-800">{invoice.booking?.customer?.name || '—'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Contact Info</span>
                  <span className="text-sm text-gray-700">
                    {invoice.booking?.customer?.mobile || '—'} | {invoice.booking?.customer?.email || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trip Specifics */}
            <div>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Trip Overview</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-gray-400 block">Booking Reference</span>
                  <span className="font-mono text-gray-800 font-semibold">{invoice.booking?.booking_code}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Route</span>
                  <span className="text-gray-700 block font-medium">Pickup: {invoice.booking?.pickup_location}</span>
                  <span className="text-gray-700 block font-medium">Drop: {invoice.booking?.drop_location}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block">Date & Time</span>
                  <span className="text-gray-700">
                    {invoice.booking?.booking_date ? new Date(invoice.booking.booking_date).toLocaleDateString('en-IN') : '—'} at {invoice.booking?.booking_time || '—'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Resource & Pricing Details */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Trip Billing Parameters</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <span className="text-xs text-gray-400 block">Vehicle Model</span>
                <span className="text-sm font-semibold text-gray-800">{invoice.booking?.vehicle?.vehicle_name || '—'}</span>
                <span className="text-xs text-gray-400 block mt-0.5">({invoice.booking?.vehicle?.vehicle_number || '—'})</span>
              </div>
              
              <div>
                <span className="text-xs text-gray-400 block">Assigned Driver</span>
                <span className="text-sm font-semibold text-gray-800">{invoice.booking?.driver?.name || '—'}</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">Distance & Rate</span>
                <span className="text-sm font-semibold text-gray-800">
                  {Number(actualDistance).toFixed(2)} KM
                </span>
                <span className="text-xs text-gray-400 block mt-0.5">@ ₹{Number(ratePerKm).toFixed(2)}/KM</span>
              </div>

              <div>
                <span className="text-xs text-gray-400 block">Duration</span>
                <span className="text-sm font-semibold text-gray-800">
                  {formatDuration(invoice.booking?.trip?.duration_seconds)}
                </span>
              </div>
            </div>
          </div>

          {/* Subtotal, Tax and Total */}
          <div className="p-6 md:p-8 bg-gray-50 flex justify-end">
            <div className="w-80 space-y-3.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{Number(invoice.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax:</span>
                <span>₹{Number(invoice.tax_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-blue-900 border-t border-gray-200 pt-3">
                <span>Total Amount:</span>
                <span>₹{Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Methods Section (When Invoice is unpaid) */}
        {invoice.status === 'payment_pending' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 md:p-8 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-1">Settlement Options</h3>
            <p className="text-xs text-gray-500 mb-6">Select a payment mode below to settle your invoice balance.</p>

            {pendingCashPayment ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 flex items-start gap-3">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-600 mt-0.5" />
                <div>
                  <span className="font-bold block">Cash Collection Awaiting Verification</span>
                  <span>You indicated cash collection for this trip. The dispatcher/operator must verify and confirm the cash receipt to settle the invoice.</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleOnlinePaymentInit}
                  disabled={paying}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-lg text-sm transition shadow disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faCreditCard} />
                  {paying ? 'Processing...' : 'Pay Online'}
                </button>

                <button
                  onClick={handleCashPayment}
                  disabled={paying}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-bold py-3.5 px-6 rounded-lg text-sm transition shadow disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faMoneyBillAlt} />
                  {paying ? 'Processing...' : 'Pay Cash'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Paid Receipt Summary (When invoice is paid) */}
        {invoice.status === 'paid' && confirmedPayment && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 md:p-8 shadow-sm">
            <div className="flex items-start gap-4">
              <FontAwesomeIcon icon={faCheckCircle} className="text-green-600 text-2xl mt-0.5" />
              <div className="flex-1">
                <h3 className="text-lg font-bold text-green-900 mb-2">Payment Receipt Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-sm text-green-800 mt-4">
                  <div>
                    <span className="font-medium text-green-700 block">Payment Date</span>
                    <span>{new Date(confirmedPayment.paid_at || invoice.paid_at || '').toLocaleString('en-IN')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 block">Payment Method</span>
                    <span className="uppercase">{confirmedPayment.payment_method}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 block">Transaction Reference</span>
                    <span className="font-mono text-xs">{confirmedPayment.transaction_id || 'CASH'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-700 block">Receipt ID</span>
                    <span className="font-mono text-xs">{confirmedPayment.id}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sandbox Simulation Modal */}
      {showSandboxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-yellow-500" />
              Sandbox Payment Gateway
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              An online session has been created. Simulate a response from the HDFC Sandbox Gateway below:
            </p>
            
            <div className="bg-gray-50 p-3 rounded-lg font-mono text-xs mb-6 text-gray-700 border border-gray-200">
              <span className="block text-[10px] text-gray-400 uppercase font-sans font-bold">Transaction Reference ID</span>
              {sandboxTxnId}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => handleSandboxWebhookSimulate(true)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-lg text-sm transition"
              >
                Simulate Success
              </button>
              <button
                onClick={() => handleSandboxWebhookSimulate(false)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg text-sm transition"
              >
                Simulate Failure
              </button>
            </div>
            
            <button
              onClick={() => setShowSandboxModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerInvoiceDetails;
