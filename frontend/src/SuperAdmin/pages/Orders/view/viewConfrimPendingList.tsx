import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../../../utils/axiosInstance";
import PageLayout from "../../../../components/PageLayout";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft, faUser, faPhone, faMapMarkerAlt, faCalendarAlt,
  faClock, faCar, faUserShield, faFileInvoice, faCheckCircle,
  faSpinner, faCompass, faTimesCircle, faTruck
} from "@fortawesome/free-solid-svg-icons";

interface Booking {
  id: string;
  booking_code: string;
  booking_type: string;
  pickup_location: string;
  drop_location: string;
  booking_date: string;
  booking_time: string;
  passenger_count: number;
  estimated_distance_km: string | number;
  estimated_fare: string | number;
  actual_distance_km: string | number | null;
  final_fare: string | number | null;
  status: string;
  rejection_reason: string | null;
  customer?: { name: string; mobile: string; email: string };
  organization?: { name: string };
  vehicle?: { id: string; vehicle_name: string; vehicle_number: string };
  driver?: { id: string; name: string; mobile: string };
  invoice?: { id: string; invoice_number: string; total_amount: string | number; status: string };
}

interface DriverOption { id: string; name: string; mobile: string; status: string; availability: string; }
interface VehicleOption { id: string; vehicle_name: string; vehicle_number: string; status: string; }

const ViewConfirmPendingOrder: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Rejection state
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Driver Assignment state
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState("");

  const fetchBookingDetails = async () => {
    try {
      const res = await axiosInstance.get(`/bookings/${bookingId}`);
      if (res.data && res.data.success) {
        setBooking(res.data.data);
      } else {
        showToast("Booking not found", "error");
        navigate("/bookings");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to load booking details", "error");
      navigate("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentOptions = async () => {
    try {
      const [driverRes, vehicleRes] = await Promise.all([
        axiosInstance.get("/drivers"),
        axiosInstance.get("/vehicles")
      ]);
      
      const rawDrivers = driverRes.data?.data || [];
      const rawVehicles = vehicleRes.data?.data || [];

      // Filter active drivers and available vehicles
      setDrivers(rawDrivers.filter((d: DriverOption) => d.status === "active"));
      setVehicles(rawVehicles.filter((v: VehicleOption) => v.status === "available"));
    } catch (err) {
      console.warn("Failed to load assignment dropdown options", err);
    }
  };

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    if (booking && booking.status === "accepted") {
      fetchAssignmentOptions();
    }
  }, [booking?.status]);

  const handleAccept = async () => {
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/accept`);
      if (res.data && res.data.success) {
        showToast("Booking request approved!", "success");
        fetchBookingDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to accept booking", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      showToast("Rejection reason is required", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/reject`, {
        reason: rejectionReason,
      });
      if (res.data && res.data.success) {
        showToast("Booking request rejected and customer notified.", "success");
        setShowRejectForm(false);
        fetchBookingDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to reject booking", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriver || !selectedVehicle) {
      showToast("Driver and Vehicle must be selected", "error");
      return;
    }
    setActionLoading(true);
    try {
      const res = await axiosInstance.post(`/bookings/${bookingId}/assign-driver`, {
        driver_id: selectedDriver,
        vehicle_id: selectedVehicle,
      });
      if (res.data && res.data.success) {
        showToast("Driver and Vehicle assigned successfully!", "success");
        fetchBookingDetails();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to assign resources", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-4" />
          <p>Loading booking details...</p>
        </div>
      </PageLayout>
    );
  }

  if (!booking) return null;

  return (
    <PageLayout>
      <AlertContainer />
      <div className="max-w-4xl mx-auto py-6 space-y-6">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/bookings")} className="text-gray-500 hover:text-gray-900 transition p-2 hover:bg-gray-50 rounded-lg">
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-800">Booking: {booking.booking_code}</h1>
              <p className="text-sm text-gray-500 mt-1">Lifecycle transition details and dispatcher controls</p>
            </div>
          </div>
          <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
            booking.status === 'accepted' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
            booking.status === 'confirmed' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
            booking.status === 'started' ? 'bg-orange-100 text-orange-800 border border-orange-200 animate-pulse' :
            booking.status === 'completed' ? 'bg-green-100 text-green-800 border border-green-200' :
            'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {booking.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Info Columns (2/3 width) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Card: Booking Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-3">Booking Information</h2>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">Pickup Location</p>
                  <p className="font-semibold text-gray-700 mt-1 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-green-500" />
                    {booking.pickup_location}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">Drop Location</p>
                  <p className="font-semibold text-gray-700 mt-1 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
                    {booking.drop_location}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">Booking Date</p>
                  <p className="font-semibold text-gray-700 mt-1 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                    {new Date(booking.booking_date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">Pickup Time</p>
                  <p className="font-semibold text-gray-700 mt-1 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faClock} className="text-gray-400" />
                    {booking.booking_time}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">Distance (Estimated)</p>
                  <p className="font-bold text-gray-800 mt-1">{booking.estimated_distance_km} KM</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs uppercase font-semibold">Fare (Estimated)</p>
                  <p className="font-bold text-gray-800 mt-1">₹{Number(booking.estimated_fare).toLocaleString("en-IN")}</p>
                </div>
              </div>

              {booking.rejection_reason && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mt-3">
                  <p className="text-xs text-red-800 font-bold uppercase">Rejection Reason</p>
                  <p className="text-sm text-red-700 mt-1">{booking.rejection_reason}</p>
                </div>
              )}
            </div>

            {/* Contextual Actions card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800 border-b pb-2 mb-4">Dispatcher Console</h2>
              
              {booking.status === 'pending' && (
                <div className="space-y-4">
                  {!showRejectForm ? (
                    <div className="flex gap-4">
                      <button onClick={handleAccept} disabled={actionLoading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg shadow-sm transition">
                        Accept Booking
                      </button>
                      <button onClick={() => setShowRejectForm(true)} disabled={actionLoading}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 font-bold py-3 rounded-lg border border-red-100 transition">
                        Reject Booking
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRejectSubmit} className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">Rejection Reason <span className="text-red-500">*</span></label>
                      <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} required
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="State reason for declining transport request..." />
                      <div className="flex gap-2">
                        <button type="submit" disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
                          Confirm Rejection
                        </button>
                        <button type="button" onClick={() => setShowRejectForm(false)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-5 py-2 rounded-lg text-sm font-medium transition">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {booking.status === 'accepted' && (
                <form onSubmit={handleAssign} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Active Driver</label>
                      <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)} required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Choose Driver</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id} disabled={d.availability !== 'AVAILABLE'}>
                            {d.name} ({d.mobile}) - {d.availability}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Available Vehicle</label>
                      <select value={selectedVehicle} onChange={(e) => setSelectedVehicle(e.target.value)} required
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Choose Vehicle</option>
                        {vehicles.map(v => (<option key={v.id} value={v.id}>{v.vehicle_name} ({v.vehicle_number})</option>))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={actionLoading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-sm transition">
                    Assign Resources & Confirm Booking
                  </button>
                </form>
              )}

              {booking.status === 'confirmed' && (
                <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-indigo-800 text-sm">
                  <FontAwesomeIcon icon={faCompass} className="text-xl text-indigo-600 animate-spin-slow" />
                  <span>Driver assigned. Awaiting driver to start the trip from the mobile console.</span>
                </div>
              )}

              {booking.status === 'started' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl p-4 text-orange-800 text-sm">
                    <FontAwesomeIcon icon={faCompass} className="text-xl text-orange-600 animate-pulse" />
                    <span>Trip is currently active. Click track below to view real-time location.</span>
                  </div>
                  <button onClick={() => navigate(`/customer/track/${booking.id}`)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg shadow-sm transition">
                    Track Live Ride Progress
                  </button>
                </div>
              )}

              {['completed', 'completed', 'paid'].includes(booking.status) && (
                <div className="flex items-center gap-3 bg-green-50 border border-green-100 rounded-xl p-4 text-green-800 text-sm">
                  <FontAwesomeIcon icon={faCheckCircle} className="text-xl text-green-600" />
                  <span>Trip successfully closed. Financial billing records and invoices generated.</span>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar cards (1/3 width) */}
          <div className="space-y-6">
            
            {/* Customer Details card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <h2 className="text-md font-bold text-gray-800 border-b pb-1.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                Customer Info
              </h2>
              {booking.customer ? (
                <div className="text-sm space-y-2.5">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Name</p>
                    <p className="font-semibold text-gray-700 mt-0.5">{booking.customer.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Mobile</p>
                    <p className="font-medium text-gray-600 mt-0.5">{booking.customer.mobile}</p>
                  </div>
                  {booking.organization && (
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Organization</p>
                      <p className="font-medium text-gray-600 mt-0.5">{booking.organization.name}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No customer metadata linked.</p>
              )}
            </div>

            {/* Assigned Driver/Vehicle card */}
            {(booking.driver || booking.vehicle) && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="text-md font-bold text-gray-800 border-b pb-1.5 flex items-center gap-2">
                  <FontAwesomeIcon icon={faTruck} className="text-gray-400" />
                  Resources
                </h2>
                <div className="text-sm space-y-3.5">
                  {booking.driver && (
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Assigned Driver</p>
                      <p className="font-semibold text-gray-700 mt-0.5">{booking.driver.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">({booking.driver.mobile})</p>
                    </div>
                  )}
                  {booking.vehicle && (
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Vehicle Asset</p>
                      <p className="font-semibold text-gray-700 mt-0.5">{booking.vehicle.vehicle_name}</p>
                      <p className="text-xs text-indigo-600 font-mono font-bold mt-0.5 uppercase">{booking.vehicle.vehicle_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice card */}
            {booking.invoice && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <h2 className="text-md font-bold text-gray-800 border-b pb-1.5 flex items-center gap-2">
                  <FontAwesomeIcon icon={faFileInvoice} className="text-gray-400" />
                  Invoice Billing
                </h2>
                <div className="text-sm space-y-2.5">
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Invoice ID</p>
                    <p className="font-mono text-gray-800 font-bold mt-0.5">{booking.invoice.invoice_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Amount Settled</p>
                    <p className="font-bold text-gray-800 mt-0.5">₹{Number(booking.invoice.total_amount).toLocaleString("en-IN")}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Status</p>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase mt-1 ${
                      booking.invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {booking.invoice.status === 'payment_pending' ? 'Pending' : booking.invoice.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default ViewConfirmPendingOrder;
