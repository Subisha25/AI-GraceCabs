import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faPhone, faEnvelope, faMapMarkerAlt, faSpinner, faSave } from '@fortawesome/free-solid-svg-icons';
import { showToast } from '../../components/AlertBox';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    address: '',
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    axiosInstance
      .get('/auth/me')
      .then((res) => {
        const u = res.data?.data || {};
        setForm({
          name: u.name || '',
          email: u.email || '',
          mobile: u.mobile || '',
          address: u.address || '',
        });
      })
      .catch((err) => {
        showToast('Failed to load user profile', 'error');
      })
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.mobile) {
      showToast('Name and mobile number are required', 'error');
      return;
    }

    setSaving(true);
    try {
      await axiosInstance.put('/auth/profile', {
        name: form.name,
        email: form.email || null,
        mobile: form.mobile,
        address: form.address || null,
      });

      localStorage.setItem('username', form.name);
      showToast('Profile updated successfully!', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
        <div className="text-gray-400 flex items-center gap-2">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl" />
          <span>Loading profile settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your personal identification and address variables</p>
      </div>

      <div className="max-w-2xl bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name *</label>
            <div className="relative">
              <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              <input 
                type="text" 
                name="name" 
                value={form.name} 
                onChange={handleChange} 
                required
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mobile Number *</label>
            <div className="relative">
              <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              <input 
                type="tel" 
                name="mobile" 
                value={form.mobile} 
                onChange={handleChange} 
                required
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
            <div className="relative">
              <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              <input 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30" 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Street Address</label>
            <div className="relative">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
              <textarea 
                name="address" 
                value={form.address} 
                onChange={handleChange} 
                rows={3}
                className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50/30" 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={saving}
            className="w-full py-3 bg-[#275981] hover:bg-[#1c4362] text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {saving ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSave} />}
            <span>Save Profile Modifications</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
