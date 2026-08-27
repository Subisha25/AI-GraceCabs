import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../components/AlertBox';
import PageLayout from '../../components/PageLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding, faPhone, faEnvelope, faMapMarkerAlt,
  faSpinner, faArrowLeft, faCheckCircle, faBan,
  faHandshake, faClipboardList, faFileInvoiceDollar,
  faHistory, faPlus, faReceipt, faCalculator, faMoneyBillWave
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

interface Contract {
  id: string;
  contract_name: string;
  start_date: string;
  end_date: string;
  billing_cycle: string;
  service_days: string;
  number_of_vehicles: number;
  rate_per_km: number;
  monthly_fixed_amount: number;
  pricing_model: string;
  tax_rate_percent: number;
  status: string;
  vehicle?: Vehicle;
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
  contract?: Contract;
  payments?: Payment[];
}

interface Organization {
  id: string;
  name: string;
  type: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  pickup_location: string;
  drop_location: string;
  status: string;
  contracts?: Contract[];
  bookings?: Booking[];
  invoices?: Invoice[];
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  started: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const OrganizationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState('');
  const [billingMonth, setBillingMonth] = useState('');

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/organizations/${id}`);
      if (res.data && res.data.success) {
        setOrg(res.data.data);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load organization details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  const toggleStatus = async () => {
    if (!org) return;
    setActionLoading(true);
    const newStatus = org.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await axiosInstance.put(`/organizations/${org.id}`, {
        name: org.name,
        type: org.type,
        contact_person: org.contact_person,
        email: org.email,
        phone: org.phone,
        address: org.address,
        pickup_location: org.pickup_location,
        drop_location: org.drop_location,
        billing_address: org.address,
        billing_contact_name: org.contact_person,
        billing_contact_email: org.email,
        billing_contact_phone: org.phone,
        status: newStatus
      });
      if (res.data && res.data.success) {
        showToast('Organization status updated successfully', 'success');
        setOrg({ ...org, status: newStatus });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update organization status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContractId || !billingMonth) {
      showToast('Please select both a contract and month.', 'warn');
      return;
    }
    try {
      setActionLoading(true);
      const res = await axiosInstance.post('/invoices/generate-monthly', {
        contract_id: selectedContractId,
        billing_period: billingMonth
      });
      if (res.data && res.data.success) {
        showToast(res.data.message || 'Invoice generated successfully!', 'success');
        setShowGenerateModal(false);
        fetchOrganizationDetails();
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
            <p className="text-gray-500 font-semibold">Loading organization details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!org) {
    return (
      <PageLayout>
        <div className="py-12 text-center text-gray-500 font-medium">
          Organization not found.
        </div>
      </PageLayout>
    );
  }

  const activeContracts = org.contracts?.filter(c => c.status.toLowerCase() === 'active') || [];
  const bookings = org.bookings || [];
  const upcomingTrips = bookings.filter(b => ['pending', 'accepted', 'confirmed', 'started'].includes(b.status.toLowerCase()));
  const completedTrips = bookings.filter(b => b.status.toLowerCase() === 'completed');
  const invoices = org.invoices || [];
  const payments = invoices.flatMap(inv => inv.payments || []);

  // Simple Month generator for Invoice filter
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
            onClick={() => navigate('/organizations')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1B4F8A] font-bold transition-all"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Organizations</span>
          </button>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Link
              to={`/contracts/add?organization_id=${org.id}`}
              className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Add Contract</span>
            </Link>

            <button
              onClick={() => {
                if (activeContracts.length === 0) {
                  showToast('Organization must have an active contract to generate invoices.', 'warn');
                  return;
                }
                setSelectedContractId(activeContracts[0].id);
                setShowGenerateModal(true);
              }}
              className="flex-1 sm:flex-none px-4 py-2 bg-[#1B4F8A] hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
            >
              <FontAwesomeIcon icon={faCalculator} />
              <span>Generate Monthly Invoice</span>
            </button>
          </div>
        </div>

        {/* Organization Info Details Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#1B4F8A]">
                <FontAwesomeIcon icon={faBuilding} className="text-xl" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{org.name}</h1>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-0.5">{org.type}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {org.status}
              </span>
              <button
                onClick={toggleStatus}
                disabled={actionLoading}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  org.status === 'active'
                    ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                    : 'border-green-200 text-green-600 bg-green-50 hover:bg-green-100'
                }`}
              >
                <FontAwesomeIcon icon={org.status === 'active' ? faBan : faCheckCircle} className="mr-1.5" />
                {org.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm text-gray-700">
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Contact Person</span>
              <span className="font-bold text-gray-800">{org.contact_person}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Mobile</span>
              <span className="font-bold text-gray-800">
                <FontAwesomeIcon icon={faPhone} className="mr-1 text-gray-400" />
                {org.phone}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Email</span>
              <span className="font-bold text-gray-800">
                <FontAwesomeIcon icon={faEnvelope} className="mr-1 text-gray-400" />
                {org.email}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Address</span>
              <span className="font-bold text-gray-800">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1 text-gray-400" />
                {org.address}
              </span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Pickup Location</span>
              <span className="font-bold text-gray-800">{org.pickup_location || '—'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Drop Location</span>
              <span className="font-bold text-gray-800">{org.drop_location || '—'}</span>
            </div>
          </div>
        </div>

        {/* Operational Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column (Contracts & Bookings) */}
          <div className="lg:col-span-2 space-y-6">

            {/* ACTIVE CONTRACTS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faHandshake} className="text-[#1B4F8A]" />
                Active Contracts ({activeContracts.length})
              </h2>

              {activeContracts.length === 0 ? (
                <div className="text-gray-400 italic text-sm py-2">No active contracts found for this organization.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-800">
                      <tr>
                        <th className="px-4 py-2 border-b">Contract Name</th>
                        <th className="px-4 py-2 border-b">Validity</th>
                        <th className="px-4 py-2 border-b">Cycle</th>
                        <th className="px-4 py-2 border-b">Rate</th>
                        <th className="px-4 py-2 border-b">Tax</th>
                        <th className="px-4 py-2 border-b text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeContracts.map(c => (
                        <tr key={c.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b font-semibold text-gray-800">{c.contract_name}</td>
                          <td className="px-4 py-3 border-b text-xs">
                            {c.start_date} to {c.end_date}
                          </td>
                          <td className="px-4 py-3 border-b uppercase">{c.billing_cycle || 'monthly'}</td>
                          <td className="px-4 py-3 border-b font-mono">
                            {c.pricing_model === 'PER_KM' ? `₹${c.rate_per_km}/km` : `₹${c.monthly_fixed_amount} Fixed`}
                          </td>
                          <td className="px-4 py-3 border-b">{c.tax_rate_percent}%</td>
                          <td className="px-4 py-3 border-b text-right">
                            <Link
                              to={`/contracts?search=${c.contract_name}`}
                              className="text-[#1B4F8A] hover:underline font-semibold"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* CONTRACT BOOKINGS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faClipboardList} className="text-[#1B4F8A]" />
                  Operational Bookings ({bookings.length})
                </h2>
                {activeContracts.length > 0 && (
                  <Link
                    to={`/booking/create?orgId=${org.id}&contractId=${activeContracts[0].id}`}
                    className="px-3 py-1.5 bg-[#1B4F8A] hover:bg-blue-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    <FontAwesomeIcon icon={faPlus} />
                    <span>Create Booking</span>
                  </Link>
                )}
              </div>

              {bookings.length === 0 ? (
                <div className="text-gray-400 italic text-sm py-2">No bookings registered for this organization yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700 font-normal">
                    <thead className="bg-gray-50 text-gray-800 font-semibold">
                      <tr>
                        <th className="px-4 py-2 border-b">Code</th>
                        <th className="px-4 py-2 border-b">Route</th>
                        <th className="px-4 py-2 border-b">Date / Time</th>
                        <th className="px-4 py-2 border-b">Vehicle</th>
                        <th className="px-4 py-2 border-b">Driver</th>
                        <th className="px-4 py-2 border-b">Status</th>
                        <th className="px-4 py-2 border-b text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(b => (
                        <tr key={b.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 border-b font-mono font-bold text-[#1B4F8A]">{b.booking_code}</td>
                          <td className="px-4 py-3 border-b text-xs max-w-[150px] truncate" title={`${b.pickup_location} → ${b.drop_location}`}>
                            {b.pickup_location} → {b.drop_location}
                          </td>
                          <td className="px-4 py-3 border-b text-xs">
                            {b.booking_date} @ {b.booking_time}
                          </td>
                          <td className="px-4 py-3 border-b text-xs">
                            {b.vehicle ? `${b.vehicle.vehicle_type} (${b.vehicle.vehicle_number})` : '—'}
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

          {/* Right Column (Billing, Invoices, Payments) */}
          <div className="space-y-6">

            {/* MONTHLY SUMMARY CARD */}
            <div className="bg-[#1B4F8A] text-white p-6 rounded-2xl border border-gray-100 shadow-md space-y-4">
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
                  <span>Total Invoiced Ledgers:</span>
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
                <div className="text-gray-400 italic text-sm py-2">No invoices issued for this organization.</div>
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PAYMENTS */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faHistory} className="text-indigo-500" />
                Payments Logs ({payments.length})
              </h2>

              {payments.length === 0 ? (
                <div className="text-gray-400 italic text-sm py-2">No payment transactions recorded.</div>
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
                  Select Contract
                </label>
                <select
                  value={selectedContractId}
                  onChange={(e) => setSelectedContractId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
                  required
                >
                  {activeContracts.map(c => (
                    <option key={c.id} value={c.id}>{c.contract_name}</option>
                  ))}
                </select>
              </div>

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
    </PageLayout>
  );
};

export default OrganizationDetails;
