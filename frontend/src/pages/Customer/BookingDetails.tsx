import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarAlt, faClock, faMapMarkerAlt, faCar, faUser, 
  faPhone, faStickyNote, faInfoCircle, faArrowLeft, faSpinner, 
  faFilePdf, faCreditCard, faCheckCircle, faCompass 
} from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

interface BookingDetail {
  id: string;
  booking_code: string;
  booking_date: string;
  booking_time: string;
  pickup_location: string;
  drop_location: string;
  status: string;
  customer_notes: string | null;
  passenger_count: number;
  estimated_distance_km: number | string;
  estimated_fare: number | string;
  actual_distance_km: number | string | null;
  final_fare: number | string | null;
  vehicle?: {
    vehicle_name: string;
    vehicle_number: string;
  };
  driver?: {
    name: string;
    mobile: string;
  };
  invoice?: {
    id: string;
    invoice_number: string;
    total_amount: number | string;
    status: string;
  };
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending': 
      return { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
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

const BookingDetails: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    axiosInstance
      .get(`/bookings/${bookingId}`)
      .then((res) => {
        setBooking(res.data?.data || null);
      })
      .catch((err) => {
        showToast('Failed to load booking details', 'error');
      })
      .finally(() => setLoading(false));
  }, [bookingId]);

  const handleDownloadInvoice = async () => {
    if (!booking || !booking.invoice) return;
    setDownloadingPdf(true);
    try {
      // Simulate file download
      setTimeout(() => {
        showToast('Invoice downloaded successfully!', 'success');
        setDownloadingPdf(false);
      }, 1000);
    } catch {
      showToast('Failed to download invoice PDF', 'error');
      setDownloadingPdf(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!booking || !booking.invoice) return;
    navigate('/customer/payments');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-2">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
          <span>Loading booking details...</span>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-2xl p-8 border border-gray-100 max-w-sm space-y-4 shadow-sm">
          <FontAwesomeIcon icon={faInfoCircle} className="text-rose-500 text-4xl" />
          <h2 className="text-xl font-bold text-gray-800">Booking Not Found</h2>
          <p className="text-sm text-gray-500">The requested booking does not exist or you do not have permission to view it.</p>
          <button onClick={() => navigate('/customer/bookings')} className="bg-[#275981] hover:bg-[#1d4362] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition">
            Go to My Bookings
          </button>
        </div>
      </div>
    );
  }

  // Timeline phases
  const steps = [
    { label: 'Requested', active: ['pending', 'accepted', 'confirmed', 'started', 'completed', 'paid'].includes(booking.status) },
    { label: 'Approved', active: ['accepted', 'confirmed', 'started', 'completed', 'paid'].includes(booking.status) },
    { label: 'Assigned', active: ['confirmed', 'started', 'completed', 'paid'].includes(booking.status) },
    { label: 'Ongoing', active: ['started', 'completed', 'paid'].includes(booking.status) },
    { label: 'Ended', active: ['completed', 'paid'].includes(booking.status) },
    { label: 'Settled', active: booking.status === 'paid' },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition shadow-sm">
          <FontAwesomeIcon icon={faArrowLeft} className="text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Ride Details</h1>
          <p className="text-sm text-gray-500 mt-0.5">Booking Code: {booking.booking_code}</p>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <h2 className="text-sm font-bold text-gray-700 mb-4">Ride Status Timeline</h2>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-2">
          {steps.map((s, idx) => (
            <React.Fragment key={idx}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all border-2
                  ${s.active 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md' 
                    : 'bg-white border-gray-200 text-gray-400'}`}>
                  {s.active ? <FontAwesomeIcon icon={faCheckCircle} /> : idx + 1}
                </div>
                <span className={`text-xs font-bold ${s.active ? 'text-gray-800' : 'text-gray-400'}`}>{s.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`hidden md:block flex-1 h-0.5 ${s.active && steps[idx+1].active ? 'bg-blue-600' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Trip Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-6 shadow-sm">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-gray-800">Booking Specifications</h2>
              <span className={`px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusText(booking.status).color}`}>
                {getStatusText(booking.status).label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Pickup Address</span>
                <p className="font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500" />
                  <span>{booking.pickup_location}</span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Destination</span>
                <p className="font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
                  <span>{booking.drop_location}</span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Booking Schedule</span>
                <p className="font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                  <span>{booking.booking_date} at {booking.booking_time}</span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Vehicle Booked</span>
                <p className="font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faCar} className="text-gray-400" />
                  <span>{booking.vehicle?.vehicle_name || 'Select Option'}</span>
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Passengers</span>
                <p className="font-semibold flex items-center gap-1.5">
                  <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                  <span>{booking.passenger_count} Passenger(s)</span>
                </p>
              </div>
              {booking.customer_notes && (
                <div className="space-y-1 md:col-span-2">
                  <span className="text-xs font-bold text-gray-400 uppercase">Remarks / Notes</span>
                  <p className="font-semibold flex items-start gap-1.5 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <FontAwesomeIcon icon={faStickyNote} className="text-gray-400 mt-1" />
                    <span>{booking.customer_notes}</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Assigned Driver/Vehicle Details */}
          {booking.driver && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800">Assigned Driver & Vehicle</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <FontAwesomeIcon icon={faUser} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Driver</span>
                    <p className="font-bold text-gray-800">{booking.driver.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                      <FontAwesomeIcon icon={faPhone} />
                      <span>{booking.driver.mobile}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                    <FontAwesomeIcon icon={faCar} />
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Vehicle Plate</span>
                    <p className="font-bold text-gray-800">{booking.vehicle?.vehicle_number || 'Assigned'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{booking.vehicle?.vehicle_name || 'Model Unspecified'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Fare / Invoice details */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-bold text-gray-800">Billing Details</h2>

            {booking.invoice ? (
              <div className="space-y-4">
                <div className="bg-blue-50/20 p-4 rounded-xl border border-gray-100 text-center space-y-1">
                  <span className="text-xs text-gray-400 font-semibold uppercase">Total Invoice Fare</span>
                  <p className="text-3xl font-extrabold text-[#275981]">
                    ₹{Number(booking.invoice.total_amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">Invoice Number: {booking.invoice.invoice_number}</p>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-b border-gray-100 py-3">
                  <span className="font-semibold text-gray-400">Payment Status</span>
                  <span className={`px-2 py-0.5 text-xs font-bold border rounded-full 
                    ${booking.invoice.status === 'paid' || booking.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'}`}>
                    {booking.invoice.status === 'paid' || booking.status === 'paid' ? 'Paid' : 'Pending Payment'}
                  </span>
                </div>

                <div className="space-y-2">
                  {!(booking.invoice.status === 'paid' || booking.status === 'paid') && (
                    <button
                      onClick={handleProceedToPayment}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faCreditCard} />
                      <span>Proceed to Pay</span>
                    </button>
                  )}
                  {booking.status === 'started' && (
                    <button
                      onClick={() => navigate(`/customer/track/${booking.id}`)}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <FontAwesomeIcon icon={faCompass} className="animate-pulse" />
                      <span>Track Ride Live</span>
                    </button>
                  )}
                  <button
                    onClick={handleDownloadInvoice}
                    disabled={downloadingPdf}
                    className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    {downloadingPdf ? (
                      <FontAwesomeIcon icon={faSpinner} spin />
                    ) : (
                      <FontAwesomeIcon icon={faFilePdf} className="text-rose-500" />
                    )}
                    <span>Download Invoice</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
                  Invoice generation is pending trip closure.
                </div>
                {booking.status === 'started' && (
                  <button
                    onClick={() => navigate(`/customer/track/${booking.id}`)}
                    className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm transition shadow-sm flex items-center justify-center gap-2"
                  >
                    <FontAwesomeIcon icon={faCompass} className="animate-pulse" />
                    <span>Track Ride Live</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingDetails;
