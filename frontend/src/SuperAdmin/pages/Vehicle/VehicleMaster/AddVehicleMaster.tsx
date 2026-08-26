import React, { useState } from 'react';
import PageLayout from '../../../../components/PageLayout';
import InputBox from '../../../../components/InputBox';
import CommonButton from '../../../../components/CommonButton';
import { AlertContainer, showToast } from '../../../../components/AlertBox';
import { faCar, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AddVehicleMaster: React.FC = () => {
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [status, setStatus] = useState('active');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehicleType || !vehicleNumber.trim() || !seatingCapacity || !pricePerKm) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        vehicle_type: vehicleType,
        vehicle_number: vehicleNumber,
        seating_capacity: parseInt(seatingCapacity, 10),
        price_per_km: parseFloat(pricePerKm),
        status: status,
      };

      const res = await axiosInstance.post('/vehicles', payload);

      if (res.status === 201) {
        showToast('Vehicle registered successfully!', 'success');
        setTimeout(() => {
          navigate('/fleet/vehicles');
        }, 1000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Server error. Please try again.';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageLayout>
      <AlertContainer />
      <main className="py-6">
        <h1 className="text-3xl font-bold text-gray-800">Add Vehicle</h1>
        <div className="text-lg font-semibold text-[#275981] py-5 underline">
          <FontAwesomeIcon icon={faClipboardList} /> Fleet Registration
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 max-w-lg bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <InputBox
            label="Vehicle Type *"
            name="vehicleType"
            required
            placeholder="e.g. Sedan, SUV"
            value={vehicleType}
            onChange={(name, value) => setVehicleType(value)}
          />

          <InputBox
            label="Vehicle Plate Number *"
            name="vehicleNumber"
            required
            placeholder="e.g. TN01AB1234"
            icon={faCar}
            value={vehicleNumber}
            onChange={(name, value) => setVehicleNumber(value)}
          />

          <InputBox
            label="Seating Capacity *"
            name="seatingCapacity"
            type="number"
            required
            placeholder="e.g. 4, 6, 7"
            value={seatingCapacity}
            onChange={(name, value) => setSeatingCapacity(value)}
          />

          <InputBox
            label="Price Per KM (₹) *"
            name="pricePerKm"
            type="number"
            required
            placeholder="e.g. 18.00, 25.00"
            value={pricePerKm}
            onChange={(name, value) => setPricePerKm(value)}
          />

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end">
            <CommonButton
              type="submit"
              variant="success"
              className="px-6 py-2 text-lg"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Vehicle'}
            </CommonButton>
          </div>
        </form>
      </main>
    </PageLayout>
  );
};

export default AddVehicleMaster;
