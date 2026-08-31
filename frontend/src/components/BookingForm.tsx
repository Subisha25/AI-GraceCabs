import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCar, faCalendarAlt, faClock, faUsers,
  faStickyNote, faMapMarkerAlt, faSpinner, faCheckCircle,
  faArrowRight, faRoute, faUser, faPhone
} from '@fortawesome/free-solid-svg-icons';
import { showToast, AlertContainer } from './AlertBox';

interface Vehicle {
  id: string;
  vehicle_type: string;
  vehicle_number: string;
  seating_capacity: number;
  price_per_km: number;
  status: string;
  image: string | null;
}

interface BookingFormProps {
  mode?: 'customer' | 'admin';
}

const cardAccents = [
  { bg: 'from-blue-50 to-indigo-50', border: 'border-blue-200', badge: 'bg-blue-600', icon: 'text-blue-500' },
  { bg: 'from-violet-50 to-purple-50', border: 'border-violet-200', badge: 'bg-violet-600', icon: 'text-violet-500' },
  { bg: 'from-emerald-50 to-teal-50', border: 'border-emerald-200', badge: 'bg-emerald-600', icon: 'text-emerald-500' },
  { bg: 'from-orange-50 to-amber-50', border: 'border-orange-200', badge: 'bg-orange-500', icon: 'text-orange-500' },
];

const BookingForm: React.FC<BookingFormProps> = ({ mode = 'customer' }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const isAdmin = mode === 'admin';

  // Read URL query parameters
  const queryParams = new URLSearchParams(window.location.search);
  const urlOrgId = queryParams.get('orgId') || '';
  const urlContractId = queryParams.get('contractId') || '';

  // State
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropLocation, setDropLocation] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [expectedEndDate, setExpectedEndDate] = useState('');
  const [expectedEndTime, setExpectedEndTime] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [passengerCount, setPassengerCount] = useState('1');
  const [remarks, setRemarks] = useState('');

  // Contract-Aware states
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState(urlOrgId);
  const [contractId, setContractId] = useState(urlContractId);

  // Estimation
  const [fareMap, setFareMap] = useState<Record<string, { distance: number; fare: number }>>({});
  const [estimating, setEstimating] = useState(false);

  // Modal & Submit State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Initial Fetch of Unique Active Vehicle Types
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    setTypesLoading(true);
    axiosInstance.get('/vehicles/types')
      .then((res) => {
        setVehicleTypes(res.data?.data || []);
      })
      .catch(() => {
        showToast('Failed to load vehicle types.', 'error');
      })
      .finally(() => setTypesLoading(false));
  }, [token, navigate]);

  // Fetch contract details if contractId is provided
  useEffect(() => {
    if (urlContractId) {
      axiosInstance.get(`/contracts/${urlContractId}`)
        .then((res) => {
          const c = res.data?.data;
          if (c) {
            setContractInfo(c);
            setPickupLocation(c.pickup_location || '');
            setDropLocation(c.drop_location || '');
            setCustomerName(c.organization?.contact_person || '');
            setCustomerMobile(c.organization?.phone || '');
            setOrganizationId(c.organization_id);
            if (c.vehicle) {
              setSelectedVehicleType(c.vehicle.vehicle_type || '');
            }
          }
        })
        .catch(() => {});
    }
  }, [urlContractId]);

  // Reusable function to fetch range-filtered available physical vehicles
  const fetchAvailableVehicles = () => {
    if (!bookingDate || !bookingTime || !expectedEndDate || !expectedEndTime || !selectedVehicleType) {
      setAvailableVehicles([]);
      return;
    }

    setVehiclesLoading(true);
    const startAt = `${bookingDate} ${bookingTime}`;
    const endAt = `${expectedEndDate} ${expectedEndTime}`;

    axiosInstance.get('/vehicles/available', {
      params: {
        start_at: startAt,
        end_at: endAt,
        vehicle_type_name: selectedVehicleType,
        passenger_count: passengerCount
      }
    })
    .then((res) => {
      setAvailableVehicles(res.data?.data || []);
    })
    .catch(() => {
      showToast('Failed to query available vehicles for this period.', 'error');
    })
    .finally(() => setVehiclesLoading(false));
  };

  // Fetch available vehicles when inputs change
  useEffect(() => {
    fetchAvailableVehicles();
  }, [bookingDate, bookingTime, expectedEndDate, expectedEndTime, selectedVehicleType, passengerCount]);

  // Recalculate Fare Estimations
  useEffect(() => {
    if (!pickupLocation || !dropLocation || availableVehicles.length === 0) {
      setFareMap({});
      return;
    }

    const timer = setTimeout(() => {
      setEstimating(true);
      const promises = availableVehicles.map((v) =>
        axiosInstance.post('/bookings/estimate', {
          pickup_location: pickupLocation,
          drop_location: dropLocation,
          vehicle_id: v.id
        }).then((res) => ({
          id: v.id,
          distance: res.data?.estimated_distance_km ?? null,
          fare: res.data?.estimated_fare ?? null,
        })).catch(() => ({ id: v.id, distance: null, fare: null }))
      );

      Promise.all(promises).then((results) => {
        const map: Record<string, { distance: number; fare: number }> = {};
        results.forEach((r) => {
          if (r.distance !== null && r.fare !== null) {
            map[r.id] = { distance: r.distance, fare: r.fare };
          }
        });
        setFareMap(map);
        setEstimating(false);
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [pickupLocation, dropLocation, availableVehicles]);

  const selectedVehicle = availableVehicles.find((v) => v.id === vehicleId);
  const selectedEstimate = vehicleId ? fareMap[vehicleId] : null;

  const handleOpenReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAdmin) {
      if (!customerName.trim() || !customerMobile.trim()) {
        showToast('Please enter customer name and mobile number', 'error');
        return;
      }
      if (customerMobile.replace(/[^0-9]/g, '').length < 10) {
        showToast('Please enter a valid 10-digit mobile number', 'error');
        return;
      }
    }
    if (!pickupLocation || !dropLocation || !bookingDate || !bookingTime || !expectedEndDate || !expectedEndTime || !vehicleId) {
      showToast('Please fill all required fields and select a vehicle', 'error');
      return;
    }

    // Validate expected end range is after start
    const startStr = `${bookingDate} ${bookingTime}`;
    const endStr = `${expectedEndDate} ${expectedEndTime}`;
    if (new Date(startStr) >= new Date(endStr)) {
      showToast('Trip end date/time must be after the trip start date/time.', 'error');
      return;
    }

    setShowReviewModal(true);
  };

  const handleConfirmBooking = async () => {
    setBookingLoading(true);
    try {
      const payload: any = {
        pickup_location: pickupLocation,
        drop_location: dropLocation,
        booking_date: bookingDate,
        booking_time: bookingTime,
        expected_end_date: expectedEndDate,
        expected_end_time: expectedEndTime,
        vehicle_id: vehicleId,
        passenger_count: parseInt(passengerCount),
        trip_type: 'one_way',
        customer_notes: remarks || null,
        organization_id: organizationId || null,
        contract_id: contractId || null
      };

      if (isAdmin) {
        payload.customer_name = customerName;
        payload.customer_mobile = customerMobile;
      }

      const res = await axiosInstance.post('/bookings', payload);
      if (res.data && res.data.success) {
        showToast('Cab booked successfully!', 'success');
        setTimeout(() => {
          if (isAdmin) {
            navigate('/bookings');
          } else {
            navigate(`/customer/bookings/${res.data.data.id}`);
          }
        }, 1000);
      } else {
        showToast(res.data?.message || 'Failed to book ride.', 'error');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error occurred while creating booking.';
      showToast(msg, 'error');
      
      // Double Booking rejection triggers list refresh and clears selection
      if (err.response?.status === 422 && msg.includes('already booked')) {
        fetchAvailableVehicles();
        setVehicleId('');
      }
    } finally {
      setBookingLoading(false);
      setShowReviewModal(false);
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ background: 'linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%)' }}>
      <AlertContainer />
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-800 flex items-center gap-2">
              <FontAwesomeIcon icon={faCar} className="text-[#275981]" />
              {isAdmin ? 'Create Booking (Admin Console)' : 'Book a Cab'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Enter trip details and pick a vehicle option below</p>
          </div>
        </div>

        {contractInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-blue-800 flex items-center justify-between shadow-sm">
            <div>
              <span className="font-bold block">Monthly Booking Mode</span>
              <span>
                Organization: <strong>{contractInfo.organization?.name}</strong> | Contract: <strong>{contractInfo.contract_name}</strong>
              </span>
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white font-extrabold text-xs rounded-lg uppercase tracking-wider">
              Contract Active
            </span>
          </div>
        )}

        <form onSubmit={handleOpenReview} className="space-y-5">

          {/* ── Admin-Only Customer Details Card ── */}
          {isAdmin && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                <FontAwesomeIcon icon={faUser} className="text-[#275981]" />
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Customer details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 9999999999"
                      value={customerMobile}
                      onChange={(e) => setCustomerMobile(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 1: Trip Details ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <span className="w-6 h-6 rounded-full bg-[#275981] text-white text-xs font-bold flex items-center justify-center">1</span>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Trip Details</h2>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Pickup Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3.5 top-3.5 text-emerald-500 text-sm" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chennai Central Railway"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Drop Location <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3.5 top-3.5 text-red-500 text-sm" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Coimbatore Airport"
                    value={dropLocation}
                    onChange={(e) => setDropLocation(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Route visualiser */}
            {pickupLocation && dropLocation && (
              <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
                <FontAwesomeIcon icon={faRoute} className="text-blue-400" />
                <span className="font-medium truncate">{pickupLocation}</span>
                <FontAwesomeIcon icon={faArrowRight} className="text-gray-300 shrink-0" />
                <span className="font-medium truncate">{dropLocation}</span>
                {estimating && <FontAwesomeIcon icon={faSpinner} spin className="text-blue-400 ml-auto shrink-0" />}
              </div>
            )}

            {/* Date, Time range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Trip Start Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => {
                        setBookingDate(e.target.value);
                        if (!expectedEndDate) setExpectedEndDate(e.target.value);
                      }}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                    />
                  </div>
                  <div className="relative flex-1">
                    <FontAwesomeIcon icon={faClock} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Expected Trip End Date & Time <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <FontAwesomeIcon icon={faCalendarAlt} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="date"
                      required
                      value={expectedEndDate}
                      onChange={(e) => setExpectedEndDate(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                    />
                  </div>
                  <div className="relative flex-1">
                    <FontAwesomeIcon icon={faClock} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                    <input
                      type="time"
                      required
                      value={expectedEndTime}
                      onChange={(e) => setExpectedEndTime(e.target.value)}
                      className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Passenger Count Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Passengers <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUsers} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <select
                    value={passengerCount}
                    onChange={(e) => setPassengerCount(e.target.value)}
                    className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <option key={n} value={n}>{n} Passenger{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Remarks / Customer notes */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Special Remarks / Instructions <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faStickyNote} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                <textarea
                  placeholder="e.g. Need child seat, driver should know English, extra luggage instructions..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={2}
                  className="w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* ── Step 2: Choose Vehicle Type ── */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
              <span className="w-6 h-6 rounded-full bg-[#275981] text-white text-xs font-bold flex items-center justify-center">2</span>
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Select Vehicle Type</h2>
            </div>

            {typesLoading ? (
              <div className="py-4 flex items-center gap-2 text-gray-500 text-sm">
                <FontAwesomeIcon icon={faSpinner} spin className="text-blue-500" />
                <span>Loading vehicle types...</span>
              </div>
            ) : vehicleTypes.length === 0 ? (
              <div className="py-4 text-center text-gray-500 text-sm">
                No active vehicle types available.
              </div>
            ) : (
              <div className="flex flex-wrap gap-3">
                {vehicleTypes.map((type) => {
                  const isSelected = selectedVehicleType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedVehicleType(type);
                        setVehicleId(''); // Clear selected physical vehicle on type change
                      }}
                      className={`px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
                        isSelected
                          ? 'bg-[#275981] text-white border-[#275981] shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-55'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Step 3: Choose Physical Vehicle ── */}
          {selectedVehicleType && (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-50">
                <span className="w-6 h-6 rounded-full bg-[#275981] text-white text-xs font-bold flex items-center justify-center">3</span>
                <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Select Available Vehicle</h2>
              </div>

              {vehiclesLoading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2 text-gray-500 text-sm">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-2xl text-blue-500" />
                  <span>Loading available physical vehicles...</span>
                </div>
              ) : availableVehicles.length === 0 ? (
                <div className="py-8 text-center text-gray-500 text-sm">
                  No available physical vehicles of type "{selectedVehicleType}" for the requested period.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableVehicles.map((v, index) => {
                    const estimate = fareMap[v.id];
                    const isSelected = vehicleId === v.id;
                    const accent = cardAccents[index % cardAccents.length];

                    return (
                      <div
                        key={v.id}
                        onClick={() => setVehicleId(v.id)}
                        className={`cursor-pointer rounded-2xl border-2 p-5 bg-gradient-to-br transition-all flex flex-col gap-4 relative ${
                          isSelected
                            ? `border-blue-600 shadow-md ${accent.bg}`
                            : 'border-gray-100 hover:border-gray-200 bg-white hover:shadow-sm'
                        }`}
                      >
                        {/* Check badge */}
                        {isSelected && (
                          <div className="absolute top-4 right-4 text-blue-600">
                            <FontAwesomeIcon icon={faCheckCircle} className="text-xl" />
                          </div>
                        )}

                        {/* Header with image */}
                        <div className="flex items-start gap-3.5">
                          {v.image ? (
                            <div className="w-14 h-14 rounded-xl overflow-hidden border border-blue-200 shadow-sm bg-gray-100 flex-shrink-0">
                              <img
                                src={v.image.startsWith('http') ? v.image : `http://localhost:8000${v.image}`}
                                alt={v.vehicle_type}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${accent.badge} text-white shadow-sm flex-shrink-0`}>
                              <FontAwesomeIcon icon={faCar} className="text-lg" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-extrabold text-gray-800 text-base">{v.vehicle_type}</h3>
                            <p className="text-xs text-gray-500 font-medium">Capacity: {v.seating_capacity} Seats</p>
                            <p className="text-sm font-mono text-blue-600 font-extrabold tracking-wider">{v.vehicle_number}</p>
                          </div>
                        </div>

                        {/* Distance & Rate details */}
                        <div className="grid grid-cols-2 border-t border-gray-100/80 pt-3">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rate Per KM</p>
                            <p className="text-sm font-extrabold text-gray-700">₹{parseFloat(v.price_per_km.toString()).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Est. Distance</p>
                            <p className="text-sm font-extrabold text-gray-700">
                              {estimate ? `${parseFloat(estimate.distance.toString()).toFixed(1)} KM` : '—'}
                            </p>
                          </div>
                        </div>

                        {/* Total estimate */}
                        <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100 flex justify-between items-center mt-auto">
                          <span className="text-xs text-gray-500 font-semibold">Est. Fare:</span>
                          <span className="text-base font-black text-gray-800">
                            {estimate ? `₹${parseFloat(estimate.fare.toString()).toFixed(2)}` : 'Enter route'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/bookings' : '/customer/dashboard')}
              className="px-6 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-55 active:bg-gray-100 transition-all text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={vehiclesLoading || !vehicleId}
              className="px-8 py-3.5 bg-[#275981] hover:bg-[#1c4362] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all text-sm cursor-pointer"
            >
              Confirm Booking Details
            </button>
          </div>
        </form>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#274782] to-[#352E6B] text-white px-6 py-6 text-center">
              <h3 className="text-lg font-black tracking-wide uppercase">Review Booking Details</h3>
              <p className="text-blue-100 text-xs mt-1">Please verify your booking information below</p>
            </div>

            <div className="p-6 space-y-6">
              {isAdmin && (
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Info (Admin console)</p>
                  <p className="text-sm font-extrabold text-gray-800">{customerName}</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">{customerMobile}</p>
                </div>
              )}

              {/* Selected Vehicle Card Display (Read-Only) */}
              {selectedVehicle && (
                <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 flex items-center gap-4">
                  {selectedVehicle.image ? (
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-blue-200 shadow-sm bg-white flex-shrink-0">
                      <img
                        src={selectedVehicle.image.startsWith('http') ? selectedVehicle.image : `http://localhost:8000${selectedVehicle.image}`}
                        alt={selectedVehicle.vehicle_type}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm flex-shrink-0">
                      <FontAwesomeIcon icon={faCar} className="text-lg" />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Selected Vehicle</span>
                    <h4 className="font-extrabold text-gray-800 text-sm">{selectedVehicle.vehicle_type}</h4>
                    <p className="text-xs font-mono font-bold text-gray-600">{selectedVehicle.vehicle_number} • {selectedVehicle.seating_capacity} Seats</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pickup Location</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{pickupLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Drop Location</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{dropLocation}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trip Start</p>
                  <p className="text-sm font-semibold text-gray-800">{bookingDate} @ {bookingTime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Trip Expected End</p>
                  <p className="text-sm font-semibold text-gray-800">{expectedEndDate} @ {expectedEndTime}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Passengers</p>
                  <p className="text-sm font-semibold text-gray-800">{passengerCount} Person{parseInt(passengerCount) > 1 ? 's' : ''}</p>
                </div>
                {selectedEstimate && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Est. Distance</p>
                    <p className="text-sm font-semibold text-gray-800">{parseFloat(selectedEstimate.distance.toString()).toFixed(1)} KM</p>
                  </div>
                )}
              </div>

              {selectedEstimate && (
                <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50 flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-bold">Estimated Fare Amount:</span>
                  <span className="text-xl font-black text-blue-900">₹{parseFloat(selectedEstimate.fare.toString()).toFixed(2)}</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  disabled={bookingLoading}
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 text-center border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-55 active:bg-gray-100 transition-all text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={bookingLoading}
                  onClick={handleConfirmBooking}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl shadow-lg hover:shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {bookingLoading && <FontAwesomeIcon icon={faSpinner} spin />}
                  <span>{bookingLoading ? 'Booking Cab...' : 'Confirm Book'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingForm;
