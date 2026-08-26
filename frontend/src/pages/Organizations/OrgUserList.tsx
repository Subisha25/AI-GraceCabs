import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faEye, faSpinner, faUser, faBuilding, faUserTie, faFilter } from '@fortawesome/free-solid-svg-icons';

interface OrgUser {
  userId: string;
  username: string;
  email: string;
  mobile: string;
  companyId?: string;
  companyName?: string;
  companyManager?: boolean;
  status?: string;
  createdAt?: string;
}

interface Company {
  companyId: string;
  companyName: string;
}

const OrgUserList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const filterCompanyId = queryParams.get('companyId') || '';

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [filtered, setFiltered] = useState<OrgUser[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState(filterCompanyId);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    axiosInstance.get('/company/getAllCompany').then((res) => {
      const data: Company[] = Array.isArray(res.data)
        ? res.data
        : res.data?.companies || [];
      setCompanies(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCompany
      ? `/user/getAllUserByCompany/${selectedCompany}`
      : '/user/getAllUsers';
    axiosInstance
      .get(url)
      .then((res) => {
        const data: OrgUser[] = Array.isArray(res.data)
          ? res.data
          : res.data?.users || [];
        // Keep only org users (those with a companyId)
        const orgUsers = data.filter((u) => u.companyId);
        setUsers(orgUsers);
        setFiltered(orgUsers);
      })
      .catch((err) => {
        showToast('error', err?.response?.data?.message || 'Failed to load users');
      })
      .finally(() => setLoading(false));
  }, [selectedCompany]);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(users); return; }
    setFiltered(
      users.filter((u) =>
        [u.username, u.email, u.mobile, u.companyName].some((f) => (f || '').toLowerCase().includes(q))
      )
    );
  }, [search, users]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Organization Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">Passengers registered under organizations</p>
        </div>
        <button
          onClick={() => navigate('/organizations/users/add')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow transition"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Org User
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
        </div>
        <div className="relative min-w-[200px]">
          <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <select value={selectedCompany} onChange={(e) => setSelectedCompany(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white appearance-none">
            <option value="">All Organizations</option>
            {companies.map((c) => (
              <option key={c.companyId} value={c.companyId}>{c.companyName}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3" />Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="font-medium">No org users found</p>
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Organization</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((u, i) => (
                  <tr key={u.userId} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <FontAwesomeIcon icon={u.companyManager ? faUserTie : faUser} className="text-indigo-600 text-xs" />
                        </div>
                        <span className="font-medium text-gray-800">{u.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600">{u.mobile || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <div className="flex items-center gap-1.5">
                        <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-xs" />
                        {u.companyName || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${u.companyManager ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                        {u.companyManager ? 'Manager' : 'Passenger'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => navigate(`/users/userdetails/${u.userId}`)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition">
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
      <p className="text-xs text-gray-400 mt-3 text-right">{filtered.length} user{filtered.length !== 1 ? 's' : ''}</p>
    </div>
  );
};

export default OrgUserList;
