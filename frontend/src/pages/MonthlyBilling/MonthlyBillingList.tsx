import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faSpinner, faCalculator, faCheckCircle, 
  faFileInvoice, faSearch, faInfoCircle 
} from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

interface ContractUsage {
  contractId: string;
  contractName: string;
  organizationId: string;
  organizationName: string;
  pricingModel: string;
  ratePerKm: number;
  monthlyFixedAmount: number;
  taxRatePercent: number;
  serviceDays: string;
  numberVehicles: number;
  totalTrips: number;
  totalKm: number;
  totalHours: number;
  calculatedBase: number;
  calculatedTax: number;
  calculatedTotal: number;
  invoiceId: string | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
}

const MonthlyBillingList: React.FC = () => {
  const navigate = useNavigate();

  const [month, setMonth] = useState(() => {
    const d = new Date();
    // Default to previous month
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().substring(0, 7);
  });

  const [usages, setUsages] = useState<ContractUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchMonthlyBilling = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Get all contracts
      const contractsRes = await axiosInstance.get('/contracts');
      const activeContracts = (contractsRes.data?.data || []).filter(
        (c: any) => c.status.toLowerCase() === 'active'
      );

      // 2. Get all invoices for the selected billing period to match generated invoices
      const invoicesRes = await axiosInstance.get(`/invoices?status=`);
      const periodInvoices = (invoicesRes.data?.data || []).filter(
        (inv: any) => inv.invoice_type === 'contract_monthly' && inv.billing_period === month
      );

      // 3. For each active contract, fetch completed trip history during the selected month range
      // and calculate parameters locally for review
      const startOfMonth = `${month}-01`;
      // Calculate end of month
      const parts = month.split('-');
      const y = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const lastDay = new Date(y, m, 0).getDate();
      const endOfMonth = `${month}-${lastDay.toString().padStart(2, '0')}`;

      // Fetch bookings to count trips and mileage
      const bookingsRes = await axiosInstance.get('/bookings');
      const allBookings = bookingsRes.data?.data || [];

      const usageList: ContractUsage[] = activeContracts.map((c: any) => {
        // Filter bookings for this contract in this date range
        const contractBookings = allBookings.filter((b: any) => {
          return b.contract_id === c.id && 
                 b.status === 'completed' && 
                 b.booking_date >= startOfMonth && 
                 b.booking_date <= endOfMonth;
        });

        const totalTrips = contractBookings.length;
        const totalKm = contractBookings.reduce((sum: number, b: any) => sum + parseFloat(b.actual_distance_km || 0), 0);
        
        // Sum durations if available in nested trip
        const totalSeconds = contractBookings.reduce((sum: number, b: any) => {
          return sum + (b.trip?.duration_seconds || 0);
        }, 0);
        const totalHours = Math.round((totalSeconds / 3600) * 100) / 100;

        // Pricing logic
        const pricingModel = c.pricing_model || 'PER_KM';
        const ratePerKm = parseFloat(c.rate_per_km || 0);
        const monthlyFixedAmount = parseFloat(c.monthly_fixed_amount || 0);
        
        let calculatedBase = 0;
        if (pricingModel === 'PER_KM') {
          calculatedBase = totalKm * ratePerKm;
        } else {
          calculatedBase = monthlyFixedAmount;
        }

        const taxRatePercent = parseFloat(c.tax_rate_percent || 0);
        const calculatedTax = Math.round((calculatedBase * taxRatePercent / 100) * 100) / 100;
        const calculatedTotal = calculatedBase + calculatedTax;

        // Find existing generated invoice
        const matchedInvoice = periodInvoices.find((inv: any) => inv.contract_id === c.id);

        return {
          contractId: c.id,
          contractName: c.contract_name || '—',
          organizationId: c.organization_id,
          organizationName: c.organization?.name || '—',
          pricingModel,
          ratePerKm,
          monthlyFixedAmount,
          taxRatePercent,
          serviceDays: c.service_days || '—',
          numberVehicles: c.number_of_vehicles || 1,
          totalTrips,
          totalKm,
          totalHours,
          calculatedBase,
          calculatedTax,
          calculatedTotal,
          invoiceId: matchedInvoice ? matchedInvoice.id : null,
          invoiceNumber: matchedInvoice ? matchedInvoice.invoice_number : null,
          invoiceStatus: matchedInvoice ? matchedInvoice.status : null,
        };
      });

      setUsages(usageList);
    } catch {
      showToast('Failed to load monthly usage logs.', 'error');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchMonthlyBilling();
  }, [fetchMonthlyBilling]);

  const handleGenerateInvoice = async (u: ContractUsage) => {
    setProcessingId(u.contractId);
    try {
      const res = await axiosInstance.post('/invoices/generate-monthly', {
        contract_id: u.contractId,
        billing_period: month
      });
      showToast(res.data?.message || 'Monthly contract invoice generated successfully!', 'success');
      fetchMonthlyBilling();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Invoice generation failed.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDownloadPdf = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const response = await axiosInstance.get(`/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      showToast('Failed to download invoice PDF', 'error');
    }
  };

  const filteredUsages = usages.filter((u) => 
    u.contractName.toLowerCase().includes(search.toLowerCase()) ||
    u.organizationName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Monthly Contract Invoicing</h1>
            <p className="text-sm text-gray-500 mt-0.5">Audit recurring transport usages and process month-end invoices</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-500 flex items-center gap-1.5">
              <FontAwesomeIcon icon={faCalendarAlt} /> Billing Month:
            </span>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by contract or organization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Usage Grid */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-gray-400">
              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3 text-blue-500" />Loading billing records...
            </div>
          ) : filteredUsages.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <FontAwesomeIcon icon={faCalculator} className="text-4xl mb-3 text-gray-300" />
              <p className="font-medium text-gray-600">No active contracts found for calculation</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4 text-left">Contract / Client</th>
                    <th className="px-6 py-4 text-left">Pricing Model</th>
                    <th className="px-6 py-4 text-left">Month Activity</th>
                    <th className="px-6 py-4 text-left">Calculated Fare</th>
                    <th className="px-6 py-4 text-left">Invoice Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredUsages.map((u) => (
                    <tr key={u.contractId} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800 block text-sm">{u.contractName}</span>
                        <span className="text-xs text-gray-500 font-medium block mt-0.5">{u.organizationName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-100">
                          {u.pricingModel === 'PER_KM' ? 'Per KM' : 'Fixed Monthly'}
                        </span>
                        <span className="text-xs text-gray-400 block mt-1">
                          {u.pricingModel === 'PER_KM' ? `₹${u.ratePerKm.toFixed(2)}/KM` : `₹${u.monthlyFixedAmount.toLocaleString('en-IN')}/Month`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-700 space-y-0.5">
                          <div>Trips: <span className="font-bold">{u.totalTrips}</span></div>
                          <div>Distance: <span className="font-bold">{u.totalKm.toFixed(2)} KM</span></div>
                          <div>Hours: <span className="font-bold">{u.totalHours.toFixed(2)} Hrs</span></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-700 space-y-0.5">
                          <div>Subtotal: <span className="font-semibold">₹{u.calculatedBase.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                          <div>Tax ({u.taxRatePercent}%): <span className="text-gray-400">₹{u.calculatedTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                          <div className="font-extrabold text-blue-900 border-t border-gray-100 pt-0.5 mt-0.5">
                            Total: ₹{u.calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.invoiceId ? (
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 border border-green-200 px-2.5 py-1 rounded-full w-max">
                              <FontAwesomeIcon icon={faCheckCircle} /> Generated
                            </span>
                            <span className="font-mono text-[10px] text-gray-400 font-bold">{u.invoiceNumber} ({u.invoiceStatus})</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-yellow-700 bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                            <FontAwesomeIcon icon={faInfoCircle} /> Unbilled
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {u.invoiceId ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/invoices/${u.invoiceId}`)}
                              className="text-xs font-bold bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-1.5 px-3 rounded-lg shadow-sm transition flex items-center gap-1"
                            >
                              <FontAwesomeIcon icon={faFileInvoice} /> View Invoice
                            </button>
                            <button
                              onClick={() => handleDownloadPdf(u.invoiceId!, u.invoiceNumber!)}
                              className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-3 rounded-lg shadow-sm transition"
                            >
                              Download PDF
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerateInvoice(u)}
                            disabled={processingId === u.contractId}
                            className="text-xs font-extrabold bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-1.5 ml-auto"
                          >
                            {processingId === u.contractId ? (
                              <FontAwesomeIcon icon={faSpinner} spin />
                            ) : (
                              <FontAwesomeIcon icon={faCalculator} />
                            )}
                            Generate Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MonthlyBillingList;
