import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faSearch, faHandshake, faSpinner, faBuilding, 
  faToggleOn, faToggleOff, faEdit, faCalendarAlt, faEye
} from '@fortawesome/free-solid-svg-icons';

interface Contract {
  id: string;
  contractName: string;
  organizationId: string;
  organizationName: string;
  pricingModel: string;
  vehicleType: string;
  workingDays: number;
  serviceDays: string;
  contractFrom: string;
  contractTo: string;
  status: string;
}

const ContractList: React.FC = () => {
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filtered, setFiltered] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchContracts = () => {
    setLoading(true);
    axiosInstance
      .get('/contracts')
      .then((res) => {
        const raw = res.data?.data || [];
        const formatted: Contract[] = raw.map((c: any) => ({
          id: c.id,
          contractName: c.contract_name || '—',
          organizationId: c.organization_id,
          organizationName: c.organization?.name || '—',
          pricingModel: c.pricing_model || 'PER_KM',
          vehicleType: c.vehicle?.vehicle_type || c.vehicle?.vehicle_name || '—',
          workingDays: c.actual_service_days || 0,
          serviceDays: c.service_days || '—',
          contractFrom: c.start_date,
          contractTo: c.end_date,
          status: c.status || 'draft',
        }));
        setContracts(formatted);
        setFiltered(formatted);
      })
      .catch((err) => {
        showToast('Failed to load contracts', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  useEffect(() => {
    let list = [...contracts];

    // Status Filter
    if (statusFilter !== 'all') {
      list = list.filter((c) => c.status.toLowerCase() === statusFilter.toLowerCase());
    }

    // Text Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.contractName.toLowerCase().includes(q) ||
        c.organizationName.toLowerCase().includes(q) ||
        c.vehicleType.toLowerCase().includes(q)
      );
    }

    setFiltered(list);
  }, [search, statusFilter, contracts]);

  const handleStatusToggle = async (c: Contract) => {
    const nextStatus = c.status.toLowerCase() === 'active' ? 'draft' : 'active';
    const confirmMsg = `Are you sure you want to change the contract status to ${nextStatus.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await axiosInstance.put(`/contracts/${c.id}`, {
        organization_id: c.organizationId,
        contract_name: c.contractName,
        pricing_model: c.pricingModel,
        start_date: c.contractFrom,
        end_date: c.contractTo,
        working_days: c.workingDays,
        pickup_location: 'Default Pickup', // validation fallback
        drop_location: 'Default Drop',
        rate_per_km: 0,
        status: nextStatus
      });
      showToast('Contract status updated successfully', 'success');
      fetchContracts();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to update contract status', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Organization Contracts</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage recurring corporate transport agreements</p>
        </div>
        
        <button 
          onClick={() => navigate('/contracts/add')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow transition"
        >
          <FontAwesomeIcon icon={faPlus} /> Add Contract
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-4 items-center mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input 
            type="text" 
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by contract or organization..." 
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500" 
          />
        </div>

        <div className="w-40">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Contract Listing */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3 text-blue-500" />Loading contracts...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faHandshake} className="text-4xl mb-3 text-gray-300" />
            <p className="font-semibold text-gray-700 mb-1">No contracts found</p>
            <p className="text-sm">Create a new contract or adjust filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase">
                  <th className="px-6 py-4 text-left">Contract / Client</th>
                  <th className="px-6 py-4 text-left">Pricing Model</th>
                  <th className="px-6 py-4 text-left">Period</th>
                  <th className="px-6 py-4 text-left">Days</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-base" />
                        <div>
                          <span className="font-bold text-gray-800 block text-sm">{c.contractName}</span>
                          <span className="text-xs text-gray-500 font-medium block mt-0.5">{c.organizationName}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-100">
                        {c.pricingModel === 'PER_KM' ? 'Per KM' : 'Fixed Monthly'}
                      </span>
                      <span className="text-xs text-gray-400 block mt-1">{c.vehicleType}</span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs">
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1 font-semibold">
                          <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
                          {new Date(c.contractFrom).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} to {new Date(c.contractTo).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-gray-400 block ml-5">Days: {c.serviceDays}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <span className="font-bold text-gray-800">{c.workingDays} days</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleStatusToggle(c)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title={c.status.toLowerCase() === 'active' ? 'Deactivate' : 'Activate'}
                        >
                          <FontAwesomeIcon icon={c.status.toLowerCase() === 'active' ? faToggleOn : faToggleOff} className={c.status.toLowerCase() === 'active' ? 'text-green-600' : 'text-gray-400'} />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/contracts/${c.id}`)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                          title="View Details"
                        >
                          <FontAwesomeIcon icon={faEye} />
                        </button>

                        <button
                          onClick={() => navigate(`/contracts/edit/${c.id}`)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit Contract"
                        >
                          <FontAwesomeIcon icon={faEdit} />
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
    </div>
  );
};

export default ContractList;
