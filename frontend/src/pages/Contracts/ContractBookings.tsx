import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../components/AlertBox';
import PageLayout from '../../components/PageLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faEye, faEdit, faTrash, faSpinner,
  faClipboardList, faBuilding, faHandshake, faCar,
  faUser, faCalendarAlt, faRoute, faBan, faExchangeAlt, faUserShield
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

interface Organization {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  contract_name: string;
}

interface Booking {
  id: string;
  booking_code: string;
  pickup_location: string;
  drop_location: string;
  booking_date: string;
  booking_time: string;
  expected_end_date: string;
  expected_end_time: string;
  status: string;
  estimated_fare: string;
  vehicle?: Vehicle;
  driver?: Driver;
  organization?: Organization;
  contract?: Contract;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  accepted: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  started: 'bg-purple-100 text-purple-800 border-purple-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const ContractBookings: React.FC = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filtered, setFiltered] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchContractBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/bookings');
      const all = res.data?.data || [];
      // Filter only bookings associated with a contract
      const contractOnly = all.filter((b: any) => b.contract_id !== null || b.contract !== null);
      setBookings(contractOnly);
      setFiltered(contractOnly);
    } catch (err: any) {
      showToast('Failed to load contract bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContractBookings();
  }, [fetchContractBookings]);

  useEffect(() => {
    let result = [...bookings];

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status.toLowerCase() === statusFilter.toLowerCase());
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.booking_code.toLowerCase().includes(q) ||
        b.pickup_location.toLowerCase().includes(q) ||
        b.drop_location.toLowerCase().includes(q) ||
        b.organization?.name.toLowerCase().includes(q) ||
        b.contract?.contract_name.toLowerCase().includes(q) ||
        (b.driver?.name || '').toLowerCase().includes(q) ||
        (b.vehicle?.vehicle_number || '').toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [search, statusFilter, bookings]);

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const res = await axiosInstance.post(`/bookings/${id}/reject`, {
        rejection_reason: 'Cancelled by operator'
      });
      if (res.data && res.data.success) {
        showToast('Booking cancelled successfully!', 'success');
        fetchContractBookings();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to cancel booking.', 'error');
    }
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <FontAwesomeIcon icon={faClipboardList} className="text-[#1B4F8A]" />
              Contract Bookings
            </h1>
            <p className="text-sm text-gray-500 mt-1">Manage corporate & institutional transport schedules</p>
          </div>
        </div>

        {/* Filters bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <div className="relative flex-1 w-full">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by code, client, driver, plate..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-400 h-[42px]"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="confirmed">Confirmed</option>
              <option value="started">Trip Started</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Listing */}
        {loading ? (
          <div className="text-center py-20">
            <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-[#1B4F8A] mb-3" />
            <p className="text-gray-500 font-semibold">Loading contract bookings...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center text-gray-400">
            <FontAwesomeIcon icon={faClipboardList} className="text-5xl mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700 mb-1">No contract bookings found</p>
            <p className="text-sm">Create a booking from the organization/contract details page.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-50 text-gray-800 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Client / Contract</th>
                    <th className="px-6 py-4">Pickup / Drop</th>
                    <th className="px-6 py-4">Start / End Time</th>
                    <th className="px-6 py-4">Vehicle Details</th>
                    <th className="px-6 py-4">Driver</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-mono font-bold text-[#1B4F8A]">{b.booking_code}</td>
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-bold text-gray-800 block">{b.organization?.name}</span>
                          <span className="text-xs text-gray-400 block">{b.contract?.contract_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="px-1.5 py-0.5 bg-green-50 text-green-700 font-bold rounded text-[9px] mr-1.5 uppercase">From</span>
                            <span className="text-gray-700 font-medium">{b.pickup_location}</span>
                          </div>
                          <div>
                            <span className="px-1.5 py-0.5 bg-red-50 text-red-700 font-bold rounded text-[9px] mr-1.5 uppercase">To</span>
                            <span className="text-gray-700 font-medium">{b.drop_location}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold block text-gray-700">{b.booking_date} {b.booking_time}</span>
                          <span className="text-gray-400 block">Est End: {b.expected_end_date} {b.expected_end_time}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {b.vehicle ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-800 block">{b.vehicle.vehicle_type}</span>
                            <span className="font-mono bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[10px] inline-block font-semibold mt-0.5">
                              {b.vehicle.vehicle_number}
                            </span>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="px-6 py-4">
                        {b.driver ? (
                          <span className="font-semibold text-gray-800 text-xs block">
                            <FontAwesomeIcon icon={faUserShield} className="mr-1 text-gray-400" />
                            {b.driver.name}
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColors[b.status.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/bookings/${b.id}`}
                            className="p-1.5 bg-blue-50 text-[#1B4F8A] hover:bg-blue-100 rounded-lg transition"
                            title="View / Assign Driver"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>

                          {b.status.toLowerCase() !== 'cancelled' && b.status.toLowerCase() !== 'completed' && (
                            <>
                              <button
                                onClick={() => handleCancelBooking(b.id)}
                                className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                                title="Cancel Ride"
                              >
                                <FontAwesomeIcon icon={faBan} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:hidden">
              {filtered.map(b => (
                <div key={b.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <span className="font-mono font-bold text-[#1B4F8A]">{b.booking_code}</span>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[b.status.toLowerCase()] || 'bg-gray-100 text-gray-800'}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Client:</span>
                      <span className="font-bold text-gray-800">{b.organization?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Contract:</span>
                      <span className="font-medium text-gray-600">{b.contract?.contract_name}</span>
                    </div>
                    <div className="space-y-1 pt-1 border-t border-gray-50">
                      <div className="flex items-start gap-1">
                        <FontAwesomeIcon icon={faRoute} className="text-green-500 mt-0.5" />
                        <span>{b.pickup_location}</span>
                      </div>
                      <div className="flex items-start gap-1">
                        <FontAwesomeIcon icon={faRoute} className="text-red-500 mt-0.5" />
                        <span>{b.drop_location}</span>
                      </div>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-gray-50">
                      <span className="text-gray-400 font-semibold">Date/Time:</span>
                      <span className="font-bold text-gray-800">{b.booking_date} @ {b.booking_time}</span>
                    </div>
                    {b.vehicle && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 font-semibold">Vehicle:</span>
                        <span className="font-semibold text-gray-800">{b.vehicle.vehicle_type} ({b.vehicle.vehicle_number})</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-semibold">Driver:</span>
                      <span className="font-bold text-gray-800">{b.driver ? b.driver.name : 'Unassigned'}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                    <Link
                      to={`/bookings/${b.id}`}
                      className="px-3 py-1.5 bg-blue-50 text-[#1B4F8A] font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-blue-100 transition-all"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      <span>Dispatch</span>
                    </Link>

                    {b.status.toLowerCase() !== 'cancelled' && b.status.toLowerCase() !== 'completed' && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-red-100 transition-all"
                      >
                        <FontAwesomeIcon icon={faBan} />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default ContractBookings;
