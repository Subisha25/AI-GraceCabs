import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../components/PageLayout";
import axiosInstance from "../../../utils/axiosInstance";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar"; 
import { showToast } from "../../../components/AlertBox";

interface AssignedDriver {
  bookingId: string;
  name: string;
  orderNumber: string;
  orderDate: string;
  pickupDate: string;
  pickupPoint: string;
}

interface BookingApiResponse {
  id: string;
  booking_code: string;
  booking_date: string;
  created_at: string;
  pickup_location: string;
  driver?: { name: string };
}

const AssignedList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<AssignedDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // State to hold the data after filtering for the search button
  const [filteredData, setFilteredData] = useState<AssignedDriver[]>([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await axiosInstance.get<{ data: BookingApiResponse[] }>(
          "/driver/trips"
        );

        const bookings = res.data.data || [];
        const formatted: AssignedDriver[] = bookings.map((b: BookingApiResponse) => ({
          bookingId: b.id,
          name: b.driver?.name || "N/A",
          orderNumber: b.booking_code,
          orderDate: new Date(b.created_at).toLocaleString(),
          pickupDate: new Date(b.booking_date).toLocaleDateString(),
          pickupPoint: b.pickup_location || "-",
        }));

        setData(formatted);
        // Initially set filteredData to all data
        setFilteredData(formatted);
      } catch (err) {
        showToast('Failed to fetch bookings', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleSearch = () => {
    const result = data.filter(
      (d) =>
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.orderNumber.includes(search)
    );
    setFilteredData(result);
  };

  const columns: Column<AssignedDriver>[] = [
    {
      header: "Driver Name",
      accessor: "name",
      render: (row) => (
        <>
          <span className="text-gray-700">{row.name}</span>
        </>
      ),
    },
    {
      header: "Order Number",
      accessor: "orderNumber",
      render: (row) => (
        <span 
          onClick={() => navigate(`/drivers/trip-details/${row.bookingId}`)}
          className="text-blue-600 hover:underline cursor-pointer font-semibold"
        >
          {row.orderNumber}
        </span>
      ),
    },
    {
      header: "Order Date",
      accessor: "orderDate",
    },
    {
      header: "Pick-up Date",
      accessor: "pickupDate",
    },
    {
      header: "Pick-up Point",
      accessor: "pickupPoint",
    },
  ];

  return (
    <PageLayout>
      <div className="py-6">
        {/* Header */}
        
         <h2 className="text-3xl font-bold text-gray-800 mb-4">
            List Assigned Driver
          </h2>
         
        

        {/* Search */}
        <div className="mb-4">
          <SearchBar
            placeholder="Keywords (Driver Name, Order Number)"
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
          // emptyMessage="No assigned drivers found."
        />
      </div>
    </PageLayout>
  );
};

export default AssignedList;