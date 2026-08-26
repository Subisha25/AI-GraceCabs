import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../../components/PageLayout';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import axiosInstance from '../../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCar,
  faClock,
  faCheckCircle,
  faUserShield,
  faCreditCard,
  faArrowRight,
  faRoad,
  faUser,
  faPhone,
  faCalendarAlt,
  faExclamationTriangle,
  faSearch,
  faRoute,
  faUsers,
  faCoins,
  faHandshake
} from '@fortawesome/free-solid-svg-icons';

interface Booking {
  id: string;
  booking_code: string;
  customer_name: string;
  customer_mobile: string;
  pickup_location: string;
  drop_location: string;
  booking_date: string;
  booking_time: string;
  passenger_count: number;
  estimated_distance_km: string;
  estimated_fare: string;
  final_fare?: string;
  status: string;
  created_at: string;
  driver?: { name: string; mobile: string };
  vehicle?: { vehicle_type: string; vehicle_number: string };
}

interface DashboardData {
  kpi: {
    today_bookings: number;
    pending_requests: number;
    accepted: number;
    driver_assigned: number;
    trips_ongoing: number;
    completed_trips: number;
    payment_pending: number;
    revenue_today: number;
  };
  pipeline: {
    pending: number;
    accepted: number;
    confirmed: number;
    started: number;
    completed: number;
    rejected: number;
    cancelled: number;
  };
  recent_bookings: Booking[];
  today_trips: Booking[];
  alerts: {
    awaiting_acceptance: number;
    without_driver: number;
    ongoing_trips: number;
    payments_pending: number;
    assignment_conflicts: number;
  };
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPipelineStatus, setSelectedPipelineStatus] = useState<string | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/operator/dashboard');
      if (res.data && res.data.success) {
        setData(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Error loading dashboard statistics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBookingsList = async () => {
    try {
      const res = await axiosInstance.get('/bookings');
      if (res.data && res.data.success) {
        setAllBookings(res.data.data);
        setFilteredBookings(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching bookings list:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchAllBookingsList();
  }, []);

  // Filter pipeline status & query
  useEffect(() => {
    let filtered = allBookings;

    if (selectedPipelineStatus) {
      filtered = filtered.filter(
        b => b.status.toLowerCase() === selectedPipelineStatus.toLowerCase()
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        b =>
          b.booking_code.toLowerCase().includes(q) ||
          (b.customer_name || '').toLowerCase().includes(q) ||
          (b.customer_mobile || '').toLowerCase().includes(q) ||
          (b.driver?.name || '').toLowerCase().includes(q) ||
          (b.vehicle?.vehicle_number || '').toLowerCase().includes(q)
      );
    }

    setFilteredBookings(filtered);
  }, [searchQuery, selectedPipelineStatus, allBookings]);

  const handleAccept = async (id: string) => {
    try {
      const res = await axiosInstance.post(`/bookings/${id}/accept`);
      if (res.data && res.data.success) {
        showToast('Booking request accepted successfully!', 'success');
        fetchDashboardData();
        fetchAllBookingsList();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to accept booking.', 'error');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Specify rejection reason:');
    if (!reason) return;
    try {
      const res = await axiosInstance.post(`/bookings/${id}/reject`, {
        reason
      });
      if (res.data && res.data.success) {
        showToast('Booking request rejected.', 'success');
        fetchDashboardData();
        fetchAllBookingsList();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reject booking.', 'error');
    }
  };

  if (loading || !data) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64 text-gray-400 font-semibold">
          <FontAwesomeIcon icon={faCar} className="animate-pulse mr-2" />
          Loading operations console...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-7xl mx-auto p-2 space-y-6 text-gray-700">
        <AlertContainer />

        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-extrabold text-[#1B4F8A]">Operations Control Panel</h2>
          <span className="text-xs font-bold bg-[#1B4F8A]/10 text-[#1B4F8A] px-3 py-1.5 rounded-full">
            Live Feed Updated
          </span>
        </div>

        {/* ================= 1. TOP KPI CARDS ================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { label: "Today's Bookings", val: data.kpi.today_bookings, bg: "bg-blue-50 border-blue-100 text-blue-900", icon: faCalendarAlt },
            { label: "Pending Requests", val: data.kpi.pending_requests, bg: "bg-amber-50 border-amber-100 text-amber-900", icon: faClock },
            { label: "Accepted Requests", val: data.kpi.accepted, bg: "bg-indigo-50 border-indigo-100 text-indigo-900", icon: faCheckCircle },
            { label: "Driver Assigned", val: data.kpi.driver_assigned, bg: "bg-purple-50 border-purple-100 text-purple-900", icon: faUserShield },
            { label: "Trips Ongoing", val: data.kpi.trips_ongoing, bg: "bg-emerald-50 border-emerald-100 text-emerald-900", icon: faRoute },
            { label: "Completed Trips", val: data.kpi.completed_trips, bg: "bg-green-50 border-green-100 text-green-900", icon: faCheckCircle },
            { label: "Payment Pending", val: data.kpi.payment_pending, bg: "bg-rose-50 border-rose-100 text-rose-900", icon: faCreditCard },
            { label: "Revenue Today", val: `₹${data.kpi.revenue_today}`, bg: "bg-teal-50 border-teal-100 text-teal-900", icon: faCoins }
          ].map((card, i) => (
            <div key={i} className={`p-4 rounded-xl border flex flex-col justify-between shadow-sm hover:shadow-md transition-all ${card.bg}`}>
              <div className="flex justify-between items-start opacity-70">
                <span className="text-[10px] font-bold uppercase tracking-wider leading-tight">{card.label}</span>
                <FontAwesomeIcon icon={card.icon} className="text-xs" />
              </div>
              <span className="text-xl font-black mt-2">{card.val}</span>
            </div>
          ))}
        </div>

        {/* ================= 17. ALERTS / ACTION REQUIRED ================= */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-rose-50 border border-rose-200/80 rounded-2xl p-4">
          <div className="md:col-span-1 flex items-center gap-2 text-rose-800 font-bold">
            <FontAwesomeIcon icon={faExclamationTriangle} className="text-rose-500 text-lg" />
            <span>Action Required:</span>
          </div>
          <div className="md:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold text-rose-700">
            <span
              onClick={() => { setSelectedPipelineStatus('pending'); }}
              className="hover:underline cursor-pointer flex items-center gap-1"
            >
              ⚠️ {data.alerts.awaiting_acceptance} Bookings Awaiting Acceptance
            </span>
            <span
              onClick={() => { setSelectedPipelineStatus('accepted'); }}
              className="hover:underline cursor-pointer flex items-center gap-1"
            >
              👤 {data.alerts.without_driver} Accepted Cabs Lack Drivers
            </span>
            <span
              onClick={() => { setSelectedPipelineStatus('started'); }}
              className="hover:underline cursor-pointer flex items-center gap-1"
            >
              🚕 {data.alerts.ongoing_trips} Active Trips Ongoing
            </span>
            <span
              onClick={() => { setSelectedPipelineStatus('completed'); }}
              className="hover:underline cursor-pointer flex items-center gap-1"
            >
              💳 {data.alerts.payments_pending} Completed Payments Pending
            </span>
          </div>
        </div>

        {/* ================= 2. BOOKING STATUS PIPELINE ================= */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase text-gray-400 tracking-wider">Booking Operations Pipeline</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { status: 'pending', label: 'New Request', count: data.pipeline.pending, color: 'bg-amber-100 hover:bg-amber-200 text-amber-900' },
              { status: 'accepted', label: 'Accepted', count: data.pipeline.accepted, color: 'bg-blue-100 hover:bg-blue-200 text-[#1B4F8A]' },
              { status: 'confirmed', label: 'Driver Assigned', count: data.pipeline.confirmed, color: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900' },
              { status: 'started', label: 'Started', count: data.pipeline.started, color: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900' },
              { status: 'completed', label: 'Completed', count: data.pipeline.completed, color: 'bg-green-100 hover:bg-green-200 text-green-900' },
              { status: 'rejected', label: 'Rejected', count: data.pipeline.rejected, color: 'bg-rose-100 hover:bg-rose-200 text-rose-900' },
              { status: 'cancelled', label: 'Cancelled', count: data.pipeline.cancelled, color: 'bg-gray-100 hover:bg-gray-200 text-gray-900' },
            ].map((p, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedPipelineStatus(selectedPipelineStatus === p.status ? null : p.status);
                }}
                className={`p-3 rounded-xl border flex justify-between items-center transition-all text-xs font-bold border-gray-100
                  ${p.color} ${selectedPipelineStatus === p.status ? 'ring-2 ring-blue-500 font-extrabold' : ''}`}
              >
                <span>{p.label}</span>
                <span className="bg-white/60 px-2 py-0.5 rounded text-[10px]">{p.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Block (2 columns) */}
          <div className="lg:col-span-2 space-y-6">

            {/* ================= 3. PENDING BOOKINGS LIST ================= */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} className="text-amber-500" />
                Awaiting Acceptance / புதிய சவாரி பதிவுகள்
              </h3>

              <div className="space-y-4">
                {allBookings.filter(b => b.status === 'pending').map(b => (
                  <div key={b.id} className="p-4 border border-gray-200/80 rounded-xl flex flex-col justify-between hover:shadow-md transition-all space-y-3 bg-gray-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block">Ref: {b.booking_code}</span>
                        <span className="font-bold text-gray-800 text-base">{b.customer_name || 'Guest'}</span>
                        <span className="text-xs block text-gray-500">{b.customer_mobile}</span>
                      </div>
                      <span className="text-sm font-extrabold text-[#1B4F8A]">₹{b.estimated_fare}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 border-t border-b border-gray-200/60 py-2">
                      <div>
                        <span className="font-semibold text-gray-400">Pickup:</span> {b.pickup_location}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400">Drop:</span> {b.drop_location}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400">Date/Time:</span> {b.booking_date} at {b.booking_time}
                      </div>
                      <div>
                        <span className="font-semibold text-gray-400">Passengers:</span> {b.passenger_count} Pax
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1 text-xs">
                      <button
                        onClick={() => handleAccept(b.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleReject(b.id)}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-all"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => navigate(`/bookings/${b.id}`)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}

                {allBookings.filter(b => b.status === 'pending').length === 0 && (
                  <div className="text-center py-6 text-gray-400 text-sm font-medium">
                    No new booking requests awaiting acceptance.
                  </div>
                )}
              </div>
            </div>

            {/* ================= 11. ADMIN BOOKING PIPELINE LISTING ================= */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex justify-between items-center gap-4 flex-wrap">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <FontAwesomeIcon icon={faCar} className="text-[#1B4F8A]" />
                  Booking Dispatch Queue
                </h3>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                  <input
                    type="text"
                    placeholder="Search Reference, Name, Mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A] text-xs"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200/60 text-gray-400 uppercase font-semibold">
                      <th className="py-3 px-2">Booking Code</th>
                      <th className="py-3 px-2">Customer</th>
                      <th className="py-3 px-2">Trip (From → To)</th>
                      <th className="py-3 px-2">Date/Time</th>
                      <th className="py-3 px-2">Driver / Vehicle</th>
                      <th className="py-3 px-2 text-right">Fare</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50/50">
                        <td className="py-3 px-2 font-bold text-[#1B4F8A]">{b.booking_code}</td>
                        <td className="py-3 px-2">
                          <span className="font-semibold block">{b.customer_name}</span>
                          <span className="text-[10px] text-gray-400">{b.customer_mobile}</span>
                        </td>
                        <td className="py-3 px-2 truncate max-w-[150px]">
                          {b.pickup_location} → {b.drop_location}
                        </td>
                        <td className="py-3 px-2">
                          <span className="block font-semibold">{b.booking_date}</span>
                          <span className="text-[10px] text-gray-400">{b.booking_time}</span>
                        </td>
                        <td className="py-3 px-2">
                          {b.driver ? (
                            <span className="block font-semibold">{b.driver.name}</span>
                          ) : (
                            <span className="text-gray-400 block italic">No driver</span>
                          )}
                          {b.vehicle ? (
                            <span className="text-[10px] text-gray-400 font-semibold bg-gray-100 px-1 py-0.5 rounded border border-gray-200">{b.vehicle.vehicle_number}</span>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">No vehicle</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-gray-800">
                          ₹{b.final_fare || b.estimated_fare}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase
                            ${b.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                              b.status === 'accepted' ? 'bg-blue-100 text-[#1B4F8A]' :
                              b.status === 'confirmed' ? 'bg-indigo-100 text-indigo-800' :
                              b.status === 'started' ? 'bg-emerald-100 text-emerald-800' :
                              b.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center">
                          <button
                            onClick={() => navigate(`/bookings/${b.id}`)}
                            className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded text-[10px] transition-all"
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}

                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-400 italic">
                          No dispatch booking matching current filter criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Right Block (1 column) */}
          <div className="space-y-6">

            {/* ================= 16. TODAY'S OPERATIONS ================= */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faRoute} className="text-emerald-500" />
                Section Operations: Today's Trips
              </h3>

              <div className="space-y-4">
                {data.today_trips.map(t => (
                  <div
                    key={t.id}
                    onClick={() => navigate(`/bookings/${t.id}`)}
                    className="p-3 border border-gray-100 hover:border-gray-200 hover:shadow-sm rounded-xl cursor-pointer transition-all flex justify-between items-center gap-4 bg-gray-50/20"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-[#1B4F8A] block">{t.booking_time} - {t.booking_code}</span>
                      <span className="font-bold text-xs text-gray-800 block">{t.customer_name}</span>
                      <span className="text-[10px] text-gray-500 block truncate max-w-[180px]">{t.pickup_location} → {t.drop_location}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase
                      ${t.status === 'started' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'}`}>
                      {t.status}
                    </span>
                  </div>
                ))}

                {data.today_trips.length === 0 && (
                  <div className="text-center py-4 text-gray-400 text-xs italic">
                    No trips scheduled for today.
                  </div>
                )}
              </div>
            </div>

            {/* ================= 15. RECENT BOOKINGS SIDEBAR ================= */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faHistory} className="text-indigo-500" />
                Recent Booking Log
              </h3>

              <div className="space-y-3">
                {data.recent_bookings.map(b => (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/bookings/${b.id}`)}
                    className="p-3 border border-gray-100 hover:border-gray-200 hover:shadow-sm rounded-xl cursor-pointer transition-all flex justify-between items-center gap-2 bg-gray-50/10"
                  >
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold block">{b.booking_code}</span>
                      <span className="font-bold text-xs text-gray-800 block">{b.customer_name || 'Guest'}</span>
                      <span className="text-[10px] text-gray-500 truncate max-w-[160px] block">{b.pickup_location} → {b.drop_location}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase
                      ${b.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        b.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </PageLayout>
  );
};

// Helper FontAwesome icon not imported directly
const faHistory = faClock;

export default Dashboard;