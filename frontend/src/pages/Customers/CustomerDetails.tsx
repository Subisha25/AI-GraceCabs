import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faPhone, faEnvelope, faCalendarAlt,
  faSpinner, faArrowLeft, faCheckCircle, faBan,
  faHistory, faRoute, faCar, faClock, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

interface CustomerDetail {
  id: string;
  name: string;
  email: string;
  mobile: string;
  status: string;
  createdAt: string;
}

interface Summary {
  total: number;
  upcoming: number;
  ongoing: number;
  completed: number;
  cancelled: number;
}

interface RecentBooking {
  id: string;
  booking_code: string;
  pickup_location: string;
  drop_location: string;
  booking_date: string;
  booking_time: string;
  status: string;
  estimated_fare: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  started: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const CustomerDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/user/customers/${id}`);
      if (res.data && res.data.success) {
        setCustomer(res.data.customer);
        setSummary(res.data.summary);
        setRecentBookings(res.data.recentBookings || []);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load customer details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [id]);

  const toggleStatus = async () => {
    if (!customer) return;
    setActionLoading(true);
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await axiosInstance.put(`/user/customers/${customer.id}/status`, {
        status: newStatus
      });
      if (res.data && res.data.success) {
        showToast('Customer status updated successfully', 'success');
        setCustomer({ ...customer, status: newStatus });
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update customer status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-600 mb-3" />
          <p className="text-sm font-semibold">Loading customer profile...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm max-w-sm text-center">
          <FontAwesomeIcon icon={faInfoCircle} className="text-gray-300 text-5xl mb-4" />
          <h2 className="text-lg font-bold text-gray-800">Profile Not Found</h2>
          <p className="text-sm text-gray-500 mt-1">This customer profile could not be retrieved from the database.</p>
          <button
            onClick={() => navigate('/customers')}
            className="mt-6 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl text-sm transition"
          >
            Back to Customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <AlertContainer />
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition text-sm font-semibold"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Back to Customers
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center justify-between p-6 gap-6">
          <div className="flex items-center gap-4.5">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-3xl font-extrabold shadow-sm border border-blue-100 shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800 leading-tight">{customer.name}</h1>
              <p className="text-sm text-gray-500 font-medium">Registered on {new Date(customer.createdAt).toLocaleDateString('en-IN')}</p>
              <div className="flex flex-wrap items-center gap-3.5 mt-2">
                <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                  <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-xs" />
                  {customer.mobile}
                </span>
                <span className="flex items-center gap-1.5 text-sm text-gray-600 font-medium">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-xs" />
                  {customer.email}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
              customer.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {customer.status}
            </span>
            <button
              onClick={toggleStatus}
              disabled={actionLoading}
              className={`px-4.5 py-2.5 rounded-xl text-sm font-extrabold shadow-sm border transition flex items-center gap-2 ${
                customer.status === 'active'
                  ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                  : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
              }`}
            >
              {actionLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={customer.status === 'active' ? faBan : faCheckCircle} />}
              {customer.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
            </button>
          </div>
        </div>

        {/* Counts Summary */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Bookings</p>
              <p className="text-2xl font-black text-gray-800 mt-1">{summary.total}</p>
            </div>
            <div className="bg-blue-50/40 rounded-2xl border border-blue-100/50 p-5 shadow-sm text-center">
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Upcoming</p>
              <p className="text-2xl font-black text-blue-800 mt-1">{summary.upcoming}</p>
            </div>
            <div className="bg-purple-50/40 rounded-2xl border border-purple-100/50 p-5 shadow-sm text-center">
              <p className="text-[10px] font-bold text-purple-500 uppercase tracking-wider">Ongoing</p>
              <p className="text-2xl font-black text-purple-800 mt-1">{summary.ongoing}</p>
            </div>
            <div className="bg-green-50/40 rounded-2xl border border-green-100/50 p-5 shadow-sm text-center">
              <p className="text-[10px] font-bold text-green-500 uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-black text-green-800 mt-1">{summary.completed}</p>
            </div>
            <div className="bg-red-50/40 rounded-2xl border border-red-100/50 p-5 shadow-sm text-center">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Cancelled</p>
              <p className="text-2xl font-black text-red-800 mt-1">{summary.cancelled}</p>
            </div>
          </div>
        )}

        {/* Recent Bookings Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
            <FontAwesomeIcon icon={faHistory} className="text-gray-400" />
            <h2 className="text-base font-bold text-gray-800">Recent Operational Bookings</h2>
          </div>

          {recentBookings.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-sm">
              No recent bookings registered for this customer.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="px-4 py-3 text-left">Booking Code</th>
                    <th className="px-4 py-3 text-left">Date & Time</th>
                    <th className="px-4 py-3 text-left">Pickup & Drop</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Est. Fare</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-55/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-blue-600">{b.booking_code}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 text-[10px]" />
                          <span>{b.booking_date}</span>
                          <FontAwesomeIcon icon={faClock} className="text-gray-400 text-[10px] ml-1" />
                          <span>{b.booking_time}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-xs truncate">
                        <div className="flex flex-col">
                          <span className="truncate flex items-center gap-1"><FontAwesomeIcon icon={faRoute} className="text-green-500 text-[9px]" /> {b.pickup_location}</span>
                          <span className="truncate flex items-center gap-1 text-[11px] text-gray-400"><FontAwesomeIcon icon={faRoute} className="text-red-400 text-[9px]" /> {b.drop_location}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[b.status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-gray-800">₹{parseFloat(b.estimated_fare).toFixed(2)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/bookings/${b.id}`)}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold rounded-lg text-xs transition"
                        >
                          View
                        </button>
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

export default CustomerDetails;
