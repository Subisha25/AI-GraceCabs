import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../components/PageLayout";
import axiosInstance from "../../../utils/axiosInstance";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar"; 
import { showToast, AlertContainer } from "../../../components/AlertBox";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCar, faRoute, faCalendarAlt, faClock, faPlay, faStopCircle, faEye } from "@fortawesome/free-solid-svg-icons";

interface AssignedDriver {
  bookingId: string;
  bookingCode: string;
  customerName: string;
  customerMobile: string;
  pickupLocation: string;
  dropLocation: string;
  bookingDate: string;
  bookingTime: string;
  vehicleType: string;
  vehicleNumber: string;
  status: string;
}

interface BookingApiResponse {
  id: string;
  booking_code: string;
  booking_date: string;
  booking_time: string;
  pickup_location: string;
  drop_location: string;
  status: string;
  customer_name?: string;
  customer_mobile?: string;
  customer?: { name: string; mobile: string };
  vehicle?: { vehicle_type: string; vehicle_number: string };
}

const AssignedList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<AssignedDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filteredData, setFilteredData] = useState<AssignedDriver[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get<{ data: BookingApiResponse[] }>(
          "/driver/trips"
        );

        const bookings = res.data.data || [];
        const formatted: AssignedDriver[] = bookings.map((b: BookingApiResponse) => ({
          bookingId: b.id,
          bookingCode: b.booking_code,
          customerName: b.customer?.name || b.customer_name || "Customer",
          customerMobile: b.customer?.mobile || b.customer_mobile || "—",
          pickupLocation: b.pickup_location || "—",
          dropLocation: b.drop_location || "—",
          bookingDate: b.booking_date || "—",
          bookingTime: b.booking_time || "—",
          vehicleType: b.vehicle?.vehicle_type || "Standard",
          vehicleNumber: b.vehicle?.vehicle_number || "—",
          status: b.status || "confirmed",
        }));

        setData(formatted);
        setFilteredData(formatted);
      } catch (err) {
        showToast('Failed to fetch assigned trips', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleSearch = () => {
    const term = search.trim().toLowerCase();
    if (!term) {
      setFilteredData(data);
      return;
    }
    const result = data.filter(
      (d) =>
        d.bookingCode.toLowerCase().includes(term) ||
        d.customerName.toLowerCase().includes(term) ||
        d.pickupLocation.toLowerCase().includes(term) ||
        d.dropLocation.toLowerCase().includes(term) ||
        d.vehicleNumber.toLowerCase().includes(term) ||
        d.status.toLowerCase().includes(term)
    );
    setFilteredData(result);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'started':
        return 'bg-blue-100 text-blue-800 border border-blue-200 animate-pulse';
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 border border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  const columns: Column<AssignedDriver>[] = [
    {
      header: "Booking Code",
      accessor: "bookingCode",
      render: (row) => (
        <span 
          onClick={() => navigate(`/drivers/trip-details/${row.bookingId}`)}
          className="text-blue-600 hover:underline cursor-pointer font-extrabold tracking-wide"
        >
          {row.bookingCode}
        </span>
      ),
    },
    {
      header: "Customer",
      accessor: "customerName",
      render: (row) => (
        <div>
          <p className="font-bold text-gray-800 text-sm">{row.customerName}</p>
          <p className="text-xs text-gray-400 font-mono">{row.customerMobile}</p>
        </div>
      ),
    },
    {
      header: "Route",
      accessor: "pickupLocation",
      render: (row) => (
        <div className="max-w-xs text-xs space-y-0.5">
          <p className="text-gray-700 truncate font-semibold">📍 {row.pickupLocation}</p>
          <p className="text-gray-500 truncate">🏁 {row.dropLocation}</p>
        </div>
      ),
    },
    {
      header: "Schedule",
      accessor: "bookingDate",
      render: (row) => (
        <div className="text-xs text-gray-700 font-medium">
          <p>{row.bookingDate}</p>
          <p className="text-gray-400">{row.bookingTime}</p>
        </div>
      ),
    },
    {
      header: "Vehicle",
      accessor: "vehicleNumber",
      render: (row) => (
        <div>
          <p className="text-xs font-bold text-gray-800">{row.vehicleType}</p>
          <p className="text-xs font-mono font-bold text-blue-600">{row.vehicleNumber}</p>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${getStatusBadge(row.status)}`}>
          {row.status}
        </span>
      ),
    },
    {
      header: "Action",
      accessor: "bookingId",
      render: (row) => (
        <button
          onClick={() => navigate(`/drivers/trip-details/${row.bookingId}`)}
          className="px-3.5 py-1.5 bg-[#275981] hover:bg-[#1c4362] text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition"
        >
          <FontAwesomeIcon icon={row.status === 'confirmed' ? faPlay : row.status === 'started' ? faStopCircle : faEye} />
          <span>{row.status === 'confirmed' ? 'Start' : row.status === 'started' ? 'Complete' : 'View'}</span>
        </button>
      ),
    },
  ];

  return (
    <PageLayout>
      <AlertContainer />
      <div className="py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Assigned Trips</h1>
            <p className="text-sm text-gray-500 mt-1">View your assigned rides and manage trip lifecycle</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <SearchBar
            placeholder="Search by Code, Customer, Route, or Plate..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={handleSearch}
          />
        </div>

        {/* DataTable */}
        <DataTable
          key={search + filteredData.length}
          columns={columns}
          data={filteredData}
          loading={loading}
          rowsPerPage={10}
          emptyMessage="No assigned trips found for your profile."
        />
      </div>
    </PageLayout>
  );
};

export default AssignedList;