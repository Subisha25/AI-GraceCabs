import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, faSpinner, faCalendarAlt, faMapMarkerAlt, 
  faRoute, faEye 
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

type TabType = 'upcoming' | 'active' | 'completed' | 'cancelled';

const TAB_CONFIG: { key: TabType; label: string; color: string }[] = [
  { key: 'upcoming',  label: 'Upcoming',  color: 'bg-blue-500' },
  { key: 'active',    label: 'Active',    color: 'bg-green-500' },
  { key: 'completed', label: 'Completed', color: 'bg-teal-500' },
  { key: 'cancelled', label: 'Cancelled', color: 'bg-rose-500' },
];

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': 
      return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
    case 'accepted': 
      return { label: 'Accepted', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
    case 'confirmed': 
      return { label: 'Driver Assigned', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    case 'started': 
      return { label: 'Ongoing', color: 'bg-green-100 text-green-800 border-green-200' };
    case 'completed': 
      return { label: 'Completed', color: 'bg-teal-100 text-teal-800 border-teal-200' };
    case 'paid': 
      return { label: 'Paid', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'rejected':
      return { label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' };
    default: 
      return { label: status, color: 'bg-gray-100 text-gray-800 border-gray-200' };
  }
};

const BookingsList: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [activeTab, setActiveTab] = useState<TabType>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await axiosInstance.get('/bookings');
      setBookings(res.data?.data || []);
    } catch {
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    let list = [...bookings];

    // Filter by Tab
    if (activeTab === 'upcoming') {
      list = list.filter((b) => ['pending', 'accepted', 'confirmed'].includes(b.status));
    } else if (activeTab === 'active') {
      list = list.filter((b) => b.status === 'started');
    } else if (activeTab === 'completed') {
      list = list.filter((b) => ['completed', 'paid'].includes(b.status));
    } else if (activeTab === 'cancelled') {
      list = list.filter((b) => b.status === 'rejected');
    }

    // Filter by Search Query
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((b) => 
        b.booking_code.toLowerCase().includes(q) ||
        b.pickup_location.toLowerCase().includes(q) ||
        b.drop_location.toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [bookings, activeTab, search]);

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and track your private cab bookings</p>
        </div>
        <button
          onClick={() => navigate('/customer/book')}
          className="bg-[#275981] hover:bg-[#1d4362] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
        >
          Book a Cab
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 bg-white rounded-2xl p-1.5 shadow-sm">
        {TAB_CONFIG.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-xs font-bold rounded-xl transition-all ${
              activeTab === tab.key 
                ? 'bg-[#275981] text-white shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Search by booking code, pickup, or drop point..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Bookings Display Container */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-gray-400 flex items-center justify-center gap-2">
            <FontAwesomeIcon icon={faSpinner} spin />
            <span>Loading your booking records...</span>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-gray-400 uppercase">Booking ID</span>
                    <p className="font-bold text-gray-800 text-lg">{b.booking_code}</p>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusText(b.status).color}`}>
                    {getStatusText(b.status).label}
                  </span>
                </div>

                <div className="space-y-2 border-t border-b border-gray-100 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400 w-4" />
                    <span className="text-gray-600 font-semibold">{b.booking_date} at {b.booking_time}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500 mt-1 w-4" />
                    <span className="text-gray-700 truncate"><b>Pickup:</b> {b.pickup_location}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500 mt-1 w-4" />
                    <span className="text-gray-700 truncate"><b>Drop:</b> {b.drop_location}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => navigate(`/customer/bookings/${b.id}`)}
                    className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 text-gray-700"
                  >
                    <FontAwesomeIcon icon={faEye} />
                    <span>Details</span>
                  </button>
                  {['started'].includes(b.status) && (
                    <button
                      onClick={() => navigate(`/customer/track/${b.id}`)}
                      className="flex-1 py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 text-green-700"
                    >
                      <FontAwesomeIcon icon={faRoute} />
                      <span>Track</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white border border-gray-100 rounded-2xl space-y-3 shadow-sm">
            <p className="text-gray-400 text-sm">No bookings found matching your selection.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsList;
