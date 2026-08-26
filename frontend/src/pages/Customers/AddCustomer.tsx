import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';

const AddCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    gender: 'male',
    country: 'India',
    city: '',
    state: '',
    pinCode: '',
    userAddress: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.mobile || !form.password) {
      showToast('Name, email, mobile and password are required', 'error');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/auth/createUser', {
        ...form,
        role: 'user',
        status: 'active',
        isConfirmed: true,
        companyId: null,
      });
      showToast('Customer added successfully!', 'success');
      navigate('/customers');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to add customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add Customer</h1>
          <p className="text-sm text-gray-500 mt-0.5">Register a new individual customer on the platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input name="username" value={form.username} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Arjun Kumar" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="customer@email.com" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile <span className="text-red-500">*</span></label>
              <input name="mobile" value={form.mobile} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="9876543210" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-red-500">*</span></label>
              <input name="password" type="password" value={form.password} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Min 8 characters" required minLength={8} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">City</label>
              <input name="city" value={form.city} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chennai" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">State</label>
              <input name="state" value={form.state} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Tamil Nadu" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Pin Code</label>
              <input name="pinCode" value={form.pinCode} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="600001" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <textarea name="userAddress" value={form.userAddress} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Full address..." rows={3} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60">
              {loading ? 'Adding...' : 'Add Customer'}
            </button>
            <button type="button" onClick={() => navigate('/customers')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomer;
