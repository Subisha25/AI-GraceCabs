import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faMapMarkerAlt,
  faCalendarAlt,
  faClock,
  faCar,
  faUserShield,
  faPhone,
  faExclamationTriangle,
  faMapPin,
  faFileInvoiceDollar
} from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../utils/axiosInstance';
import { showToast, AlertContainer } from './AlertBox';
import SimpleHeader from './Homepage/simpleheader';
import Footer from './Homepage/Footer';

const PublicTrackingPage: React.FC = () => {
  const location = useLocation();
  const [bookingReference, setBookingReference] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState<any | null>(null);
  const [searched, setSearched] = useState(false);

  // Auto-populate state if redirected from booking success
  useEffect(() => {
    if (location.state) {
      const { booking_code, mobile: passedMobile } = location.state as any;
      if (booking_code && passedMobile) {
        setBookingReference(booking_code);
        setMobile(passedMobile);
        fetchTrackingData(booking_code, passedMobile);
      }
    }
  }, [location.state]);

  const fetchTrackingData = async (ref = bookingReference, mob = mobile) => {
    if (!ref.trim() || !mob.trim()) {
      showToast('Please enter both Booking Reference and Mobile Number.', 'error');
      return;
    }
    setLoading(true);
    setBooking(null);
    setSearched(true);
    try {
      const res = await axiosInstance.post('/public/bookings/track', {
        booking_reference: ref,
        mobile: mob
      });
      if (res.data && res.data.success) {
        setBooking(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.message || 'No booking found matching these credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTrackingData();
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'Pending Approval / ஒப்புதலுக்காக காத்திருக்கிறது';
      case 'accepted': return 'Accepted / ஏற்றுக்கொள்ளப்பட்டது';
      case 'confirmed': return 'Driver Assigned / ஓட்டுநர் நியமிக்கப்பட்டுள்ளார்';
      case 'started': return 'Trip Started / பயணம் தொடங்கியது';
      case 'completed': return 'Trip Completed / பயணம் முடிந்தது';
      case 'paid': return 'Paid / பணம் செலுத்தப்பட்டது';
      case 'cancelled': return 'Cancelled / ரத்து செய்யப்பட்டது';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'accepted': return 'bg-blue-100 text-[#1B4F8A]';
      case 'confirmed': return 'bg-indigo-100 text-indigo-800';
      case 'started': return 'bg-emerald-100 text-emerald-800';
      case 'completed':
      case 'paid': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-rose-100 text-rose-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <SimpleHeader />
      <AlertContainer />

      <main className="flex-grow max-w-4xl w-full mx-auto px-4 py-12">
        <h1 className="text-4xl font-extrabold text-[#1B4F8A] text-center mb-2">Track Your Cab Ride</h1>
        <p className="text-gray-500 text-center mb-8">Enter your booking details below to view real-time trip status.</p>

        {/* Input Form */}
        <form onSubmit={handleTrackSubmit} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl max-w-2xl mx-auto mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Booking Reference</label>
            <input
              type="text"
              placeholder="e.g. BK-ABC123"
              value={bookingReference}
              onChange={(e) => setBookingReference(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Mobile Number</label>
            <input
              type="tel"
              placeholder="e.g. 9876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#1B4F8A]"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 w-full py-3 bg-[#1B4F8A] text-white font-bold rounded-xl shadow-md hover:bg-blue-800 transition-all flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faSearch} />
            <span>{loading ? 'Tracking...' : 'Track Ride'}</span>
          </button>
        </form>

        {/* Loading Spinner */}
        {loading && (
          <div className="text-center py-12 text-gray-500 font-semibold animate-pulse">
            Fetching tracking information...
          </div>
        )}

        {/* Tracking Details */}
        {searched && !loading && booking && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 space-y-8 animate-fade-in">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Booking Code</span>
                <h2 className="text-2xl font-black text-[#1B4F8A]">{booking.booking_code}</h2>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`px-4 py-2 rounded-full text-xs font-bold ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
            </div>

            {/* Travel Parameters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center mt-0.5">
                    <FontAwesomeIcon icon={faMapMarkerAlt} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-semibold">Pickup Location</span>
                    <span className="font-bold text-gray-800">{booking.pickup_location}</span>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center mt-0.5">
                    <FontAwesomeIcon icon={faMapPin} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-semibold">Drop Location</span>
                    <span className="font-bold text-gray-800">{booking.drop_location}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faCalendarAlt} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-semibold">Travel Date</span>
                    <span className="font-bold text-gray-800">{booking.booking_date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center">
                    <FontAwesomeIcon icon={faClock} />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-semibold">Pickup Time</span>
                    <span className="font-bold text-gray-800">{booking.booking_time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle & Driver allocation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
              {booking.vehicle ? (
                <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1B4F8A] flex items-center justify-center">
                    <FontAwesomeIcon icon={faCar} className="text-xl" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-semibold">Vehicle Details</span>
                    <span className="font-bold text-gray-800 text-lg block">{booking.vehicle.vehicle_type}</span>
                    <span className="text-sm font-semibold text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 mt-1 inline-block">
                      {booking.vehicle.vehicle_number}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200/60 flex items-center justify-center text-gray-400 font-semibold text-sm">
                  Vehicle not yet assigned
                </div>
              )}

              {booking.driver ? (
                <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faUserShield} className="text-xl" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-semibold">Driver Assigned</span>
                    <span className="font-bold text-gray-800 text-lg block">{booking.driver.name}</span>
                    <span className="text-sm text-emerald-600 font-semibold flex items-center gap-1 mt-1">
                      <FontAwesomeIcon icon={faPhone} />
                      {booking.driver.mobile}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-200/60 flex items-center justify-center text-gray-400 font-semibold text-sm">
                  Driver not yet assigned
                </div>
              )}
            </div>

            {/* GPS Tracking status placeholder */}
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-200 text-amber-800 text-sm flex items-start gap-3">
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500 text-lg mt-0.5" />
              <div>
                <span className="font-bold block">Live Location Tracking</span>
                Driver location is currently unavailable. Location tracking initializes once driver starts the ride.
              </div>
            </div>

            {/* Invoice Section when completed */}
            {booking.invoice && (
              <div className="p-6 bg-green-50/50 rounded-3xl border border-green-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-xl" />
                  </div>
                  <div>
                    <span className="block text-xs text-gray-400 font-semibold">Invoice Generated</span>
                    <span className="font-bold text-gray-800 block text-lg">{booking.invoice.invoice_number}</span>
                    <span className="text-xl font-black text-green-700">₹{booking.invoice.total_amount}</span>
                  </div>
                </div>
                <div>
                  <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${booking.invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-rose-100 text-rose-800'}`}>
                    Payment: {booking.invoice.status}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {searched && !loading && !booking && (
          <div className="text-center py-12 bg-white rounded-3xl border border-gray-100 shadow-xl max-w-2xl mx-auto">
            <p className="text-gray-500 font-semibold">No booking record found. Verify reference code and phone number.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PublicTrackingPage;
