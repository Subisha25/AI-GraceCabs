import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';

interface Company { companyId: string; companyName: string; }
interface VehicleType { vehicleTypeId: string; vehicleTypeName: string; }

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AddSchedule: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [form, setForm] = useState({
    scheduleName: '',
    organizationId: '',
    pickupLocation: '',
    dropLocation: '',
    pickupTime: '',
    startDate: '',
    endDate: '',
    vehicleTypeId: '',
    passengerCount: '1',
    notes: '',
  });
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/organizations').then((res) => {
      const list = (res.data?.data || []).map((c: any) => ({
        companyId: c.id,
        companyName: c.name
      }));
      setCompanies(list);
    }).catch(() => {});

    axiosInstance.get('/vehicles').then((res) => {
      const rawVehicles = res.data?.data || [];
      const seen = new Set();
      const vtList: VehicleType[] = [];
      rawVehicles.forEach((item: any) => {
        if (!seen.has(item.vehicle_type)) {
          seen.add(item.vehicle_type);
          vtList.push({
            vehicleTypeId: item.id,
            vehicleTypeName: item.vehicle_type
          });
        }
      });
      setVehicleTypes(vtList);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduleName || !form.organizationId || !form.pickupLocation || !form.dropLocation) {
      showToast('Schedule name, organization, pickup, and drop are required', 'error');
      return;
    }
    if (selectedDays.length === 0) {
      showToast('Select at least one day for the schedule', 'error');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/schedules', {
        ...form,
        days: selectedDays.join(','),
        passengerCount: parseInt(form.passengerCount),
      });
      showToast('Schedule created successfully!', 'success');
      navigate('/schedules');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add Schedule</h1>
          <p className="text-sm text-gray-500 mt-0.5">Create a recurring transport schedule for an organization</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Schedule Name <span className="text-red-500">*</span></label>
              <input name="scheduleName" value={form.scheduleName} onChange={handleChange} required
                placeholder="e.g. Morning Office Run"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Organization <span className="text-red-500">*</span></label>
              <select name="organizationId" value={form.organizationId} onChange={handleChange} required
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Organization</option>
                {companies.map((c) => (<option key={c.companyId} value={c.companyId}>{c.companyName}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Location <span className="text-red-500">*</span></label>
              <input name="pickupLocation" value={form.pickupLocation} onChange={handleChange} required
                placeholder="e.g. Tambaram Railway Station"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Drop Location <span className="text-red-500">*</span></label>
              <input name="dropLocation" value={form.dropLocation} onChange={handleChange} required
                placeholder="e.g. DLF IT Park, Manapakkam"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Time</label>
              <input type="time" name="pickupTime" value={form.pickupTime} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Type</label>
              <select name="vehicleTypeId" value={form.vehicleTypeId} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Any</option>
                {vehicleTypes.map((v) => (<option key={v.vehicleTypeId} value={v.vehicleTypeId}>{v.vehicleTypeName}</option>))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Passengers</label>
              <input type="number" name="passengerCount" value={form.passengerCount} onChange={handleChange} min="1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Day selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operating Days <span className="text-red-500">*</span></label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day} type="button" onClick={() => toggleDay(day)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedDays.includes(day)
                      ? 'bg-blue-600 text-white shadow'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
            {selectedDays.length > 0 && (
              <p className="text-xs text-gray-400 mt-1.5">Selected: {selectedDays.join(', ')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
            <textarea name="notes" value={form.notes} onChange={handleChange} rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60">
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>
            <button type="button" onClick={() => navigate('/schedules')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSchedule;
