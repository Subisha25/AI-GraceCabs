import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPercent, faSave, faArrowLeft, faSpinner } from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../components/AlertBox';
import PageLayout from '../../components/PageLayout';

const AddTax: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tax_name: '',
    tax_type: '',
    percentage: '',
    status: 'active'
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tax_name || !form.tax_type || !form.percentage) {
      showToast('Please fill all required fields.', 'warn');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosInstance.post('/taxes', {
        tax_name: form.tax_name,
        tax_type: form.tax_type,
        percentage: parseFloat(form.percentage),
        status: form.status
      });

      if (res.data && res.data.success) {
        showToast('Tax rate created successfully!', 'success');
        setTimeout(() => {
          navigate('/taxes');
        }, 1500);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to create tax record.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="p-4 max-w-2xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <button
            onClick={() => navigate('/taxes')}
            className="flex items-center gap-2 text-gray-600 hover:text-[#1B4F8A] font-bold transition-all text-sm"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Back to Taxes</span>
          </button>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">New Configuration</span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-50 pb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-[#1B4F8A]">
              <FontAwesomeIcon icon={faPercent} className="text-lg" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 font-black">Configure Tax Rate</h1>
              <p className="text-xs text-gray-400">Configure locked tax percentages for regional operations.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tax Name</label>
                <input
                  type="text"
                  name="tax_name"
                  value={form.tax_name}
                  onChange={handleChange}
                  placeholder="e.g. GST South Division, CGST Master"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tax Type</label>
                <input
                  type="text"
                  name="tax_type"
                  value={form.tax_type}
                  onChange={handleChange}
                  placeholder="e.g. CGST, SGST, IGST, GST"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white uppercase"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Percentage (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  name="percentage"
                  value={form.percentage}
                  onChange={handleChange}
                  placeholder="e.g. 2.50, 18.00"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="active">ACTIVE</option>
                  <option value="inactive">INACTIVE</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-50 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => navigate('/taxes')}
                className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 transition-all text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-[#1B4F8A] hover:bg-blue-800 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-xs shadow-md shadow-blue-900/10"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faSave} />
                    <span>Create Tax Rate</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </PageLayout>
  );
};

export default AddTax;
