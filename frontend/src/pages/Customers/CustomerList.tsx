import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEye, faSpinner, faUser, faPhone, faEnvelope } from '@fortawesome/free-solid-svg-icons';

interface Customer {
  userId: string;
  username: string;
  email: string;
  mobile: string;
  status?: string;
  createdAt?: string;
  companyId?: string | null;
  companyName?: string;
  totalBookings?: number;
  lastBookingDate?: string | null;
}

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filtered, setFiltered] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get('/user/customers')
      .then((res) => {
        const data: Customer[] = Array.isArray(res.data)
          ? res.data
          : res.data?.users || res.data?.customers || [];
        setCustomers(data);
        setFiltered(data);
      })
      .catch((err) => {
        showToast(err?.response?.data?.message || 'Failed to load customers', 'error');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(customers); return; }
    setFiltered(
      customers.filter((c) =>
        [c.username, c.email, c.mobile].some((f) => (f || '').toLowerCase().includes(q))
      )
    );
  }, [search, customers]);

  return (
    <div className="min-h-screen bg-gray-55 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Individual customers registered on the platform</p>
        </div>
        <button
          onClick={() => navigate('/customers/add')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow transition"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Customer
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3" />
            Loading customers...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-medium">No customers found</p>
            <p className="text-sm mt-1">Add your first customer to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Registered</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Bookings</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Last Booking</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((c, i) => (
                  <tr key={c.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <FontAwesomeIcon icon={faUser} className="text-blue-600 text-xs" />
                        </div>
                        <span className="font-medium text-gray-800">{c.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 text-xs" />
                        {c.email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faPhone} className="text-gray-400 text-xs" />
                        {c.mobile || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        c.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'
                      }`}>
                        {c.status || 'active'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">{c.totalBookings ?? 0}</td>
                    <td className="px-4 py-3 text-gray-500">{c.lastBookingDate || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => navigate(`/customers/${c.userId}`)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition"
                        title="View Details"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default CustomerList;
