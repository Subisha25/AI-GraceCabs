import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../components/AlertBox';
import PageLayout from '../../components/PageLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHandshake, faBuilding, faCar, faCalendarAlt,
  faSpinner, faArrowLeft, faCheckCircle, faBan,
  faClipboardList, faFileInvoiceDollar, faHistory,
  faPlus, faCalculator, faMoneyBillWave, faReceipt, faChartBar
} from '@fortawesome/free-solid-svg-icons';

interface Vehicle {
  id: string;
  vehicle_type: string;
  vehicle_number: string;
}

interface Driver {
  id: string;
  name: string;
  mobile: string;
}

interface Booking {
  id: string;
  booking_code: string;
  pickup_location: string;
  drop_location: string;
  booking_date: string;
  booking_time: string;
  status: string;
  estimated_fare: string;
  vehicle?: Vehicle;
  driver?: Driver;
}

interface Payment {
  id: string;
  amount: string;
  payment_method: string;
  status: string;
  paid_at: string;
}

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_type: string;
  total_amount: string;
  status: string;
  billing_period: string;
  payments?: Payment[];
  total_trips?: number;
  total_km?: string;
  rate_applied?: string;
  base_amount?: string;
  subtotal?: string;
  tax_amount?: string;
  tax_details?: any[];
}

interface Organization {
  id: string;
  name: string;
  type: string;
}

interface Contract {
  id: string;
  contract_name: string;
  start_date: string;
  end_date: string;
  billing_cycle: string;
  service_days: string;
  actual_service_days?: number;
  number_of_vehicles: number;
  rate_per_km: number;
  monthly_fixed_amount: number;
  pricing_model: string;
  tax_rate_percent: number;
  status: string;
  organization?: Organization;
  vehicle?: Vehicle;
  bookings?: Booking[];
  invoices?: Invoice[];
  stops?: any[];
  contract_taxes?: any[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  started: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const ContractDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [billingMonth, setBillingMonth] = useState('');
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleMonth, setScheduleMonth] = useState('');

  const handleGenerateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleMonth) {
      showToast('Please select a month.', 'warn');
      return;
    }
    try {
      setActionLoading(true);
      const res = await axiosInstance.post(`/contracts/${id}/generate-schedule`, {
        billing_period: scheduleMonth
      });
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Schedule generated successfully!', 'success');
        setShowScheduleModal(false);
        fetchContractDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to generate schedule.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/contracts/${id}`);
      if (res.data && res.data.success) {
        setContract(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load contract details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractDetails();
  }, [id]);

  const toggleStatus = async () => {
    if (!contract) return;
    setActionLoading(true);
    const newStatus = contract.status.toLowerCase() === 'active' ? 'draft' : 'active';
    try {
      const res = await axiosInstance.put(`/contracts/${contract.id}`, {
        organization_id: contract.organization?.id,
        contract_name: contract.contract_name,
        pricing_model: contract.pricing_model,
        start_date: contract.start_date,
        end_date: contract.end_date,
        working_days: 22, // default fallback
        pickup_location: (contract as any).pickup_location || 'N/A',
        drop_location: (contract as any).drop_location || 'N/A',
        rate_per_km: contract.rate_per_km,
        monthly_fixed_amount: contract.monthly_fixed_amount,
        status: newStatus,
        contract_type: (contract as any).contract_type || 'km_based'
      });
      if (res.data && res.data.success) {
        showToast('Contract status updated successfully', 'success');
        setContract({ ...contract, status: newStatus });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update contract status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingMonth) {
      showToast('Please select a billing month.', 'warn');
      return;
    }
    try {
      setActionLoading(true);
      const res = await axiosInstance.post('/invoices/generate-monthly', {
        contract_id: id,
        billing_period: billingMonth
      });
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Invoice generated successfully!', 'success');
        setShowGenerateModal(false);
        fetchContractDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to generate monthly invoice.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#1B4F8A] mb-3" />
            <p className="text-gray-500 font-semibold">Loading contract details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!contract) {
    return (
      <PageLayout>
        <div className="py-12 text-center text-gray-500 font-medium">
          Contract not found.
        </div>
      </PageLayout>
    );
  }

  const bookings = contract.bookings || [];
  const upcomingTrips = bookings.filter(b => ['pending', 'accepted', 'confirmed', 'started'].includes(b.status.toLowerCase()));
  const completedTrips = bookings.filter(b => b.status.toLowerCase() === 'completed');
  const invoices = contract.invoices || [];
  const payments = invoices.flatMap(inv => inv.payments || []);

  const currentYear = new Date().getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
    const val = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
    return { label, val };
  });

  return (
    <PageLayout>
      <AlertContainer />
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate('/contracts')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1B4F8A] font-bold transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Contracts</span>
          </button>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {contract.status.toLowerCase() === 'active' && (
              <>
                <Link
                  to={`/booking/create?orgId=${contract.organization?.id}&contractId=${contract.id}`}
                  className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlus} />
                  <span>Add Contract Booking</span>
                </Link>

                <button
                  onClick={() => setShowScheduleModal(true)}
                  className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
                >
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  <span>Generate Monthly Schedule</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                if (contract.status.toLowerCase() !== 'active') {
                  showToast('Contract must be ACTIVE to generate invoices.', 'warn');
                  return;
                }
                setShowGenerateModal(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#1B4F8A] hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faCalculator} />
              <span>Generate Monthly Invoice</span>
            </button>
          </div>
        </div>

        {/* Contract Info Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#1B4F8A]">
                <FontAwesomeIcon icon={faHandshake} className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{contract.contract_name}</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">
                  Client: <Link to={`/organizations/${contract.organization?.id}`} className="hover:underline text-[#1B4F8A] font-bold">{contract.organization?.name}</Link>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                contract.status.toLowerCase() === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {contract.status}
              </span>
              <button
                onClick={toggleStatus}
                disabled={actionLoading}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  contract.status.toLowerCase() === 'active'
                    ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                    : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                }`}
              >
                <FontAwesomeIcon icon={contract.status.toLowerCase() === 'active' ? faBan : faCheckCircle} className="mr-1.5" />
                {contract.status.toLowerCase() === 'active' ? 'Deactivate Contract' : 'Activate Contract'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-gray-700">
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Validity Period</span>
              <span className="font-bold text-gray-800">{contract.start_date} to {contract.end_date}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Billing Cycle</span>
              <span className="font-bold text-gray-800 uppercase">{contract.billing_cycle || 'monthly'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Service Days</span>
              <span className="font-bold text-gray-800">{contract.service_days || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Actual Service Days</span>
              <span className="font-bold text-gray-800">{contract.actual_service_days || 0} Day(s)</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Vehicles Count</span>
              <span className="font-bold text-gray-800">{contract.number_of_vehicles || 1} Vehicle(s)</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Pricing Model</span>
              <span className="font-bold text-gray-800">{contract.pricing_model === 'PER_KM' ? 'Per KM' : 'Fixed Monthly'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Rate</span>
              <span className="font-bold text-gray-850 font-mono">
                {contract.pricing_model === 'PER_KM' ? `₹${contract.rate_per_km}/km` : `₹${contract.monthly_fixed_amount} Fixed`}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Tax Rate</span>
              <span className="font-bold text-gray-800">{contract.tax_rate_percent}% GST</span>
            </div>
            {contract.vehicle && (
              <div>
                <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Allocated Vehicle Model</span>
                <span className="font-bold text-gray-850">
                  <FontAwesomeIcon icon={faCar} className="mr-1 text-gray-400" />
                  {contract.vehicle.vehicle_type} ({contract.vehicle.vehicle_number})
                </span>
              </div>
            )}
          </div>

          {/* Stops and Taxes Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
            {/* Route Stops Display */}
            <div className="space-y-2">
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider">Route Stops Sequence</span>
              {contract.stops && contract.stops.length > 0 ? (
                <div className="relative border-l-2 border-blue-100 ml-2 pl-4 space-y-3">
                  {contract.stops.map((stop: any, sIdx: number) => (
                    <div key={stop.id} className="relative text-xs">
                      <span className="absolute -left-[22px] top-0.5 w-2 h-2 bg-[#1B4F8A] border border-white rounded-full" />
                      <div className="font-bold text-gray-800">{sIdx + 1}. {stop.stop_name}</div>
                      <div className="text-gray-500 text-[11px]">{stop.address}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No intermediate stops configured. Direct route:</div>
              )}
            </div>

            {/* Selected Taxes Display */}
            <div className="space-y-2">
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider">Locked Selected Taxes</span>
              {contract.contract_taxes && contract.contract_taxes.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {contract.contract_taxes.map((t: any) => (
                    <span key={t.id} className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      {t.tax_name} ({t.tax_type} — {t.percentage}%)
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400 italic">No taxes applied to this contract.</div>
              )}
            </div>
          </div>
        </div>

        {/* Operational Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Bookings & Usage (Left Column) */}
          <div className="lg:col-span-2 space-y-6">

            {/* CONTRACT BOOKINGS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faClipboardList} className="text-[#1B4F8A]" />
                Contract Bookings ({bookings.length})
              </h2>

              {bookings.length === 0 ? (
                <div className="text-gray-400 italic text-sm py-2">No bookings registered for this contract.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800">
                      <tr>
                        <th className="px-4 py-2 border-b">Code</th>
                        <th className="px-4 py-2 border-b">Route</th>
                        <th className="px-4 py-2 border-b">Date / Time</th>
                        <th className="px-4 py-2 border-b">Driver</th>
                        <th className="px-4 py-2 border-b">Status</th>
                        <th className="px-4 py-2 border-b text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b font-mono font-bold text-[#1B4F8A]">{b.booking_code}</td>
                          <td className="px-4 py-3 border-b text-xs">
                            {b.pickup_location} → {b.drop_location}
                          </td>
                          <td className="px-4 py-3 border-b text-xs">
                            {b.booking_date} @ {b.booking_time}
                          </td>
                          <td className="px-4 py-3 border-b text-xs">
                            {b.driver ? b.driver.name : 'Unassigned'}
                          </td>
                          <td className="px-4 py-3 border-b">
                            <span className={`px-2 py-0.5 rounded text-xxs font-bold uppercase ${statusColors[b.status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-b text-right">
                            <Link
                              to={`/bookings/${b.id}`}
                              className="text-blue-600 hover:underline font-bold text-xs"
                            >
                              Dispatch
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Summaries & Invoicing (Right Column) */}
          <div className="space-y-6">

            {/* MONTHLY SUMMARY CARD */}
            <div className="bg-[#1B4F8A] text-white p-6 rounded-2xl shadow-md space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 pb-2 border-b border-white/10">
                <FontAwesomeIcon icon={faReceipt} className="text-white/80" />
                Monthly Usage Summary
              </h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/10 p-3 rounded-xl">
                  <span className="text-xxs uppercase text-white/60 block font-semibold">Total Trips</span>
                  <span className="text-2xl font-black">{bookings.length}</span>
                </div>
                <div className="bg-white/10 p-3 rounded-xl">
                  <span className="text-xxs uppercase text-white/60 block font-semibold">Completed Trips</span>
                  <span className="text-2xl font-black text-green-300">{completedTrips.length}</span>
                </div>
              </div>
              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between font-semibold">
                  <span>Upcoming Schedule:</span>
                  <span>{upcomingTrips.length} Rides</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total Issued Invoices:</span>
                  <span>{invoices.length} Invoices</span>
                </div>
              </div>
            </div>

            {/* INVOICES */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-emerald-500" />
                Monthly Invoices ({invoices.length})
              </h2>

              {invoices.length === 0 ? (
                <div className="text-gray-400 italic text-sm py-2">No invoices generated for this contract.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {invoices.map(inv => (
                    <div key={inv.id} className="p-3 border border-gray-100 rounded-xl space-y-2 hover:bg-gray-50 transition-all text-xs">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-800 font-mono">{inv.invoice_number}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${inv.status.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-gray-500 font-semibold">
                        Period: {inv.billing_period}
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-dashed border-gray-100">
                        <span className="font-extrabold text-[#1B4F8A] text-sm">₹{Number(inv.total_amount).toLocaleString()}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setExpandedInvoiceId(prev => prev === inv.id ? null : inv.id)}
                            className="text-blue-600 font-bold hover:underline bg-transparent border-0 cursor-pointer"
                          >
                            {expandedInvoiceId === inv.id ? 'Hide Details' : 'View Details'}
                          </button>
                          <a
                            href={`${axiosInstance.defaults.baseURL}/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 font-bold hover:underline"
                          >
                            PDF
                          </a>
                          <Link
                            to={`/invoices?search=${inv.invoice_number}`}
                            className="text-[#1B4F8A] font-bold hover:underline"
                          >
                            Pay Ledger
                          </Link>
                        </div>
                      </div>

                      {expandedInvoiceId === inv.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs space-y-2">
                          <div className="font-bold border-b border-gray-200 pb-1 text-gray-700">Billing Calculation Breakdown</div>
                          <div className="grid grid-cols-2 gap-y-1 text-gray-600">
                            <div>Contract Name:</div><div className="font-semibold text-right">{contract?.contract_name}</div>
                            <div>Organization:</div><div className="font-semibold text-right">{contract?.organization?.name}</div>
                            <div>Billing Period:</div><div className="font-semibold text-right">{inv.billing_period}</div>
                            <div>Total Completed Trips:</div><div className="font-semibold text-right">{inv.total_trips} Trips</div>
                            {contract?.pricing_model === 'PER_KM' && (
                              <>
                                <div>Total Distance:</div><div className="font-semibold text-right">{inv.total_km} KM</div>
                                <div>Rate Per KM:</div><div className="font-semibold text-right">₹{Number(inv.rate_applied).toFixed(2)} / KM</div>
                              </>
                            )}
                            <div>Base Amount:</div><div className="font-bold text-right">₹{Number(inv.base_amount || inv.subtotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                          </div>
                          
                          {inv.tax_details && inv.tax_details.length > 0 && (
                            <div className="border-t border-gray-200 pt-1.5 space-y-1">
                              <div className="font-bold text-gray-500 uppercase text-[10px] tracking-wider">Applied Taxes Breakdown</div>
                              {inv.tax_details.map((tax: any, tIdx: number) => (
                                <div key={tIdx} className="flex justify-between text-gray-600 font-semibold">
                                  <span>{tax.tax_name} ({tax.tax_type} — {tax.percentage}%)</span>
                                  <span>₹{Number(tax.amount).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="border-t border-gray-200 pt-1.5 grid grid-cols-2 gap-y-1 font-bold text-gray-700">
                            <div>Subtotal:</div><div className="text-right">₹{Number(inv.subtotal).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                            <div>Total Tax:</div><div className="text-right">₹{Number(inv.tax_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                            <div className="text-[#1B4F8A] text-sm">Grand Total:</div><div className="text-[#1B4F8A] text-sm text-right">₹{Number(inv.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAYMENTS LOG */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faHistory} className="text-indigo-500" />
                Payments Logs ({payments.length})
              </h2>

              {payments.length === 0 ? (
                <div className="text-gray-400 italic text-sm py-2">No payments recorded.</div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {payments.map(pay => (
                    <div key={pay.id} className="p-3 border border-gray-100 rounded-xl space-y-1.5 text-xs hover:bg-gray-50">
                      <div className="flex justify-between font-bold">
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <FontAwesomeIcon icon={faMoneyBillWave} />
                          ₹{Number(pay.amount).toLocaleString()}
                        </span>
                        <span className="text-gray-400">{new Date(pay.paid_at || '').toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between text-gray-500 font-semibold">
                        <span>Method: {pay.payment_method.toUpperCase()}</span>
                        <span>{pay.status.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* GENERATE MONTHLY INVOICE MODAL */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faCalculator} className="text-[#1B4F8A]" />
              Generate Monthly Invoice
            </h2>
            <p className="text-sm text-gray-500">
              Calculate completed trips and issue a monthly invoice for this contract.
            </p>

            <form onSubmit={handleGenerateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Select Billing Month
                </label>
                <select
                  value={billingMonth}
                  onChange={(e) => setBillingMonth(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                  required
                >
                  <option value="">-- Choose Month --</option>
                  {months.map(m => (
                    <option key={m.val} value={m.val}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-[#1B4F8A] hover:bg-blue-800 text-white rounded-xl font-bold transition-all text-sm"
                >
                  {actionLoading ? 'Generating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* GENERATE MONTHLY SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-[#1B4F8A]" />
              Generate Monthly Schedule
            </h2>
            <p className="text-sm text-gray-500">
              Create bookings automatically for all valid service days of the selected month.
            </p>

            <form onSubmit={handleGenerateSchedule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Select Month
                </label>
                <select
                  value={scheduleMonth}
                  onChange={(e) => setScheduleMonth(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                  required
                >
                  <option value="">-- Choose Month --</option>
                  {months.map(m => (
                    <option key={m.val} value={m.val}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all text-sm"
                >
                  {actionLoading ? 'Generating...' : 'Generate Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default ContractDetails;
