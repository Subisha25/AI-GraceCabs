import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus, faSearch, faEye, faCircle, faRefresh,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';

type Status =
  | 'all' | 'pending' | 'confirmed' | 'closed' | 'completed' | 'paymentcompleted' | 'cancelled';

interface Booking {
  bookingId: string;
  orderNumber?: string;
  pickupPoint?: string;
  dropPoint?: string;
  pickupDate?: string;
  bookingDate?: string;
  status?: string;
  userName?: string;
  companyName?: string;
  vehicleType?: string;
  driverName?: string;
  totalAmount?: number | string;
  paymentStatus?: string;
}

const STATUS_TABS: { key: Status; label: string; color: string }[] = [
  { key: 'all',              label: 'All',              color: 'bg-gray-500' },
  { key: 'pending',          label: 'Pending',          color: 'bg-yellow-500' },
  { key: 'confirmed',        label: 'Confirmed',        color: 'bg-blue-500' },
  { key: 'closed',           label: 'Trip Started',     color: 'bg-orange-500' },
  { key: 'completed',        label: 'Completed',        color: 'bg-green-500' },
  { key: 'paymentcompleted', label: 'Payment Done',     color: 'bg-purple-500' },
  { key: 'cancelled',        label: 'Cancelled',        color: 'bg-red-500' },
];

const STATUS_BADGE: Record<string, string> = {
  pending:          'bg-yellow-100 text-yellow-800',
  confirmed:        'bg-blue-100 text-blue-800',
  closed:           'bg-orange-100 text-orange-800',
  completed:        'bg-green-100 text-green-800',
  paymentcompleted: 'bg-purple-100 text-purple-800',
  cancelled:        'bg-red-100 text-red-800',
};

const BookingList: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Status>('all');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchBookings = useCallback(async (status: Status) => {
    setLoading(true);
    try {
      let url = '/bookings';
      if (status !== 'all') url = `/bookings?status=${status}`;
      const res = await axiosInstance.get(url);
      const rawData = res.data?.data || [];
      const data: Booking[] = rawData.map((b: any) => ({
        bookingId: b.id,
        orderNumber: b.booking_code,
        pickupPoint: b.pickup_location,
        dropPoint: b.drop_location,
        bookingDate: b.booking_date,
        pickupDate: b.booking_date,
        status: b.status,
        userName: b.customer?.name || '—',
        companyName: b.organization?.name || '—',
        vehicleType: b.vehicle?.vehicle_name || '—',
        driverName: b.driver?.name || '—',
        totalAmount: b.estimated_fare,
        paymentStatus: b.status,
      }));
      setBookings(data);
      setFiltered(data);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to load bookings');
      setBookings([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings(activeTab);
  }, [activeTab, fetchBookings]);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(bookings); return; }
    setFiltered(
      bookings.filter((b) =>
        [b.orderNumber, b.pickupPoint, b.dropPoint, b.userName, b.companyName, b.driverName, b.vehicleType]
          .some((f) => (f || '').toLowerCase().includes(q))
      )
    );
  }, [search, bookings]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all transport bookings across the platform</p>
        </div>
        <button
          onClick={() => navigate('/bookings/add')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow transition"
        >
          <FontAwesomeIcon icon={faPlus} />
          New Booking
        </button>
      </div>

      {/* ── Status Tabs ── */}
      <div className="flex flex-wrap gap-2 mb-5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSearch(''); }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key
                ? `${tab.color} text-white shadow-md`
                : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            {activeTab === tab.key && (
              <FontAwesomeIcon icon={faCircle} className="text-[8px]" />
            )}
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => fetchBookings(activeTab)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 border border-gray-200 transition"
        >
          <FontAwesomeIcon icon={faRefresh} />
        </button>
      </div>

      {/* ── Search ── */}
      <div className="relative mb-5 max-w-sm">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bookings..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3" />
            Loading bookings...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">No bookings found</p>
            <p className="text-sm mt-1">Try a different status tab or create a new booking</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Order No.</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Passenger / Org</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Pickup</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Drop</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((b, i) => {
                  const st = (b.status || '').toLowerCase();
                  return (
                    <tr key={b.bookingId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-mono font-medium text-gray-800 text-xs">
                        {b.orderNumber || b.bookingId?.slice(0, 8) || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {b.userName || b.companyName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">
                        {b.pickupPoint || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">
                        {b.dropPoint || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {b.pickupDate ? new Date(b.pickupDate).toLocaleDateString('en-IN') : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{b.vehicleType || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_BADGE[st] || 'bg-gray-100 text-gray-600'}`}>
                          {st || '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">
                        {b.totalAmount ? `₹${Number(b.totalAmount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/orders/view/confirm-pending-order/${b.bookingId}`)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition"
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Count ── */}
      <p className="text-xs text-gray-400 mt-3 text-right">
        {filtered.length} booking{filtered.length !== 1 ? 's' : ''} shown
      </p>
    </div>
  );
};

export default BookingList;
