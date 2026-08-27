import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import PageLayout from '../../components/PageLayout';

interface Organization {
  id: string;
  name: string;
  allow_tax: boolean;
}

interface Vehicle {
  id: string;
  vehicle_name: string;
  vehicle_number: string;
}

interface Tax {
  id: string;
  tax_name: string;
  tax_type: string;
  percentage: number;
  status: string;
}

interface Stop {
  stop_name: string;
  address: string;
  latitude: string;
  longitude: string;
  sequence: number;
}

const AddContract: React.FC = () => {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTaxes, setActiveTaxes] = useState<Tax[]>([]);
  
  // Custom Stops & Selected Taxes State
  const [stops, setStops] = useState<Stop[]>([]);
  const [selectedTaxIds, setSelectedTaxIds] = useState<string[]>([]);
  
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
    billing_contact: '',
    billing_email: '',
    status: 'draft',
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orgIdFromUrl = params.get('organization_id') || '';

    // Fetch organizations
    axiosInstance.get('/organizations').then((res) => {
      setOrganizations(res.data?.data || []);
      if (orgIdFromUrl) {
        setForm((prev) => ({ ...prev, organization_id: orgIdFromUrl }));
      }
    }).catch(() => {});

    // Fetch vehicles
    axiosInstance.get('/vehicles').then((res) => {
      setVehicles(res.data?.data || []);
    }).catch(() => {});

    // Fetch active taxes
    axiosInstance.get('/taxes').then((res) => {
      const allTaxes = res.data?.data || [];
      setActiveTaxes(allTaxes.filter((t: Tax) => t.status.toLowerCase() === 'active'));
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const selectedOrg = organizations.find((o) => o.id === form.organization_id);

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
        tax_rate_percent: 0.00,
        stops: stops.map((s, index) => ({
          stop_name: s.stop_name,
          address: s.address,
          latitude: s.latitude ? parseFloat(s.latitude) : null,
          longitude: s.longitude ? parseFloat(s.longitude) : null,
          sequence: index + 1
        })),
        taxes: selectedOrg?.allow_tax ? selectedTaxIds : []
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
    <PageLayout>
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
                    <option value="">Select Vehicle</option>
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

            {/* ROUTE STOPS CONFIGURATION */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <h3 className="text-sm font-bold text-blue-900">Route Stops Configuration</h3>
                <button
                  type="button"
                  onClick={() => setStops(prev => [...prev, { stop_name: '', address: '', latitude: '', longitude: '', sequence: prev.length + 1 }])}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  + Add Stop
                </button>
              </div>
              {stops.length === 0 ? (
                <p className="text-xs text-gray-400">No stops configured. Added stops will represent pickup/drop points in order.</p>
              ) : (
                <div className="space-y-4">
                  {stops.map((stop, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-3 items-start border border-gray-50 p-3 rounded-lg bg-gray-50/50">
                      <div className="flex-1 w-full space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded">Stop #{idx + 1}</span>
                          <input
                            type="text"
                            placeholder="Stop Name (e.g. Surandai)"
                            required
                            value={stop.stop_name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStops(prev => {
                                const copy = [...prev];
                                copy[idx].stop_name = val;
                                return copy;
                              });
                            }}
                            className="flex-1 border border-gray-200 rounded px-2.5 py-1 text-xs outline-none bg-white"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Stop Location Address"
                          required
                          value={stop.address}
                          onChange={(e) => {
                            const val = e.target.value;
                            setStops(prev => {
                              const copy = [...prev];
                              copy[idx].address = val;
                              return copy;
                            });
                          }}
                          className="w-full border border-gray-200 rounded px-2.5 py-1 text-xs outline-none bg-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="Latitude (Optional)"
                            value={stop.latitude}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStops(prev => {
                                const copy = [...prev];
                                copy[idx].latitude = val;
                                return copy;
                              });
                            }}
                            className="border border-gray-200 rounded px-2.5 py-1 text-xs outline-none bg-white"
                          />
                          <input
                            type="number"
                            step="0.000001"
                            placeholder="Longitude (Optional)"
                            value={stop.longitude}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStops(prev => {
                                const copy = [...prev];
                                copy[idx].longitude = val;
                                return copy;
                              });
                            }}
                            className="border border-gray-200 rounded px-2.5 py-1 text-xs outline-none bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex md:flex-col gap-1 w-full md:w-auto justify-end">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => {
                            setStops(prev => {
                              const copy = [...prev];
                              const temp = copy[idx];
                              copy[idx] = copy[idx - 1];
                              copy[idx - 1] = temp;
                              return copy;
                            });
                          }}
                          className="px-2 py-1 text-[10px] font-bold border border-gray-200 rounded bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                          Up
                        </button>
                        <button
                          type="button"
                          disabled={idx === stops.length - 1}
                          onClick={() => {
                            setStops(prev => {
                              const copy = [...prev];
                              const temp = copy[idx];
                              copy[idx] = copy[idx + 1];
                              copy[idx + 1] = temp;
                              return copy;
                            });
                          }}
                          className="px-2 py-1 text-[10px] font-bold border border-gray-200 rounded bg-white hover:bg-gray-100 disabled:opacity-50"
                        >
                          Down
                        </button>
                        <button
                          type="button"
                          onClick={() => setStops(prev => prev.filter((_, i) => i !== idx))}
                          className="px-2 py-1 text-[10px] font-bold text-rose-600 border border-rose-100 rounded bg-rose-50 hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              </div>

              {selectedOrg?.allow_tax ? (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Apply Tax Configurations</label>
                  {activeTaxes.length === 0 ? (
                    <p className="text-xs text-gray-400">No active tax rates configured in master settings.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {activeTaxes.map((tax) => (
                        <label key={tax.id} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedTaxIds.includes(tax.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setSelectedTaxIds(prev => checked ? [...prev, tax.id] : prev.filter(id => id !== tax.id));
                            }}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span>{tax.tax_name} ({tax.tax_type} — {tax.percentage}%)</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg">
                  <p className="text-xs font-medium text-amber-800">
                    Tax options are disabled because the selected Client Organization has "Allow Tax Management" turned OFF.
                  </p>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#1B4F8A] hover:bg-blue-800 text-white font-bold text-sm rounded-lg shadow-sm transition disabled:opacity-50"
            >
              {loading ? 'Registering Contract...' : 'Save Transport Contract'}
            </button>
          </form>
        </div>
      </div>
    </PageLayout>
  );
};

export default AddContract;
