import React, { useEffect, useState } from "react";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import axiosInstance from "../../../utils/axiosInstance";
import { showToast, AlertContainer } from "../../../components/AlertBox";

interface TripData {
  bookingId: string;
  bookingCode: string;
  bookingDate: string;
  pickupPoint: string;
  dropPoint: string;
  status: string;
  vehicleName: string;
  amount: number | string;
}

const TripDetails: React.FC = () => {
  const [tableData, setTableData] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  const formatDate = (date: string) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString();
  };

  useEffect(() => {
    const fetchAllTrips = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get("/driver/trips");
        const bookings = res.data?.data || [];
        
        // Filter for completed or paid trips
        const completedBookings = bookings.filter((b: any) => 
          ['completed', 'paid', 'payment_pending'].includes(b.status)
        );

        const formatted = completedBookings.map((b: any) => ({
          bookingId: b.id,
          bookingCode: b.booking_code,
          bookingDate: b.booking_date,
          pickupPoint: b.pickup_location || "-",
          dropPoint: b.drop_location || "-",
          status: b.status,
          vehicleName: b.vehicle?.vehicle_name || "-",
          amount: b.final_fare || b.estimated_fare || 0,
        }));

        setTableData(formatted);
      } catch (err) {
        console.error("Trip history load error", err);
        showToast("Failed to load trip history", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAllTrips();
  }, []);

  const columns: Column<TripData>[] = [
    { header: "Booking Code", accessor: "bookingCode" },
    {
      header: "Trip Date",
      accessor: "bookingDate",
      render: (row) => formatDate(row.bookingDate),
    },
    { header: "Pickup Location", accessor: "pickupPoint" },
    { header: "Drop Location", accessor: "dropPoint" },
    { header: "Vehicle", accessor: "vehicleName" },
    {
      header: "Fare Amount",
      accessor: "amount",
      render: (row) => `₹${Number(row.amount).toLocaleString('en-IN')}`,
    },
    {
      header: "Status",
      accessor: "status",
      render: (row) => (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold uppercase ${
          row.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <PageLayout>
      <AlertContainer />

      <div className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">Trip History</h1>
        <p className="text-sm text-gray-500 mt-1">Review your completed trip assignments and earnings history</p>
      </div>

      {/* Table */}
      <div className="mt-6">
        <DataTable
          columns={columns}
          data={tableData}
          loading={loading}
          rowsPerPage={10}
          emptyMessage="No completed trips found in your history."
        />
      </div>
    </PageLayout>
  );
};

export default TripDetails;