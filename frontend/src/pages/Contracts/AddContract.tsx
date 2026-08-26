import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';

interface Organization { id: string; name: string; }
interface Vehicle { id: string; vehicle_name: string; vehicle_number: string; }

const AddContract: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  const [form, setForm] = useState({
    organization_id: '',
    contract_name: '',
    vehicle_id: '',
    pricing_model: 'PER_KM',
    start_date: '',
    end_date: '',
    pickup_location: '',
    drop_location: '',
    working_days: '22',
    hours_per_day: '8',
    km_per_day: '100',
    rate_per_km: '15.00',
    monthly_fixed_amount: '0.00',
    billing_cycle: 'monthly',
    service_days: 'Mon,Tue,Wed,Thu,Fri',
    number_of_vehicles: '1',
    tax_rate_percent: '0.00',
    billing_contact: '',
    billing_email: '',
    status: 'draft',
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch organizations
    axiosInstance.get('/organizations').then((res) => {
      setOrganizations(res.data?.data || []);
    }).catch(() => {});

    // Fetch vehicles
    axiosInstance.get('/vehicles').then((res) => {
      setVehicles(res.data?.data || []);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.organization_id || !form.contract_name || !form.start_date || !form.end_date || !form.pickup_location || !form.drop_location) {
      showToast('Please complete all required fields (*)', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const payload = {
        ...form,
        contract_type: 'km_based', // legacy fallback compat
        working_days: parseInt(form.working_days),
        hours_per_day: form.hours_per_day ? parseFloat(form.hours_per_day) : null,
        km_per_day: form.km_per_day ? parseFloat(form.km_per_day) : null,
        rate_per_km: parseFloat(form.rate_per_km),
        monthly_fixed_amount: parseFloat(form.monthly_fixed_amount),
        number_of_vehicles: parseInt(form.number_of_vehicles),
        tax_rate_percent: parseFloat(form.tax_rate_percent),
      };
      
      await axiosInstance.post('/contracts', payload);
      showToast('Organization contract registered successfully!', 'success');
      navigate('/contracts');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to create contract.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800 font-sans">New Transport Contract</h1>
            <p className="text-xs text-gray-500 mt-0.5">Define corporate customized pricing and transport overrides</p>
          </div>
          <button
            onClick={() => navigate('/contracts')}
            className="text-xs font-semibold text-gray-500 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* SECTION 1: ORGANIZATION */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 border-b border-gray-100 pb-2">Organization Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Client Organization <span className="text-red-500">*</span></label>
                <select name="organization_id" value={form.organization_id} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option value="">Select Organization</option>
                  {organizations.map((org) => (<option key={org.id} value={org.id}>{org.name}</option>))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Contract Name <span className="text-red-500">*</span></label>
                <input type="text" name="contract_name" value={form.contract_name} onChange={handleChange} required
                  placeholder="e.g. ABC College Daily Shuttle" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTRACT PERIOD */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 border-b border-gray-100 pb-2">Contract Period</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Start Date <span className="text-red-500">*</span></label>
                <input type="date" name="start_date" value={form.start_date} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">End Date <span className="text-red-500">*</span></label>
                <input type="date" name="end_date" value={form.end_date} onChange={handleChange} required
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
            </div>
          </div>

          {/* SECTION 3: SERVICE DETAILS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 border-b border-gray-100 pb-2">Service Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Service Days</label>
                <input type="text" name="service_days" value={form.service_days} onChange={handleChange}
                  placeholder="e.g. Mon,Tue,Wed,Thu,Fri" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hours Per Day</label>
                <input type="number" name="hours_per_day" value={form.hours_per_day} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Expected Daily KM</label>
                <input type="number" name="km_per_day" value={form.km_per_day} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Pickup Location <span className="text-red-500">*</span></label>
                <input type="text" name="pickup_location" value={form.pickup_location} onChange={handleChange} required
                  placeholder="e.g. College Campus Gate A" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Drop Location <span className="text-red-500">*</span></label>
                <input type="text" name="drop_location" value={form.drop_location} onChange={handleChange} required
                  placeholder="e.g. Student route points" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Vehicle Model (Optional)</label>
                <select name="vehicle_id" value={form.vehicle_id} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option value="">Select Vehicle Type</option>
                  {vehicles.map((v) => (<option key={v.id} value={v.id}>{v.vehicle_name} ({v.vehicle_number})</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Number of Vehicles</label>
                <input type="number" name="number_of_vehicles" value={form.number_of_vehicles} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Working Days Per Month</label>
                <input type="number" name="working_days" value={form.working_days} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Initial Status</label>
                <select name="status" value={form.status} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 4: PRICING */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 border-b border-gray-100 pb-2">Pricing Structure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Pricing Model</label>
                <select name="pricing_model" value={form.pricing_model} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                  <option value="PER_KM">Per KM Invoicing</option>
                  <option value="FIXED_MONTHLY">Fixed Monthly Contract</option>
                </select>
              </div>

              {form.pricing_model === 'PER_KM' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Agreed Rate Per KM (INR)</label>
                  <input type="number" step="0.01" name="rate_per_km" value={form.rate_per_km} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Agreed Monthly Amount (INR)</label>
                  <input type="number" step="0.01" name="monthly_fixed_amount" value={form.monthly_fixed_amount} onChange={handleChange}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 5: BILLING */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h3 className="text-sm font-bold text-blue-900 border-b border-gray-100 pb-2">Billing Contacts & Tax Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Billing Contact Person</label>
                <input type="text" name="billing_contact" value={form.billing_contact} onChange={handleChange}
                  placeholder="Accounts Manager" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Billing Contact Email</label>
                <input type="email" name="billing_email" value={form.billing_email} onChange={handleChange}
                  placeholder="billing@client.local" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tax Rate Percentage (%)</label>
                <input type="number" step="0.01" name="tax_rate_percent" value={form.tax_rate_percent} onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
          >
            {loading ? 'Registering Contract...' : 'Save Transport Contract'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddContract;
