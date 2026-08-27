import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPercent,
  faPlus,
  faSearch,
  faTrash,
  faToggleOn,
  faToggleOff,
  faEdit,
  faCheckCircle,
  faBan,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import axiosInstance from '../../utils/axiosInstance';
import { showToast, AlertContainer } from '../../components/AlertBox';
import PageLayout from '../../components/PageLayout';

interface Tax {
  id: string;
  tax_name: string;
  tax_type: string;
  percentage: number;
  status: string;
}

const TaxList: React.FC = () => {
  const navigate = useNavigate();
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [filtered, setFiltered] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Edit Modal State
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState('');
  const [editPercent, setEditPercent] = useState(0);
  const [submittingEdit, setSubmittingEdit] = useState(false);

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/taxes');
      if (res.data && res.data.success) {
        setTaxes(res.data.data || []);
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to fetch taxes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  useEffect(() => {
    let list = [...taxes];

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      list = list.filter(
        t =>
          t.tax_name.toLowerCase().includes(q) ||
          t.tax_type.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== 'all') {
      list = list.filter(t => t.status.toLowerCase() === statusFilter.toLowerCase());
    }

    setFiltered(list);
  }, [search, statusFilter, taxes]);

  const handleStatusToggle = async (tax: Tax) => {
    const nextStatus = tax.status.toLowerCase() === 'active' ? 'inactive' : 'active';
    try {
      const res = await axiosInstance.put(`/taxes/${tax.id}`, {
        tax_name: tax.tax_name,
        tax_type: tax.tax_type,
        percentage: tax.percentage,
        status: nextStatus
      });
      if (res.data && res.data.success) {
        showToast(`Tax status updated to ${nextStatus.toUpperCase()}`, 'success');
        fetchTaxes();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to toggle status.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tax record?')) return;
    try {
      const res = await axiosInstance.delete(`/taxes/${id}`);
      if (res.data && res.data.success) {
        showToast('Tax record deleted successfully.', 'success');
        fetchTaxes();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to delete tax record.', 'error');
    }
  };

  const startEdit = (tax: Tax) => {
    setEditingTax(tax);
    setEditName(tax.tax_name);
    setEditType(tax.tax_type);
    setEditPercent(tax.percentage);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTax) return;

    try {
      setSubmittingEdit(true);
      const res = await axiosInstance.put(`/taxes/${editingTax.id}`, {
        tax_name: editName,
        tax_type: editType,
        percentage: editPercent,
        status: editingTax.status
      });

      if (res.data && res.data.success) {
        showToast('Tax record updated successfully!', 'success');
        setEditingTax(null);
        fetchTaxes();
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update tax record.', 'error');
    } finally {
      setSubmittingEdit(false);
    }
  };

  return (
    <PageLayout>
      <AlertContainer />
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#1B4F8A]">
              <FontAwesomeIcon icon={faPercent} className="text-xl" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Tax Management</h1>
              <p className="text-sm text-gray-500">Configure regional and contract tax rates authoritative calculations.</p>
            </div>
          </div>
          <Link
            to="/taxes/add"
            className="w-full sm:w-auto px-5 py-2.5 bg-[#1B4F8A] hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-900/10"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Tax</span>
          </Link>
        </div>

        {/* Filters Panel */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <FontAwesomeIcon icon={faSearch} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search taxes by name or type..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto items-center">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">Filter Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none"
            >
              <option value="all">All Taxes</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>

        {/* Taxes List Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center py-16 text-gray-400">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl mr-2" />
              <span className="font-semibold">Loading taxes data...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400 font-semibold">
              No tax records found. Create one to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                    <th className="px-6 py-4 text-left">Tax Name</th>
                    <th className="px-6 py-4 text-left">Tax Type</th>
                    <th className="px-6 py-4 text-left">Percentage</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-bold text-gray-800">{t.tax_name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100 uppercase">
                          {t.tax_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-gray-700">{t.percentage}%</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          t.status.toLowerCase() === 'active'
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                          {t.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleStatusToggle(t)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title={t.status.toLowerCase() === 'active' ? 'Deactivate' : 'Activate'}
                          >
                            <FontAwesomeIcon
                              icon={t.status.toLowerCase() === 'active' ? faBan : faCheckCircle}
                              className={t.status.toLowerCase() === 'active' ? 'text-rose-500' : 'text-emerald-500'}
                            />
                          </button>
                          <button
                            onClick={() => startEdit(t)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inline Edit Modal */}
        {editingTax && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md space-y-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faEdit} className="text-blue-600" />
                Edit Tax Details
              </h2>
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tax Name</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tax Type</label>
                  <input
                    type="text"
                    required
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    placeholder="e.g. CGST, SGST, GST"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={editPercent}
                    onChange={(e) => setEditPercent(parseFloat(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingTax(null)}
                    className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEdit}
                    className="px-4 py-2 bg-[#1B4F8A] hover:bg-blue-800 text-white rounded-xl text-xs font-bold"
                  >
                    {submittingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PageLayout>
  );
};

export default TaxList;
