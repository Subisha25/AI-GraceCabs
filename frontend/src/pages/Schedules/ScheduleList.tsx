import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosInstance';
import { showToast } from '../../components/AlertBox';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSearch, faCalendarAlt, faSpinner, faBuilding, faClock, faToggleOn, faToggleOff, faEye } from '@fortawesome/free-solid-svg-icons';

interface Schedule {
  scheduleId: string;
  scheduleName?: string;
  organizationId?: string;
  organizationName?: string;
  pickupLocation?: string;
  dropLocation?: string;
  days?: string;
  pickupTime?: string;
  startDate?: string;
  endDate?: string;
  vehicleTypeName?: string;
  passengerCount?: number;
  status?: string;
}

const ScheduleList: React.FC = () => {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [filtered, setFiltered] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    axiosInstance
      .get('/schedules')
      .then((res) => {
        const data: Schedule[] = Array.isArray(res.data) ? res.data : res.data?.schedules || [];
        setSchedules(data);
        setFiltered(data);
      })
      .catch((err) => {
        showToast('error', err?.response?.data?.message || 'Failed to load schedules');
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    if (!q) { setFiltered(schedules); return; }
    setFiltered(schedules.filter((s) =>
      [s.scheduleName, s.organizationName, s.pickupLocation, s.dropLocation].some((f) => (f || '').toLowerCase().includes(q))
    ));
  }, [search, schedules]);

  const DAYS_LABELS: Record<string, string> = {
    mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Schedules</h1>
          <p className="text-sm text-gray-500 mt-0.5">Recurring transport schedules for organizations</p>
        </div>
        <button onClick={() => navigate('/schedules/add')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow transition">
          <FontAwesomeIcon icon={faPlus} />
          Add Schedule
        </button>
      </div>

      <div className="relative mb-5 max-w-sm">
        <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schedules..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3" />Loading schedules...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <FontAwesomeIcon icon={faCalendarAlt} className="text-4xl mb-3" />
            <p className="font-medium">No schedules yet</p>
            <p className="text-sm mt-1">Create recurring transport schedules for organizations</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['#', 'Schedule', 'Organization', 'Route', 'Days', 'Time', 'Pax', 'Status', 'Action'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s, i) => {
                  const dayList = s.days?.split(',').map((d) => d.trim()).filter(Boolean) || [];
                  return (
                    <tr key={s.scheduleId} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{s.scheduleName || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faBuilding} className="text-gray-400 text-xs" />
                          {s.organizationName || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px]">
                        <p className="truncate text-xs">{s.pickupLocation || '—'}</p>
                        <p className="truncate text-xs text-gray-400">→ {s.dropLocation || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 flex-wrap">
                          {dayList.map((d) => (
                            <span key={d} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-semibold">
                              {DAYS_LABELS[d.toLowerCase()] || d}
                            </span>
                          ))}
                          {dayList.length === 0 && <span className="text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex items-center gap-1">
                          <FontAwesomeIcon icon={faClock} className="text-gray-400 text-xs" />
                          {s.pickupTime || '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{s.passengerCount ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <FontAwesomeIcon icon={s.status === 'active' ? faToggleOn : faToggleOff}
                            className={s.status === 'active' ? 'text-green-500' : 'text-gray-400'} />
                          <span className={`text-xs font-medium ${s.status === 'active' ? 'text-green-700' : 'text-gray-500'}`}>
                            {s.status || 'active'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1.5 rounded transition">
                          <FontAwesomeIcon icon={faEye} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScheduleList;
