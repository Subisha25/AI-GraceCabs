import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMapMarkerAlt, faUser, faPhone, faCar, faCompass, 
  faArrowLeft, faSpinner, faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import { showToast, AlertContainer } from '../../components/AlertBox';

interface TrackingData {
  booking_code: string;
  status: string;
  latitude: number | string | null;
  longitude: number | string | null;
  recorded_at: string | null;
  driver_name?: string;
  driver_mobile?: string;
  vehicle_number?: string;
  vehicle_name?: string;
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

const CustomerTrackRide: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  
  const [data, setData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [markerInstance, setMarkerInstance] = useState<any>(null);

  const fetchTracking = async () => {
    try {
      const res = await axiosInstance.get(`/bookings/${bookingId}/tracking`);
      if (res.data && res.data.success) {
        const tracking = res.data.data;
        setData(tracking);

        const lat = tracking.latitude ? parseFloat(tracking.latitude as string) : null;
        const lng = tracking.longitude ? parseFloat(tracking.longitude as string) : null;

        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          const L = (window as any).L;
          if (L && mapInstance) {
            mapInstance.setView([lat, lng], 15);
            if (markerInstance) {
              markerInstance.setLatLng([lat, lng]);
            } else {
              const marker = L.marker([lat, lng]).addTo(mapInstance)
                .bindPopup('Driver live location')
                .openPopup();
              setMarkerInstance(marker);
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to load tracking updates', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(fetchTracking, 10000); // update every 10 seconds
    return () => clearInterval(interval);
  }, [bookingId, mapInstance, markerInstance]);

  // Handle Leaflet Map Initialization dynamically
  useEffect(() => {
    if (!data || !data.latitude || !data.longitude || mapInstance) return;

    const lat = parseFloat(data.latitude as string);
    const lng = parseFloat(data.longitude as string);
    if (isNaN(lat) || isNaN(lng)) return;

    // Load Leaflet css
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (L) {
        const mapContainer = document.getElementById('map');
        if (mapContainer && !mapInstance) {
          const map = L.map('map').setView([lat, lng], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);
          const marker = L.marker([lat, lng]).addTo(map)
            .bindPopup('Driver live location')
            .openPopup();
          
          setMapInstance(map);
          setMarkerInstance(marker);
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      link.remove();
      script.remove();
    };
  }, [data, mapInstance]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-400">
        <FontAwesomeIcon icon={faSpinner} spin className="text-4xl mb-3" />
        <p className="text-sm font-medium">Connecting to GPS tracker...</p>
      </div>
    );
  }

  const lat = data?.latitude ? parseFloat(data.latitude as string) : null;
  const lng = data?.longitude ? parseFloat(data.longitude as string) : null;
  const isGpsAvailable = lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AlertContainer />
      
      {/* Header bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
          <FontAwesomeIcon icon={faArrowLeft} />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-lg font-bold text-gray-800">
          Track Ride: {data?.booking_code || 'BK-******'}
        </h1>
        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
          data?.status === 'started' ? 'bg-blue-100 text-blue-800 animate-pulse' : 'bg-gray-100 text-gray-800'
        }`}>
          {data?.status || 'Unknown'}
        </span>
      </div>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Left Side: Map / GPS Status */}
        <div className="flex-1 min-h-[350px] md:min-h-0 bg-gray-200 relative flex items-center justify-center">
          {isGpsAvailable ? (
            <div id="map" className="w-full h-full absolute inset-0 z-10" />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center space-y-3 z-20">
              <div className="w-16 h-16 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-2xl" />
              </div>
              <h2 className="text-lg font-bold text-gray-800">Live location unavailable</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                The driver has not started the trip or GPS coordinates are not being emitted at this moment.
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Driver & Vehicle Details card */}
        <div className="w-full md:w-96 bg-white border-t md:border-t-0 md:border-l p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Driver Details</h2>
              <p className="text-xs text-gray-400 mt-0.5">Assigned operator dispatch context</p>
            </div>

            {/* Driver Profile */}
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faUser} className="text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{data?.driver_name || 'Assigned Driver'}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                  <FontAwesomeIcon icon={faPhone} className="text-xs text-gray-400" />
                  {data?.driver_mobile || '—'}
                </p>
              </div>
            </div>

            {/* Vehicle Profile */}
            <div className="flex gap-4 items-center border-t pt-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                <FontAwesomeIcon icon={faCar} className="text-lg" />
              </div>
              <div>
                <h3 className="font-bold text-gray-800">{data?.vehicle_name || 'Vehicle Model'}</h3>
                <p className="text-sm text-indigo-600 font-mono font-semibold mt-0.5">
                  {data?.vehicle_number || '—'}
                </p>
              </div>
            </div>

            {/* Tracking Status indicator */}
            {isGpsAvailable && (
              <div className="flex gap-4 items-center border-t pt-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
                  <FontAwesomeIcon icon={faCompass} className="text-lg" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">GPS Signal Connected</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Last coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t pt-4 text-center">
            <p className="text-xs text-gray-400">Live Dispatch Telemetry Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerTrackRide;
