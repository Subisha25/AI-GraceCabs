import React, { useEffect, useState } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartBar, faFileInvoice, faClipboardList, faUsers,
  faCar, faSpinner, faTruck, faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';

interface SummaryCard {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  sub?: string;
}

const Reports: React.FC = () => {
  const [summary, setSummary] = useState<SummaryCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      // Parallel requests to gather summary data from Laravel backend
      const [orderRes, invoiceRes] = await Promise.allSettled([
        axiosInstance.get('/bookings'),
        axiosInstance.get('/invoices'),
      ]);

      const orders = orderRes.status === 'fulfilled'
        ? (orderRes.value.data?.data || [])
        : [];
      const invoices = invoiceRes.status === 'fulfilled'
        ? (invoiceRes.value.data?.data || [])
        : [];

      const totalRevenue = invoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

      const pendingRevenue = invoices
        .filter((inv: any) => inv.status !== 'paid')
        .reduce((sum: number, inv: any) => sum + Number(inv.total_amount || 0), 0);

      setSummary([
        {
          label: 'Total Bookings',
          value: orders.length,
          icon: faClipboardList,
          color: 'bg-blue-500',
          sub: `${orders.filter((o: any) => o.status === 'completed').length} completed`,
        },
        {
          label: 'Total Invoices',
          value: invoices.length,
          icon: faFileInvoice,
          color: 'bg-purple-500',
          sub: `${invoices.filter((i: any) => i.status !== 'paid').length} pending`,
        },
        {
          label: 'Revenue Collected',
          value: `₹${totalRevenue.toLocaleString('en-IN')}`,
          icon: faMoneyBillWave,
          color: 'bg-green-500',
          sub: 'Paid invoices',
        },
        {
          label: 'Outstanding',
          value: `₹${pendingRevenue.toLocaleString('en-IN')}`,
          icon: faChartBar,
          color: 'bg-orange-500',
          sub: 'Unpaid invoices',
        },
      ]);
    } catch {
      setSummary([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide analytics and performance summary</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500">To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
          </div>
          <button onClick={fetchSummary}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <FontAwesomeIcon icon={faSpinner} spin className="text-2xl mr-3" />Loading reports...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {summary.map((card, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <div className={`${card.color} w-10 h-10 rounded-xl flex items-center justify-center`}>
                    <FontAwesomeIcon icon={card.icon} className="text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                {card.sub && <p className="text-xs text-gray-400 mt-1">{card.sub}</p>}
              </div>
            ))}
          </div>

          {/* Quick Links to Detailed Reports */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { title: 'Order Summary', desc: 'All bookings with status breakdown', path: '/reports/order-summary', icon: faClipboardList, color: 'blue' },
              { title: 'Invoice Report', desc: 'Pending, paid and overdue invoices', path: '/reports/overall-invoice-report', icon: faFileInvoice, color: 'purple' },
              { title: 'Company Report', desc: 'Bookings grouped by organization', path: '/reports/company-order-summary', icon: faUsers, color: 'indigo' },
              { title: 'Monthly Bookings', desc: 'Monthly recurring booking report', path: '/booking/monthlyreport', icon: faChartBar, color: 'green' },
              { title: 'Vehicle Usage', desc: 'Fleet utilization and activity', path: '/fleet/vehicles', icon: faCar, color: 'orange' },
              { title: 'Driver Trips', desc: 'Trip assignments and completions', path: '/fleet/drivers', icon: faTruck, color: 'cyan' },
            ].map((item, i) => (
              <a key={i} href={item.path}
                className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md hover:border-${item.color}-200 transition group`}>
                <div className={`bg-${item.color}-50 group-hover:bg-${item.color}-100 w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition`}>
                  <FontAwesomeIcon icon={item.icon} className={`text-${item.color}-600`} />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-blue-700 transition">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
