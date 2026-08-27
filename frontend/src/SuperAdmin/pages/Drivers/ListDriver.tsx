import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PageLayout from "../../../components/PageLayout";
import { DataTable, Column } from "../../../components/DataTable";
import SearchBar from "../../../components/SearchBar";
import TrashToggleButton from "../../../components/TrashToggleButton";
import { showToast, ActionModal, AlertContainer } from "../../../components/AlertBox";
import axiosInstance from "../../../utils/axiosInstance";
import { Country, State, City, ICountry, IState, ICity } from "country-state-city";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faGlobe,
  faCity,
  faFlag,
  faMapPin,
  faCar
} from '@fortawesome/free-solid-svg-icons';
import InputBox from '../../../components/InputBox';
import CommonButton from '../../../components/CommonButton';

// Driver Type
type Driver = {
  driverId: string;
  driverName: string;
  driverEmail: string;
  phno: string;
  address: string;
  country?: string;
  state: string;
  city: string;
  pincode: string;
  vehicleTypeId: string;
  isDeleted: boolean;
     licenseNo?: string; 
  licExpDate?: string;
};

// Vehicle Type
type VehicleType = {
  vehicleTypeId: string;
  vehicleType: string;
};

interface GetAllDriversResponse {
  message: string;
  drivers: Driver[];
}

// ------------------- New Type for Edit Form Data -------------------
interface EditDriverData {
  driverId: string;
  driverName: string;
  driverEmail: string;
  phno: string;
  address: string;
  address1: string;
  address2: string;
  country: string;
  state: string;
  city: string;
  pincode: string;
  vehicleTypeId: string;
   licenseNo: string;      
  licExpDate: string; 
  trackingSource: string;
}

const DriverListPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeDrivers, setActiveDrivers] = useState<Driver[]>([]);
  const [trashedDrivers, setTrashedDrivers] = useState<Driver[]>([]);
  const [viewTrashed, setViewTrashed] = useState(false);
  const [loading, setLoading] = useState(false);

  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"confirm-delete" | "confirm-restore">("confirm-delete");

  const [editModalOpen, setEditModalOpen] = useState(false);
  // ------------------- Use the new type for edit data -------------------
  const [editData, setEditData] = useState<EditDriverData | null>(null);
  const [countries, setCountries] = useState<ICountry[]>([]);
  const [states, setStates] = useState<IState[]>([]);
  const [cities, setCities] = useState<ICity[]>([]);
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loadingPincode, setLoadingPincode] = useState(false);

  const mapBackendDriverToFrontend = (d: any): Driver => ({
    driverId: d.id,
    driverName: d.name,
    driverEmail: d.email || '',
    phno: d.mobile,
    address: d.address || '',
    country: d.country || 'India',
    state: d.state || '',
    city: d.city || '',
    pincode: d.pincode || '',
    vehicleTypeId: d.vehicle_type_id || '',
    isDeleted: d.status === 'inactive',
    licenseNo: d.license_number || '',
    licExpDate: d.license_expiry || ''
  });

  // Function to fetch all drivers
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/drivers');
      if (res.data && res.data.success) {
        let allDrivers = res.data.data.map(mapBackendDriverToFrontend);
        if (searchQuery.trim() !== "") {
          const query = searchQuery.toLowerCase();
          allDrivers = allDrivers.filter((d: Driver) => 
            d.driverName.toLowerCase().includes(query) ||
            d.phno.includes(query) ||
            d.driverEmail.toLowerCase().includes(query) ||
            d.licenseNo?.toLowerCase().includes(query)
          );
        }
        setActiveDrivers(allDrivers.filter((d: Driver) => !d.isDeleted));
        setTrashedDrivers(allDrivers.filter((d: Driver) => d.isDeleted));
      }
    } catch (err) {
      showToast("Failed to fetch driver data.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch pincode based on city and state
  const fetchPincode = async (cityName: string, stateName: string) => {
    try {
      setLoadingPincode(true);
      const response = await fetch(`https://api.postalpincode.in/postoffice/${cityName}`);
      const data = await response.json();

      if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice) {
        const postOffices = data[0].PostOffice;
        const filteredOffices = postOffices.filter(
          (office: any) => office.State.toLowerCase() === stateName.toLowerCase()
        );

        if (filteredOffices.length > 0) {
          const pincode = filteredOffices[0].Pincode;
          setEditData(prev => prev ? ({ ...prev, pincode: pincode }) : null);
          showToast(`Pincode auto-filled: ${pincode}`, 'success');
        } else if (postOffices.length > 0) {
          const pincode = postOffices[0].Pincode;
          setEditData(prev => prev ? ({ ...prev, pincode: pincode }) : null);
          showToast(`Pincode auto-filled: ${pincode}`, 'success');
        } else {
          showToast('Pincode not found for this city', 'warn');
          setEditData(prev => prev ? ({ ...prev, pincode: '' }) : null);
        }
      } else {
        showToast('Unable to auto-fill pincode. Please enter manually.', 'info');
        setEditData(prev => prev ? ({ ...prev, pincode: '' }) : null);
      }
    } catch (error) {
      console.error('Error fetching pincode:', error);
      showToast('Unable to auto-fill pincode. Please enter manually.', 'info');
      setEditData(prev => prev ? ({ ...prev, pincode: '' }) : null);
    } finally {
      setLoadingPincode(false);
    }
  };

  // Fetch data on initial load and view toggle
  useEffect(() => {
    fetchDrivers();
  }, [viewTrashed]);

  // Trigger edit modal if ID parameter is in URL
  useEffect(() => {
    if (id && activeDrivers.length > 0) {
      const driver = activeDrivers.find(d => d.driverId === id);
      if (driver) {
        handleEdit(driver);
      }
    }
  }, [id, activeDrivers]);

  // Fetch all vehicle types
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const res = await axiosInstance.get<{ data: any[] }>("/vehicles");
        if (res.data && Array.isArray(res.data.data)) {
          const seen = new Set();
          const mapped: VehicleType[] = [];
          res.data.data.forEach((item) => {
            if (!seen.has(item.vehicle_type)) {
              seen.add(item.vehicle_type);
              mapped.push({
                vehicleTypeId: item.id,
                vehicleType: item.vehicle_type
              });
            }
          });
          setVehicleTypes(mapped);
        }
      } catch (err) {
        showToast('Failed to fetch vehicle types', 'error');
      }
    };
    fetchVehicleTypes();
  }, []);

  // Fetch driver data for edit modal
  const handleEdit = async (driver: Driver) => {
    try {
      const res = await axiosInstance.get(`/drivers/${driver.driverId}`);
      if (res.data && res.data.success) {
        const d = res.data.data;
        const addressParts = (d.address || '').split(',').map((s: string) => s.trim());
        const address1 = addressParts[0] || '';
        const address2 = addressParts.slice(1).join(', ') || '';
        
        setEditData({
          driverId: d.id,
          driverName: d.name,
          driverEmail: d.email || '',
          phno: d.mobile,
          address: d.address || '',
          address1: address1,
          address2: address2,
          country: d.country || 'India',
          state: d.state || '',
          city: d.city || '',
          pincode: d.pincode || '',
          vehicleTypeId: d.vehicle_type_id || '',
          licenseNo: d.license_number || '',
          licExpDate: d.license_expiry || '',
          trackingSource: d.tracking_source || ''
        });
        setEditModalOpen(true);
      }
    } catch (error) {
      showToast("Failed to load driver data for editing.", "error");
    }
  };

  // Populate state and city dropdowns when edit modal opens
  useEffect(() => {
    if (editModalOpen && editData) {
      const india = Country.getAllCountries().find(c => c.name === "India");
      if (india) {
        setCountries([india]);
        const statesOfIndia = State.getStatesOfCountry(india.isoCode);
        setStates(statesOfIndia);
        
        const selectedState = statesOfIndia.find(s => s.name === editData.state);
        if (selectedState) {
          setCities(City.getCitiesOfState(india.isoCode, selectedState.isoCode));
        }
      }
    }
  }, [editModalOpen, editData]);

  // ------------------- Type the 'prev' parameter -------------------
  const handleEditChange = (name: string, value: string) => {
    setEditData((prev: EditDriverData | null) => {
      if (!prev) return null;
      return { ...prev, [name]: value };
    });

    if (name === "city" && editData?.state) {
      fetchPincode(value, editData.state);
    }
  };

  const saveEdit = async () => {
    if (!editData) return;
    
    // Combine address lines
    const fullAddress = `${editData.address1}${editData.address2 ? `, ${editData.address2}` : ''}`;

    const payload = {
      name: editData.driverName,
      email: editData.driverEmail || null,
      mobile: editData.phno,
      address: fullAddress,
      license_number: editData.licenseNo,    
      license_expiry: editData.licExpDate || null,
      status: 'active'
    };

    try {
      await axiosInstance.put(`/drivers/${editData.driverId}`, payload);
      showToast("Driver updated successfully!", "success");
      setEditModalOpen(false);
      setEditData(null);
      if (id) {
        navigate('/fleet/drivers');
      } else {
        fetchDrivers();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to update driver.';
      showToast(errorMessage, 'error');
    }
  };

  // Delete logic
  const handleDeleteClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setModalType("confirm-delete");
    setModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedDriver) return;
    try {
      const res = await axiosInstance.delete(`/drivers/${selectedDriver.driverId}`);
      if (res.data && res.data.success) {
        showToast(`Driver '${selectedDriver.driverName}' deleted successfully.`, "success");
        fetchDrivers();
      } else {
        showToast(res.data?.message || "Failed to delete driver.", "error");
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to delete driver.", "error");
    } finally {
      setModalOpen(false);
      setSelectedDriver(null);
    }
  };

  // Restore logic
  const handleRestoreClick = (driver: Driver) => {
    setSelectedDriver(driver);
    setModalType("confirm-restore");
    setModalOpen(true);
  };

  const confirmRestore = async () => {
    if (!selectedDriver) return;
    try {
      const payload = {
        name: selectedDriver.driverName,
        email: selectedDriver.driverEmail || null,
        mobile: selectedDriver.phno,
        address: selectedDriver.address,
        license_number: selectedDriver.licenseNo,    
        license_expiry: selectedDriver.licExpDate || null,
        status: 'active'
      };
      await axiosInstance.put(`/drivers/${selectedDriver.driverId}`, payload);
      showToast(`Driver '${selectedDriver.driverName}' restored successfully.`, "success");
      fetchDrivers();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Failed to restore driver.", "error");
    } finally {
      setModalOpen(false);
      setSelectedDriver(null);
    }
  };

  const currentList = viewTrashed ? trashedDrivers : activeDrivers;

  const columns: Column<Driver>[] = [
    { header: "Driver Name", accessor: "driverName", sortable: true },
    { header: "Email", accessor: "driverEmail", sortable: true },
    { header: "Phone", accessor: "phno", sortable: true },
    { header: "State", accessor: "state", sortable: true },
    { header: "City", accessor: "city", sortable: true },

  // 👇 Add these two new columns
  { header: "License Number", accessor: "licenseNo", sortable: true },
  {
    header: "License Expiry Date",
    accessor: "licExpDate",
    sortable: true,
    render: (row) =>
      row.licExpDate
        ? new Date(row.licExpDate).toLocaleDateString("en-GB") // DD/MM/YYYY
        : "—",
  },

  ];

  return (
    <PageLayout>
      <div className="py-6">
        <AlertContainer />
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">List Drivers</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/fleet/drivers/add')}
              className="px-4 py-2 bg-[#1B4F8A] hover:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all"
            >
              + Add Driver
            </button>
            <TrashToggleButton
              showTrashed={viewTrashed}
              onToggle={() => setViewTrashed(!viewTrashed)}
            />
          </div>
        </div>

        <div className="mb-4">
          <SearchBar
            placeholder="Search by name, email, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={fetchDrivers}
          />
        </div>

        <DataTable
          key={searchQuery + viewTrashed}
          columns={columns}
          data={currentList}
          onEdit={!viewTrashed ? handleEdit : undefined}
          onDelete={!viewTrashed ? handleDeleteClick : undefined}
          onRestore={viewTrashed ? handleRestoreClick : undefined}
          loading={loading}
          rowsPerPage={10}
          uniqueRowKey="driverId"
        />

        {selectedDriver && (
          <ActionModal
            isOpen={modalOpen}
            type={modalType}
            onClose={() => setModalOpen(false)}
            onConfirm={modalType === "confirm-delete" ? confirmDelete : confirmRestore}
            itemName={selectedDriver.driverName}
          />
        )}

        {editModalOpen && editData && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded-lg w-1/2 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-semibold mb-4">Edit Driver</h2>
              <form onSubmit={(e) => { e.preventDefault(); saveEdit(); }} className="space-y-4">
                <InputBox
                  label="Driver Name"
                  name="driverName"
                  value={editData.driverName}
                  onChange={(name, value) => handleEditChange(name, value)}
                  icon={<FontAwesomeIcon icon={faUser} />}
                />
                <InputBox
                  label="Email Address"
                  name="driverEmail"
                  type="email"
                  value={editData.driverEmail}
                  onChange={(name, value) => handleEditChange(name, value)}
                  icon={<FontAwesomeIcon icon={faEnvelope} />}
                />
                <InputBox
                  label="Phone Number"
                  name="phno"
                  type="tel"
                  value={editData.phno}
                  onChange={(name, value) => handleEditChange(name, value)}
                  icon={<FontAwesomeIcon icon={faPhone} />}
                />
                <InputBox
                  label="Address Line 1"
                  name="address1"
                  value={editData.address1}
                  onChange={(name, value) => handleEditChange(name, value)}
                  icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                />
                <InputBox
                  label="Address Line 2 (Optional)"
                  name="address2"
                  value={editData.address2}
                  onChange={(name, value) => handleEditChange(name, value)}
                  icon={<FontAwesomeIcon icon={faMapMarkerAlt} />}
                />
                <InputBox
                  label="Country"
                  name="country"
                  type="select"
                  value={editData.country || "India"}
                  onChange={(name, value) => {
                    handleEditChange(name, value);
                    const selectedCountry = countries.find(c => c.name === value);
                    if (selectedCountry) {
                      setStates(State.getStatesOfCountry(selectedCountry.isoCode));
                      setCities([]);
                    }
                  }}
                  options={countries.map(c => ({ value: c.name, label: c.name }))}
                  icon={<FontAwesomeIcon icon={faGlobe} />}
                  disabled
                />
                <InputBox
                  label="State"
                  name="state"
                  type="select"
                  value={editData.state || ""}
                  onChange={(name, value) => {
                    handleEditChange(name, value);
                    const selectedCountry = countries.find(c => c.name === "India");
                    const selectedState = states.find(s => s.name === value);
                    if (selectedCountry && selectedState) {
                      setCities(City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode));
                    }
                  }}
                  options={states.map(s => ({ value: s.name, label: s.name }))}
                  icon={<FontAwesomeIcon icon={faFlag} />}
                />
                <InputBox
                  label="City"
                  name="city"
                  type="select"
                  value={editData.city || ""}
                  onChange={(name, value) => {
                    const prevCity = editData.city;
                    handleEditChange(name, value);
                    if (prevCity !== value) {
                      fetchPincode(value, editData.state);
                    }
                  }}
                  options={cities.map(c => ({ value: c.name, label: c.name }))}
                  icon={<FontAwesomeIcon icon={faCity} />}
                />
                <InputBox
                  label="Pincode"
                  name="pincode"
                  value={editData.pincode}
                  onChange={(name, value) => handleEditChange(name, value)}
                  placeholder={loadingPincode ? "Loading pincode..." : "Enter pincode"}
                  icon={<FontAwesomeIcon icon={faMapPin} />}
                  disabled={loadingPincode}
                />
                <InputBox
                  label="Vehicle Type"
                  name="vehicleTypeId"
                  type="select"
                  value={editData.vehicleTypeId}
                  onChange={(name, value) => handleEditChange(name, value)}
                  options={vehicleTypes.map(vt => ({ value: vt.vehicleTypeId, label: vt.vehicleType }))}
                  icon={<FontAwesomeIcon icon={faCar} />}
                />
                <InputBox
  label="License Number"
  name="licenseNo"
  value={editData.licenseNo}
  onChange={(name, value) => handleEditChange(name, value)}
/>

<InputBox
  label="License Expiry Date"
  name="licExpDate"
  type="date"
  value={editData.licExpDate}
  onChange={(name, value) => handleEditChange(name, value)}
/>
<InputBox
  label="Tracking Source"
  name="trackingSource"
  type="select"
  value={editData.trackingSource}
  onChange={(name, value) => handleEditChange(name, value)}
  options={[
    { value: "IP Address", label: "IP Address" },
    { value: "GPS", label: "GPS" }
  ]}
/>


                <div className="flex justify-end gap-2 mt-6">
                  <CommonButton
                    type="button"
                    onClick={() => { setEditModalOpen(false); if (id) navigate('/fleet/drivers'); }}
                    variant="secondary"
                  >
                    Cancel
                  </CommonButton>
                  <CommonButton
                    type="submit"
                    variant="primary"
                  >
                    Save Changes
                  </CommonButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default DriverListPage;