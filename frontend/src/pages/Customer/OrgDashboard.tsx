import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTachometerAlt, faSpinner, faHandshake, 
  faRoute, faFileInvoiceDollar, faFileInvoice, 
  faDownload 
} from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

interface Contract {
  id: string;
  contract_name: string;
  pricing_model: string;
  start_date: string;
  end_date: string;
  pickup_location: string;
  drop_location: string;
  service_days: string;
  hours_per_day: number | string;
  km_per_day: number | string;
  rate_per_km?: number | string;
  monthly_fixed_amount?: number | string;
  tax_rate_percent?: number | string;
  status: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  billing_period: string;
  subtotal: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  status: string;
  issued_at: string;
}

const OrgDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // States
  const [contract, setContract] = useState<Contract | null>(null);
  const [monthStats, setMonthStats] = useState({
    totalTrips: 0,
    totalKm: 0.00,
    totalHours: 0.00
  });
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch user profile to get organization context
      const profileRes = await axiosInstance.get('/auth/me');
      const user = profileRes.data?.data;
      
      if (!user || !user.organization_id) {
        showToast('No organization linkage found for user.', 'warn');
        setLoading(false);
        return;
      }

      // 2. Fetch contracts scoped to manager organization
      const contractsRes = await axiosInstance.get('/contracts');
      const activeContract = (contractsRes.data?.data || []).find(
        (c: any) => c.status.toLowerCase() === 'active'
      );
      setContract(activeContract || null);

      // 3. Fetch completed contract bookings for current month usage estimation
      const now = new Date();
      const currentYearMonth = now.toISOString().substring(0, 7); // "YYYY-MM"
      const startOfMonth = `${currentYearMonth}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const endOfMonth = `${currentYearMonth}-${lastDay.toString().padStart(2, '0')}`;

      const bookingsRes = await axiosInstance.get('/bookings');
      const allBookings = bookingsRes.data?.data || [];
      
      const contractBookings = allBookings.filter((b: any) => {
        return b.organization_id === user.organization_id &&
               b.status === 'completed' &&
               b.booking_date >= startOfMonth &&
               b.booking_date <= endOfMonth;
      });

      const totalTrips = contractBookings.length;
      const totalKm = contractBookings.reduce((sum: number, b: any) => sum + parseFloat(b.actual_distance_km || 0), 0);
      const totalSeconds = contractBookings.reduce((sum: number, b: any) => sum + (b.trip?.duration_seconds || 0), 0);
      const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

      setMonthStats({ totalTrips, totalKm, totalHours });

      // 4. Fetch past invoices
      const invoicesRes = await axiosInstance.get('/invoices');
      const orgInvoices = (invoicesRes.data?.data || []).filter(
        (inv: any) => inv.invoice_type === 'contract_monthly'
      );
      setInvoices(orgInvoices);

    } catch {
      showToast('Failed to load dashboard metrics.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

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

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'payment_pending':
      case 'issued':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-500 mb-3" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="bg-blue-600 text-white p-3.5 rounded-xl shadow-sm">
          <FontAwesomeIcon icon={faTachometerAlt} className="text-xl" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Organization Console</h1>
          <p className="text-xs text-gray-500 mt-0.5">Recurring contract status and monthly billing dashboard</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Active Contract & Monthly Usage */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Contract Info */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faHandshake} className="text-blue-500" />
              Active Transport Contract
            </h2>
            
            {contract ? (
              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
                  <span className="font-bold text-gray-900 text-base">{contract.contract_name}</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 border border-green-200 text-green-700">Active</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400 block font-semibold">Pricing Model</span>
                    <span className="text-gray-800 font-bold uppercase">{contract.pricing_model.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Terms</span>
                    <span className="text-gray-800 font-bold">
                      {contract.pricing_model === 'PER_KM' 
                        ? `₹${parseFloat(contract.rate_per_km as string).toFixed(2)}/KM` 
                        : `₹${parseFloat(contract.monthly_fixed_amount as string).toLocaleString('en-IN')}/Month`}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Service Days</span>
                    <span className="text-gray-800 font-bold truncate block">{contract.service_days}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Contract Range</span>
                    <span className="text-gray-800 font-bold">
                      {new Date(contract.start_date).toLocaleDateString('en-IN')} to {new Date(contract.end_date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Scheduled Hours</span>
                    <span className="text-gray-800 font-bold">{contract.hours_per_day} Hrs/Day</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-semibold">Target Route</span>
                    <span className="text-gray-800 font-bold truncate block" title={`${contract.pickup_location} to ${contract.drop_location}`}>
                      {contract.pickup_location} → {contract.drop_location}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 text-sm">
                No active contracts set up for your organization at this time.
              </div>
            )}
          </div>

          {/* Current Month Statistics */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faRoute} className="text-blue-500" />
              Usage This Month
            </h2>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                <span className="text-xs text-gray-500 font-semibold block mb-1">Completed Trips</span>
                <span className="text-2xl font-black text-blue-900">{monthStats.totalTrips}</span>
              </div>
              
              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                <span className="text-xs text-gray-500 font-semibold block mb-1">Total Distance</span>
                <span className="text-2xl font-black text-blue-900">{monthStats.totalKm.toFixed(2)} <span className="text-sm font-bold">KM</span></span>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/50">
                <span className="text-xs text-gray-500 font-semibold block mb-1">Total Hours</span>
                <span className="text-2xl font-black text-blue-900">{monthStats.totalHours.toFixed(2)} <span className="text-sm font-bold">Hrs</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Invoices & Bills */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm h-full flex flex-col justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-blue-500" />
                Monthly Invoices Statement
              </h2>

              {invoices.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-xs">
                  No monthly contract invoices have been generated yet.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {invoices.map((inv) => (
                    <div 
                      key={inv.id} 
                      onClick={() => navigate(`/customer/invoices/${inv.id}`)}
                      className="p-3 border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 rounded-lg cursor-pointer transition flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <FontAwesomeIcon icon={faFileInvoice} className="text-gray-400 text-sm" />
                        <div>
                          <span className="font-bold text-gray-800 block text-xs">{inv.invoice_number}</span>
                          <span className="text-[10px] text-gray-400 font-semibold uppercase">{inv.billing_period}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-extrabold text-xs text-gray-900 block">
                            ₹{parseFloat(inv.total_amount as string).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                          <span className={`inline-flex text-[9px] font-bold border rounded-full px-1.5 py-0.5 mt-0.5 ${getStatusBadge(inv.status)}`}>
                            {inv.status === 'payment_pending' ? 'Pending' : inv.status}
                          </span>
                        </div>
                        <button
                          onClick={(e) => handleDownloadPdf(e, inv.id, inv.invoice_number)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition"
                          title="Download PDF"
                        >
                          <FontAwesomeIcon icon={faDownload} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/customer/invoices')}
              className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg mt-6 shadow transition"
            >
              Manage & Settle Invoices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgDashboard;
