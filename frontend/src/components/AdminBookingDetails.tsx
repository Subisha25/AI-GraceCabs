import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faPhone,
  faMapMarkerAlt,
  faCalendarAlt,
  faClock,
  faUsers,
  faCar,
  faUserShield,
  faFileInvoiceDollar,
  faTimeline,
  faArrowLeft,
  faCheckCircle,
  faTimesCircle,
  faRoad,
  faCompass,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../utils/axiosInstance';
import { showToast, AlertContainer } from './AlertBox';
import PageLayout from './PageLayout';

interface Driver {
  id: string;
  name: string;
  mobile: string;
  availability: string;
  status: string;
}

interface Vehicle {
  id: string;
  vehicle_type: string;
  vehicle_number: string;
  seating_capacity: number;
  status: string;
}

const AdminBookingDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  // Driver/Vehicle selection states
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');

  // Reject state
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectBox, setShowRejectBox] = useState(false);

  const fetchAssignmentData = async (startAt?: string, endAt?: string) => {
    try {
      const params: any = {};
      if (startAt && endAt) {
        params.start_at = startAt;
        params.end_at = endAt;
        params.exclude_booking_id = id;
      }
      const [driversRes, vehiclesRes] = await Promise.all([
        axiosInstance.get('/drivers', { params }),
        axiosInstance.get('/vehicles/available', { params })
      ]);
      if (driversRes.data && driversRes.data.success) {
        setDrivers(driversRes.data.data);
      }
      if (vehiclesRes.data && vehiclesRes.data.success) {
        setVehicles(vehiclesRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching assignment resources:', err);
    }
  };

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/bookings/${id}`);
      if (res.data && res.data.success) {
        const b = res.data.data;
        setBooking(b);
        // Pre-select if already assigned
        if (b.driver_id) setSelectedDriverId(b.driver_id);
        if (b.vehicle_id) setSelectedVehicleId(b.vehicle_id);

        const startAt = `${b.booking_date} ${b.booking_time}`;
        const endAt = (b.expected_end_date && b.expected_end_time)
          ? `${b.expected_end_date} ${b.expected_end_time}`
          : `${b.booking_date} ${b.booking_time}`;

        fetchAssignmentData(startAt, endAt);
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to fetch booking details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleAccept = async () => {
    try {
      setAssigning(true);
      const res = await axiosInstance.post(`/bookings/${id}/accept`);
      if (res.data && res.data.success) {
        showToast('Booking accepted successfully!', 'success');
        fetchBookingDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to accept booking.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a rejection reason.', 'error');
      return;
    }
    try {
      setAssigning(true);
      const res = await axiosInstance.post(`/bookings/${id}/reject`, {
        reason: rejectReason
      });
      if (res.data && res.data.success) {
        showToast('Booking request rejected.', 'success');
        setShowRejectBox(false);
        fetchBookingDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to reject booking.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedDriverId) {
      showToast('Please select a driver.', 'error');
      return;
    }
    try {
      setAssigning(true);
      const res = await axiosInstance.post(`/bookings/${id}/assign-driver`, {
        driver_id: selectedDriverId
      });
      if (res.data && res.data.success) {
        showToast('Driver assigned successfully!', 'success');
        fetchBookingDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to assign driver.', 'error');
    } finally {
      setAssigning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'accepted': return 'bg-blue-100 text-[#1B4F8A] border border-blue-200';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
      case 'started': return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'completed': return 'bg-green-100 text-green-800 border border-green-200';
      case 'rejected': return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const formatTransitionDate = (dateStr: string | null) => {
    if (!dateStr) return 'Pending / காத்திருக்கிறது';
    return new Date(dateStr).toLocaleString();
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center h-64 text-gray-400">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-3xl mr-2" />
          <span className="font-semibold">Loading booking details...</span>
        </div>
      </PageLayout>
    );
  }

  if (!booking) {
    return (
      <PageLayout>
        <div className="text-center py-12 text-gray-500 font-bold">
          Booking record not found.
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto p-2 space-y-6">
        <AlertContainer />

        {/* Back and Header row */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={() => navigate('/bookings')}
            className="text-gray-500 hover:text-gray-700 font-bold flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Bookings</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Status:</span>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${getStatusBadge(booking.status)}`}>
              {booking.status.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Header Title Panel */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Booking Reference</span>
            <h1 className="text-2xl font-black text-[#1B4F8A]">{booking.booking_code}</h1>
          </div>
          <div className="text-xs text-gray-500 text-left md:text-right">
            <span className="block font-semibold">Created Date:</span>
            <span>{new Date(booking.created_at).toLocaleString()}</span>
          </div>
        </div>

        {/* Dynamic Dispatch Operations Alert panel */}
        {booking.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Action Required: Awaiting Operator Review</h3>
              <p className="text-sm text-amber-700">Please review the passenger count and pickup parameters below. You can accept or reject this request.</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <button
                onClick={handleAccept}
                disabled={assigning}
                className="flex-1 md:flex-none px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                Accept Booking
              </button>
              <button
                onClick={() => setShowRejectBox(true)}
                disabled={assigning}
                className="flex-1 md:flex-none px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition-all"
              >
                Reject Request
              </button>
            </div>
          </div>
        )}

        {showRejectBox && (
          <div className="bg-white border border-rose-200 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-gray-800">Specify Rejection Reason</h3>
            <textarea
              rows={2}
              className="w-full border border-gray-200 p-3 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm"
              placeholder="e.g. No vehicles available at selected date/time"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleReject}
                disabled={assigning}
                className="px-5 py-2 bg-rose-600 text-white rounded-xl font-bold text-sm"
              >
                Submit Rejection
              </button>
              <button
                onClick={() => setShowRejectBox(false)}
                className="px-5 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {(booking.status === 'accepted' || booking.status === 'confirmed') && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-blue-900 text-lg">
              {booking.status === 'accepted' ? 'Assign Driver' : 'Update Driver Assignment'}
            </h3>
            
            {/* Read-Only Vehicle Info */}
            <div className="bg-white/60 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row justify-between gap-4 text-sm text-gray-700">
              <div>
                <span className="text-gray-400 block text-xs font-semibold">Booking</span>
                <span className="font-bold text-gray-800">{booking.booking_code}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold">Trip Dates</span>
                <span className="font-bold text-gray-800 font-mono">
                  {booking.booking_date} @ {booking.booking_time} to {booking.expected_end_date || '—'} @ {booking.expected_end_time || '—'}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold">Vehicle Type</span>
                <span className="font-bold text-gray-800">{booking.vehicle ? booking.vehicle.vehicle_type : '—'}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-xs font-semibold">Vehicle Number</span>
                <span className="font-bold text-gray-800 font-mono">{booking.vehicle ? booking.vehicle.vehicle_number : '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Driver</label>
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full border border-gray-200 p-3 rounded-xl outline-none focus:ring-2 focus:ring-[#1B4F8A] text-sm bg-white"
                >
                  <option value="">-- Choose Driver --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id} disabled={d.availability !== 'AVAILABLE'}>
                      {d.name} ({d.mobile}) - {d.availability}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAssignDriver}
                disabled={assigning}
                className="w-full py-3.5 bg-[#1B4F8A] hover:bg-blue-800 text-white font-bold rounded-xl shadow-md transition-all text-sm"
              >
                {assigning ? 'Assigning...' : booking.status === 'accepted' ? 'Assign Driver' : 'Update Driver'}
              </button>
            </div>
          </div>
        )}

        {/* Ongoing trip Location Map widget */}
        {(booking.status === 'confirmed' || booking.status === 'started') && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faCompass} className="text-blue-500" />
              Live Route Progress
            </h3>

            {/* GPS unavailable box as requested */}
            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200/60 text-center text-gray-400 font-semibold text-sm">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-3xl mb-2 text-gray-300" />
              <p>Location temporarily unavailable</p>
              <span className="text-xs text-gray-400 block mt-1 font-normal">GPS initializes once the driver starts the trip.</span>
            </div>
          </div>
        )}

        {/* 6 Sections Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main info columns (2 cols width) */}
          <div className="lg:col-span-2 space-y-6">

            {/* SECTION 1 - CUSTOMER */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                Section 1: Customer Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Name</span>
                  <span className="font-bold text-gray-800">{booking.customer_name || booking.customer?.username || '-'}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Mobile Number</span>
                  <span className="font-bold text-gray-800">{booking.customer_mobile || booking.customer?.mobile || '-'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 2 - TRIP */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faRoad} className="text-blue-500" />
                Section 2: Trip Parameters
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Pickup Location</span>
                  <span className="font-bold text-gray-800 block mt-0.5">{booking.pickup_location}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Drop Location</span>
                  <span className="font-bold text-gray-800 block mt-0.5">{booking.drop_location}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Travel Date & Time</span>
                  <span className="font-bold text-gray-800 block mt-0.5">
                    <FontAwesomeIcon icon={faCalendarAlt} className="mr-1 text-gray-400" />
                    {booking.booking_date} at {booking.booking_time}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Passengers</span>
                  <span className="font-bold text-gray-800 block mt-0.5">
                    <FontAwesomeIcon icon={faUsers} className="mr-1 text-gray-400" />
                    {booking.passenger_count} Pax
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Distance</span>
                  <span className="font-bold text-[#1B4F8A] block mt-0.5 text-lg">{booking.estimated_distance_km} KM</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-xs font-semibold">Special Instructions</span>
                  <span className="text-gray-600 block mt-0.5 italic">{booking.customer_notes || 'None'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 3 - VEHICLE */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faCar} className="text-gray-400" />
                Section 3: Vehicle Allocation
              </h2>
              {booking.vehicle ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-xs font-semibold">Vehicle Type</span>
                    <span className="font-bold text-gray-800">{booking.vehicle.vehicle_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs font-semibold">Vehicle Plate Number</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 text-xs inline-block mt-0.5">
                      {booking.vehicle.vehicle_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs font-semibold">Seating Capacity</span>
                    <span className="font-bold text-gray-800">{booking.vehicle.seating_capacity} Seats</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 italic text-sm">No vehicle assigned yet.</div>
              )}
            </div>

            {/* SECTION 4 - DRIVER */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faUserShield} className="text-gray-400" />
                Section 4: Driver Profile
              </h2>
              {booking.driver ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div>
                    <span className="text-gray-400 block text-xs font-semibold">Driver Name</span>
                    <span className="font-bold text-gray-800">{booking.driver.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs font-semibold">Driver Mobile</span>
                    <span className="font-bold text-gray-800">{booking.driver.mobile}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs font-semibold">Driver Status</span>
                    <span className="font-bold text-[#1B4F8A]">{booking.driver.status.toUpperCase()}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400 italic text-sm">No driver assigned yet.</div>
              )}
            </div>

          </div>

          {/* Sidebar Columns (1 col width) */}
          <div className="space-y-6">

            {/* SECTION 5 - BILLING */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-emerald-500" />
                Section 5: Billing & Invoices
              </h2>
              <div className="space-y-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Estimated Fare</span>
                  <span className="font-bold text-gray-800">₹{booking.estimated_fare}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-semibold">Final Fare</span>
                  <span className="font-bold text-gray-800">₹{booking.final_fare || '-'}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-gray-400 font-semibold">Invoice Number</span>
                  <span className="font-bold text-gray-800">{booking.invoice ? booking.invoice.invoice_number : 'Not Generated'}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2">
                  <span className="text-gray-400 font-semibold">Payment Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${booking.invoice && booking.invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
                    {booking.invoice ? booking.invoice.status : 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 6 - STATUS TIMELINE */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2 pb-2 border-b border-gray-100">
                <FontAwesomeIcon icon={faTimeline} className="text-indigo-500" />
                Section 6: Status Timeline
              </h2>
              <div className="space-y-4 pl-2 relative border-l border-gray-100 ml-2">
                <div className="relative pl-6">
                  <span className="absolute left-[-21px] top-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white"></span>
                  <span className="block text-xs font-bold text-gray-400 uppercase">Created</span>
                  <span className="text-xs text-gray-700">{formatTransitionDate(booking.created_at)}</span>
                </div>
                <div className="relative pl-6">
                  <span className={`absolute left-[-21px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white
                    ${booking.accepted_at ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                  <span className="block text-xs font-bold text-gray-400 uppercase">Accepted</span>
                  <span className="text-xs text-gray-700">{formatTransitionDate(booking.accepted_at)}</span>
                </div>
                <div className="relative pl-6">
                  <span className={`absolute left-[-21px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white
                    ${booking.driver_assigned_at ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                  <span className="block text-xs font-bold text-gray-400 uppercase">Driver Assigned</span>
                  <span className="text-xs text-gray-700">{formatTransitionDate(booking.driver_assigned_at)}</span>
                </div>
                <div className="relative pl-6">
                  <span className={`absolute left-[-21px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white
                    ${booking.started_at ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                  <span className="block text-xs font-bold text-gray-400 uppercase">Trip Started</span>
                  <span className="text-xs text-gray-700">{formatTransitionDate(booking.started_at)}</span>
                </div>
                <div className="relative pl-6">
                  <span className={`absolute left-[-21px] top-0 w-3.5 h-3.5 rounded-full border-2 border-white
                    ${booking.completed_at ? 'bg-emerald-500' : 'bg-gray-200'}`}></span>
                  <span className="block text-xs font-bold text-gray-400 uppercase">Trip Completed</span>
                  <span className="text-xs text-gray-700">{formatTransitionDate(booking.completed_at)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminBookingDetails;
