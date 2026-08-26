import React, { useEffect, useState } from "react";
import PageLayout from "../../../../components/PageLayout";
import { DataTable, Column } from "../../../../components/DataTable";
import CommonButton from "../../../../components/CommonButton";
import InputBox from "../../../../components/InputBox";
import SearchBar from "../../../../components/SearchBar";
import { showToast, ActionModal, AlertContainer } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTimes, faCar } from "@fortawesome/free-solid-svg-icons";

interface Vehicle {
  id: string;
  vehicle_type: string;
  vehicle_number: string;
  seating_capacity: number;
  price_per_km: number;
  image?: string;
  status: string;
}

const ListVehicleMaster: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchText, setSearchText] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState("");
  const [editNumber, setEditNumber] = useState("");
  const [editCapacity, setEditCapacity] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editStatus, setEditStatus] = useState("active");

  // Modal
  const [modalType, setModalType] = useState<"confirm-delete" | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get<{ data: Vehicle[] }>("/vehicles");
      setVehicles(res.data?.data || []);
      setFilteredVehicles(res.data?.data || []);
    } catch (err) {
      showToast("Failed to load vehicles data.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const term = searchText.trim().toLowerCase();
    if (term === "") {
      setFilteredVehicles(vehicles);
    } else {
      setFilteredVehicles(
        vehicles.filter(
          (v) =>
            v.vehicle_number.toLowerCase().includes(term) ||
            v.vehicle_type.toLowerCase().includes(term) ||
            v.status.toLowerCase().includes(term)
        )
      );
    }
  }, [searchText, vehicles]);

  // Edit Handlers
  const openEdit = (v: Vehicle) => {
    setEditId(v.id);
    setEditType(v.vehicle_type);
    setEditNumber(v.vehicle_number);
    setEditCapacity(v.seating_capacity.toString());
    setEditPrice(v.price_per_km.toString());
    setEditStatus(v.status);
  };

  const closeEdit = () => {
    setEditId(null);
    setEditType("");
    setEditNumber("");
    setEditCapacity("");
    setEditPrice("");
    setEditStatus("active");
  };

  const saveEdit = async () => {
    if (!editId) return;
    try {
      setLoading(true);
      const payload = {
        vehicle_type: editType,
        vehicle_number: editNumber,
        seating_capacity: parseInt(editCapacity, 10),
        price_per_km: parseFloat(editPrice),
        status: editStatus,
      };

      await axiosInstance.put(`/vehicles/${editId}`, payload);
      showToast("Vehicle updated successfully!", "success");
      await fetchData();
      closeEdit();
    } catch (err: any) {
      showToast(err?.response?.data?.message || "Failed to update vehicle.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (row: Vehicle) => {
    setSelectedVehicle(row);
    setModalType("confirm-delete");
  };

  const confirmDeleteAction = async () => {
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      await axiosInstance.delete(`/vehicles/${selectedVehicle.id}`);
      showToast("Vehicle deleted successfully!", "success");
      await fetchData();
      setModalType(null);
    } catch (err) {
      showToast("Failed to delete vehicle.", "error");
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<Vehicle>[] = [
    {
      header: "Image",
      accessor: "id",
      render: (row: Vehicle) => (
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 border border-gray-200">
          <FontAwesomeIcon icon={faCar} className="text-xl" />
        </div>
      ),
    },
    { header: "Vehicle Type", accessor: "vehicle_type" },
    { header: "Vehicle Number", accessor: "vehicle_number" },
    { header: "Seats", accessor: "seating_capacity" },
    { header: "Price/KM (₹)", accessor: "price_per_km" },
    { header: "Status", accessor: "status" },
  ];

  return (
    <PageLayout>
      <AlertContainer />
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">All Vehicles</h1>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 space-y-4 sm:space-y-0 sm:space-x-4">
          <SearchBar
            placeholder="Search Vehicles..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onSearch={() => setSearchText(searchInput)}
          />
          <CommonButton
            variant="success"
            className="w-full sm:w-auto"
            onClick={() => navigate("/fleet/vehicles/add")}
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Add Vehicle</span>
          </CommonButton>
        </div>

        <DataTable
          key={searchText + vehicles.length}
          columns={columns}
          data={filteredVehicles}
          onEdit={openEdit}
          onDelete={handleDelete}
          loading={loading}
          rowsPerPage={8}
          emptyMessage="No vehicles found."
        />

        {editId && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 w-full max-w-md relative shadow-2xl animate-fade-in">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                onClick={closeEdit}
              >
                <FontAwesomeIcon icon={faTimes} className="text-xl" />
              </button>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Edit Vehicle</h2>

              <InputBox
                name="editType"
                label="Vehicle Type *"
                required
                placeholder="e.g. Sedan, SUV"
                value={editType}
                onChange={(name, value) => setEditType(value)}
              />

              <InputBox
                name="editNumber"
                label="Vehicle Plate Number"
                required
                placeholder="Enter plate number"
                value={editNumber}
                onChange={(name, value) => setEditNumber(value)}
              />

              <InputBox
                name="editCapacity"
                label="Seating Capacity"
                type="number"
                required
                placeholder="Enter capacity"
                value={editCapacity}
                onChange={(name, value) => setEditCapacity(value)}
              />

              <InputBox
                name="editPrice"
                label="Price Per KM (₹)"
                type="number"
                required
                placeholder="Enter price"
                value={editPrice}
                onChange={(name, value) => setEditPrice(value)}
              />

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <CommonButton onClick={closeEdit} variant="secondary">
                  Cancel
                </CommonButton>
                <CommonButton onClick={saveEdit} variant="primary" disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </CommonButton>
              </div>
            </div>
          </div>
        )}

        <ActionModal
          isOpen={modalType !== null}
          type={modalType as any}
          onClose={() => setModalType(null)}
          onConfirm={confirmDeleteAction}
          itemName={selectedVehicle?.vehicle_number}
        />
      </div>
    </PageLayout>
  );
};

export default ListVehicleMaster;
