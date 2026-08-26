import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCar, faCalendarAlt, faMapMarkerAlt, faHistory,
  faArrowRight, faRoute, faCreditCard, faUser, faPlus,
  faSpinner, faCheckCircle, faChevronRight, faClockRotateLeft
} from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

interface Booking {
  id: string;
  booking_code: string;
  booking_date: string;
  booking_time: string;
  pickup_location: string;
  drop_location: string;
  status: string;
}

const statusConfig = (status: string) => {
  switch (status) {
    case 'pending':    return { label: 'Pending',         color: 'bg-amber-100 text-amber-800  border-amber-200',  dot: 'bg-amber-400' };
    case 'accepted':   return { label: 'Accepted',        color: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-400' };
    case 'confirmed':  return { label: 'Driver Assigned', color: 'bg-blue-100 text-blue-800 border-blue-200',       dot: 'bg-blue-500' };
    case 'started':    return { label: 'Ongoing',         color: 'bg-green-100 text-green-800 border-green-200',    dot: 'bg-green-500' };
    case 'completed':  return { label: 'Completed',       color: 'bg-teal-100 text-teal-800 border-teal-200',       dot: 'bg-teal-500' };
    case 'paid':       return { label: 'Paid',            color: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
    case 'rejected':   return { label: 'Rejected',        color: 'bg-red-100 text-red-800 border-red-200',          dot: 'bg-red-500' };
    default:           return { label: status,            color: 'bg-gray-100 text-gray-700 border-gray-200',       dot: 'bg-gray-400' };
  }
};

const quickActions = [
  { label: 'Book a Cab',   path: '/customer/book',     icon: faPlus,        color: 'from-[#275981] to-blue-600',   textColor: 'text-white' },
  { label: 'My Bookings',  path: '/customer/bookings', icon: faHistory,     color: 'from-orange-400 to-amber-500', textColor: 'text-white' },
  { label: 'Track Ride',   path: '/customer/track',    icon: faRoute,       color: 'from-emerald-500 to-teal-600', textColor: 'text-white' },
  { label: 'Payments',     path: '/customer/payments', icon: faCreditCard,  color: 'from-violet-500 to-purple-600', textColor: 'text-white' },
  { label: 'Profile',      path: '/customer/profile',  icon: faUser,        color: 'from-gray-500 to-gray-700',    textColor: 'text-white' },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Valued Customer';
  const token = localStorage.getItem('token');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    axiosInstance
      .get('/bookings')
      .then((res) => setBookings(res.data?.data || []))
      .catch(() => showToast('Failed to load dashboard data', 'error'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const upcoming = bookings.find((b) =>
    ['pending', 'accepted', 'confirmed', 'started'].includes(b.status)
  );
  const recent = bookings.filter((b) => b.id !== upcoming?.id).slice(0, 5);

  const totalBookings = bookings.length;
  const pendingCount = bookings.filter((b) => ['pending', 'accepted', 'confirmed'].includes(b.status)).length;
  const completedCount = bookings.filter((b) => ['completed', 'paid'].includes(b.status)).length;

  return (
    <div className="min-h-screen p-4 md:p-6 space-y-6" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)' }}>

      {/* ── Hero Welcome Card ── */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 md:p-8 text-white shadow-xl"
        style={{ background: 'linear-gradient(135deg, #1a3a52 0%, #275981 50%, #2d6fa8 100%)' }}
      >
        {/* decorative circles */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/5 rounded-full" />
        <div className="absolute -bottom-8 -right-4 w-32 h-32 bg-white/5 rounded-full" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm font-medium mb-1">Good day!</p>
            <h1 className="text-2xl md:text-3xl font-extrabold">Welcome, {username} 👋</h1>
            <p className="text-blue-200 text-sm mt-1.5">Where would you like to go today?</p>
          </div>
          <button
            id="dashboard-book-cab-btn"
            onClick={() => navigate('/customer/book')}
            className="shrink-0 flex items-center gap-2 bg-white text-[#275981] px-6 py-3 rounded-2xl font-extrabold text-sm shadow-lg hover:bg-blue-50 hover:shadow-xl transition-all"
          >
            <FontAwesomeIcon icon={faPlus} />
            Book a Cab
          </button>
        </div>

        {/* Stats row */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {[
            { label: 'Total Trips', value: totalBookings, color: 'text-white' },
            { label: 'Active',      value: pendingCount,  color: 'text-amber-300' },
            { label: 'Completed',   value: completedCount, color: 'text-emerald-300' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-2xl px-3 py-3 text-center backdrop-blur-sm border border-white/10">
              <p className={`text-xl font-extrabold ${stat.color}`}>{loading ? '—' : stat.value}</p>
              <p className="text-[11px] text-blue-200 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              id={`quick-action-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => navigate(action.path)}
              className={`flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br ${action.color} ${action.textColor} shadow-md hover:shadow-lg hover:scale-105 transition-all font-semibold text-xs`}
            >
              <FontAwesomeIcon icon={action.icon} className="text-xl" />
              <span className="text-center leading-tight">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* ── Upcoming / Active Ride ── */}
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faCar} className="text-[#275981]" />
              Upcoming Ride
            </h2>
          </div>

          {loading ? (
            <div className="py-10 flex flex-col items-center gap-2 text-gray-400">
              <FontAwesomeIcon icon={faSpinner} spin className="text-3xl text-blue-400" />
              <p className="text-sm">Loading trips...</p>
            </div>
          ) : upcoming ? (
            <div className="rounded-2xl border border-blue-100 overflow-hidden">
              {/* Status bar */}
              <div className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-between">
                <span className="text-white text-xs font-bold">{upcoming.booking_code}</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusConfig(upcoming.status).color}`}>
                  {statusConfig(upcoming.status).label}
                </span>
              </div>

              <div className="p-4 bg-blue-50/30 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">From</p>
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-emerald-500 text-xs shrink-0" />
                      <span className="truncate">{upcoming.pickup_location}</span>
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase">To</p>
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500 text-xs shrink-0" />
                      <span className="truncate">{upcoming.drop_location}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-white rounded-xl px-3 py-2.5 border border-gray-100">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-400" />
                    {upcoming.booking_date} &nbsp;·&nbsp; {upcoming.booking_time}
                  </p>
                  <button
                    onClick={() => navigate(`/customer/bookings/${upcoming.id}`)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    Details <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                  </button>
                </div>

                {upcoming.status === 'started' && (
                  <button
                    onClick={() => navigate(`/customer/track/${upcoming.id}`)}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition"
                  >
                    <FontAwesomeIcon icon={faRoute} />
                    Track Live Location
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="py-10 border-2 border-dashed border-gray-200 rounded-2xl text-center space-y-3">
              <FontAwesomeIcon icon={faCar} className="text-4xl text-gray-200" />
              <p className="text-sm text-gray-400">No upcoming trips scheduled</p>
              <button
                onClick={() => navigate('/customer/book')}
                className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition"
              >
                <FontAwesomeIcon icon={faPlus} />
                Book a cab now
              </button>
            </div>
          )}
        </div>

        {/* ── Recent Bookings ── */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faClockRotateLeft} className="text-[#275981]" />
              Recent Trips
            </h2>
            <button
              onClick={() => navigate('/customer/bookings')}
              className="text-xs font-semibold text-blue-500 hover:text-blue-700 flex items-center gap-1"
            >
              All <FontAwesomeIcon icon={faArrowRight} className="text-[10px]" />
            </button>
          </div>

          {loading ? (
            <div className="py-6 text-center text-gray-300">
              <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
            </div>
          ) : recent.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {recent.map((b) => {
                const sc = statusConfig(b.status);
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/customer/bookings/${b.id}`)}
                    className="py-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 rounded-xl px-2 -mx-2 transition"
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${sc.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 truncate">{b.booking_code}</p>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">
                        {b.pickup_location} → {b.drop_location}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.color}`}>
                        {sc.label}
                      </span>
                      <FontAwesomeIcon icon={faChevronRight} className="text-gray-300 text-[10px]" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <FontAwesomeIcon icon={faHistory} className="text-3xl text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No booking history yet</p>
            </div>
          )}

          {/* Invoice/Payment shortcut */}
          <div className="border-t border-gray-50 pt-4 grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/customer/invoices')}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#275981] bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl py-2.5 transition"
            >
              <FontAwesomeIcon icon={faCheckCircle} className="text-teal-500" />
              Invoices
            </button>
            <button
              onClick={() => navigate('/customer/payments')}
              className="flex items-center justify-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-[#275981] bg-gray-50 hover:bg-blue-50 border border-gray-100 rounded-xl py-2.5 transition"
            >
              <FontAwesomeIcon icon={faCreditCard} className="text-violet-500" />
              Payments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
