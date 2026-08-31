import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../../components/AlertBox';
import PageLayout from '../../../components/PageLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faPhone, faMapMarkerAlt, faCalendarAlt, 
  faClock, faCar, faCheckCircle, faSpinner, faPlay, faStopCircle,
  faKey, faTimes, faShieldAlt
} from '@fortawesome/free-solid-svg-icons';

interface Booking {
  id: string;
  booking_code: string;
  pickup_location: string;
  drop_location: string;
  booking_date: string;
  booking_time: string;
  status: string;
  passenger_count: number;
  estimated_distance_km: string | number;
  estimated_fare: string | number;
  actual_distance_km: string | number | null;
  final_fare: string | number | null;
  customer?: { name: string; mobile: string; email: string };
  vehicle?: { vehicle_type: string; vehicle_number: string; image?: string | null };
}

const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const DriverTripDetail: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  
  // OTP Modals
  const [showStartModal, setShowStartModal] = useState(false);
  const [startOtp, setStartOtp] = useState('');
  const [isStartingTrip, setIsStartingTrip] = useState(false);

  const [showEndModal, setShowEndModal] = useState(false);
  const [endOtp, setEndOtp] = useState('');
  const [isEndingTrip, setIsEndingTrip] = useState(false);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/driver/trips/${bookingId}`);
      if (res.data && res.data.success) {
        setBooking(res.data.data);
      } else {
        showToast('Trip not found', 'error');
        navigate('/drivers/assignedlist');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to load trip details', 'error');
      navigate('/drivers/assignedlist');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchTripDetails();
    }
  }, [bookingId]);

  // Geolocation watch tracking when trip has started
  useEffect(() => {
    if (booking && booking.status === 'started' && 'geolocation' in navigator) {
      let lastSentLat: number | null = null;
      let lastSentLng: number | null = null;
      let lastSentTime = 0;

      const minIntervalMs = 10000; // 10 seconds
      const minDistanceMeters = 5; // 5 meters

      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const nowMs = Date.now();

          let shouldSend = false;
          if (lastSentLat === null || lastSentLng === null) {
            shouldSend = true;
          } else {
            const timeElapsed = nowMs - lastSentTime;
            const distance = getDistanceMeters(lastSentLat, lastSentLng, latitude, longitude);
            if (timeElapsed >= minIntervalMs && distance >= minDistanceMeters) {
              shouldSend = true;
            }
          }

          if (shouldSend) {
            axiosInstance.post(`/trips/${booking.id}/locations`, {
              latitude,
              longitude,
            })
            .then(() => {
              lastSentLat = latitude;
              lastSentLng = longitude;
              lastSentTime = nowMs;
            })
            .catch((err) => {
              console.warn('GPS location upload failed:', err);
            });
          }
        },
        (err) => {
          console.warn('GPS signal capture error:', err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );

      return () => {
        navigator.geolocation.clearWatch(id);
      };
    }
  }, [booking?.status, booking?.id]);

  const getCurrentCoords = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          () => {
            // Default fallback if GPS permission not granted
            resolve({ latitude: 13.0827, longitude: 80.2707 });
          },
          { timeout: 5000 }
        );
      } else {
        resolve({ latitude: 13.0827, longitude: 80.2707 });
      }
    });
  };

  const handleStartTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || isStartingTrip) return;
    if (!startOtp.trim()) {
      showToast('Please enter the Start Trip OTP given by customer', 'error');
      return;
    }

    setIsStartingTrip(true);
    try {
      const coords = await getCurrentCoords();
      const res = await axiosInstance.post(`/driver/trips/${booking.id}/start`, {
        start_otp: startOtp.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (res.data && res.data.success) {
        showToast('Trip started successfully! Drive safely.', 'success');
        setShowStartModal(false);
        setStartOtp('');
        fetchTripDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to start trip. Check Start OTP.', 'error');
    } finally {
      setIsStartingTrip(false);
    }
  };

  const handleCompleteTripSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking || isEndingTrip) return;
    if (!endOtp.trim()) {
      showToast('Please enter the End Trip OTP given by customer', 'error');
      return;
    }

    setIsEndingTrip(true);
    try {
      const coords = await getCurrentCoords();
      const res = await axiosInstance.post(`/driver/trips/${booking.id}/complete`, {
        end_otp: endOtp.trim(),
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      if (res.data && res.data.success) {
        showToast('Trip completed successfully! Invoice and PDF have been generated.', 'success');
        setShowEndModal(false);
        setEndOtp('');
        fetchTripDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to complete trip. Check End OTP.', 'error');
    } finally {
      setIsEndingTrip(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
          <p>Loading trip details...</p>
        </div>
      </PageLayout>
    );
  }

  if (!booking) return null;

  const vehicleImageUrl = booking.vehicle?.image
    ? booking.vehicle.image.startsWith('http')
      ? booking.vehicle.image
      : `http://localhost:8000${booking.vehicle.image}`
    : null;

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-2xl mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800">Trip: {booking.booking_code}</h1>
            <p className="text-sm text-gray-500 mt-1">Operational details and actions</p>
          </div>
          <span className={`inline-flex px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            booking.status === 'confirmed' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            booking.status === 'started' ? 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse' :
            'bg-green-100 text-green-800 border border-green-200'
          }`}>
            {booking.status}
          </span>
        </div>

        {/* Card details */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
          
          {/* Customer */}
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
              <FontAwesomeIcon icon={faUser} className="text-lg" />
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Customer</p>
              <h3 className="text-lg font-bold text-gray-800">{booking.customer?.name || 'Individual Customer'}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                <FontAwesomeIcon icon={faPhone} className="text-xs text-gray-400" />
                {booking.customer?.mobile || '—'}
              </p>
            </div>
          </div>

          {/* Vehicle with Image */}
          <div className="flex gap-4 border-t pt-4">
            {vehicleImageUrl ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-indigo-100 shadow-sm bg-gray-50 flex-shrink-0">
                <img
                  src={vehicleImageUrl}
                  alt={booking.vehicle?.vehicle_type || 'Vehicle'}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <FontAwesomeIcon icon={faCar} className="text-lg" />
              </div>
            )}
            <div>
              <p className="text-xs text-gray-400 uppercase font-semibold">Vehicle Asset</p>
              <h3 className="text-lg font-bold text-gray-800">{booking.vehicle?.vehicle_type || '—'}</h3>
              <p className="text-sm text-indigo-600 font-mono font-semibold mt-1">
                {booking.vehicle?.vehicle_number || '—'}
              </p>
            </div>
          </div>

          {/* Locations */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-green-50 text-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold">Pickup</p>
                <p className="text-sm text-gray-700 font-medium">{booking.pickup_location}</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-red-50 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-sm" />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-semibold">Drop</p>
                <p className="text-sm text-gray-700 font-medium">{booking.drop_location}</p>
              </div>
            </div>
          </div>

          {/* Time & Distance info */}
          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-semibold text-gray-700">{new Date(booking.booking_date).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faClock} className="text-gray-400" />
              <div>
                <p className="text-xs text-gray-400">Time</p>
                <p className="text-sm font-semibold text-gray-700">{booking.booking_time}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">Est. Distance</div>
              <div className="text-sm font-bold text-gray-800">{booking.estimated_distance_km} KM</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-gray-400">Est. Fare</div>
              <div className="text-sm font-bold text-gray-800">₹{Number(booking.estimated_fare).toLocaleString('en-IN')}</div>
            </div>
          </div>

          {/* Completion summary if completed */}
          {['completed', 'paid'].includes(booking.status) && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-green-800 font-bold">
                <FontAwesomeIcon icon={faCheckCircle} />
                Trip Closed Details
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                <div>Actual Distance: <strong>{booking.actual_distance_km} KM</strong></div>
                <div>Final Fare Amount: <strong>₹{Number(booking.final_fare).toLocaleString('en-IN')}</strong></div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2">
          {booking.status === 'confirmed' && (
            <button
              onClick={() => setShowStartModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <FontAwesomeIcon icon={faPlay} />
              Start Trip (Enter OTP)
            </button>
          )}

          {booking.status === 'started' && (
            <button
              onClick={() => setShowEndModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <FontAwesomeIcon icon={faStopCircle} />
              Complete Trip (Enter End OTP)
            </button>
          )}
        </div>
      </div>

      {/* Start Trip OTP Modal */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
              onClick={() => setShowStartModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
            
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-xl">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Start Trip Security Verification</h2>
              <p className="text-xs text-gray-500">Ask the passenger for the 4-digit Start OTP sent to their mobile/email.</p>
            </div>

            <form onSubmit={handleStartTripSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Start Trip OTP *
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faKey} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 4-digit OTP"
                    value={startOtp}
                    onChange={(e) => setStartOtp(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-center text-lg font-mono tracking-widest font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 py-3 text-center border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isStartingTrip || !startOtp.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isStartingTrip ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Start'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Trip OTP Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md relative shadow-2xl animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 cursor-pointer"
              onClick={() => setShowEndModal(false)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-xl" />
            </button>
            
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-xl">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Complete Trip Handshake</h2>
              <p className="text-xs text-gray-500">Ask the passenger for the 4-digit End OTP sent upon trip start.</p>
            </div>

            <form onSubmit={handleCompleteTripSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  End Trip OTP *
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faKey} className="absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 4-digit End OTP"
                    value={endOtp}
                    onChange={(e) => setEndOtp(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-center text-lg font-mono tracking-widest font-bold focus:ring-2 focus:ring-green-500 outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 py-3 text-center border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEndingTrip || !endOtp.trim()}
                  className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEndingTrip ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} spin />
                      Completing...
                    </>
                  ) : (
                    'Verify & Complete'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default DriverTripDetail;

