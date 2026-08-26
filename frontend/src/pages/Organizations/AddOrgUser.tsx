import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';

interface Company {
  companyId: string;
  companyName: string;
}

const AddOrgUser: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    username: '',
    email: '',
    mobile: '',
    password: '',
    companyId: '',
    isManager: false,
    gender: 'male',
    country: 'India',
    city: '',
    state: '',
    pinCode: '',
    userAddress: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axiosInstance.get('/company/getAllCompany').then((res) => {
      const data: Company[] = Array.isArray(res.data) ? res.data : res.data?.companies || [];
      setCompanies(data);
    }).catch(() => {});
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.email || !form.mobile || !form.password || !form.companyId) {
      showToast('Name, email, mobile, password and organization are required', 'error');
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post('/auth/createUser', {
        ...form,
        role: 'user',
        status: 'active',
        isConfirmed: true,
        companyManager: form.isManager,
      });
      showToast('Organization user added successfully!', 'success');
      navigate('/organizations/users');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to add user', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Add Organization User</h1>
          <p className="text-sm text-gray-500 mt-0.5">Register a passenger or manager under an organization</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
          {/* Organization selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Organization <span className="text-red-500">*</span>
            </label>
            <select name="companyId" value={form.companyId} onChange={handleChange} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Organization</option>
              {companies.map((c) => (
                <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
              ))}
            </select>
          </div>

          {/* Manager toggle */}
          <div className="flex items-center gap-3 py-2 px-4 bg-purple-50 rounded-lg border border-purple-100">
            <input type="checkbox" id="isManager" name="isManager" checked={form.isManager}
              onChange={handleChange} className="w-4 h-4 accent-purple-600" />
            <label htmlFor="isManager" className="text-sm font-medium text-purple-800 cursor-pointer">
              Register as Organization Manager (can book for all passengers)
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name <span className="text-red-500">*</span></label>
              <input name="username" value={form.username} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Passenger Name" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@company.com" required />
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
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Address</label>
            <textarea name="userAddress" value={form.userAddress} onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2} placeholder="Office address..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60">
              {loading ? 'Adding...' : form.isManager ? 'Add Manager' : 'Add Passenger'}
            </button>
            <button type="button" onClick={() => navigate('/organizations/users')}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium transition">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddOrgUser;
