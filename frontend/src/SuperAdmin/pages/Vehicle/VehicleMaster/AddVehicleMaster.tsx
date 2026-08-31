import React, { useState } from 'react';
import PageLayout from '../../../../components/PageLayout';
import InputBox from '../../../../components/InputBox';
import CommonButton from '../../../../components/CommonButton';
import { AlertContainer, showToast } from '../../../../components/AlertBox';
import { faCar, faClipboardList, faImage, faTimes, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import axiosInstance from '../../../../utils/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AddVehicleMaster: React.FC = () => {
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [seatingCapacity, setSeatingCapacity] = useState('');
  const [pricePerKm, setPricePerKm] = useState('');
  const [status, setStatus] = useState('active');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSavingVehicle, setIsSavingVehicle] = useState(false);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match(/^image\/(jpeg|png|jpg|webp)$/)) {
        showToast('Please select a valid image file (JPEG, PNG, WEBP)', 'error');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image file size must not exceed 5MB', 'error');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSavingVehicle) return;

    if (!vehicleType || !vehicleNumber.trim() || !seatingCapacity || !pricePerKm) {
      showToast('Please fill all required fields.', 'error');
      return;
    }

    try {
      setIsSavingVehicle(true);
      const formData = new FormData();
      formData.append('vehicle_type', vehicleType);
      formData.append('vehicle_number', vehicleNumber.trim().toUpperCase());
      formData.append('seating_capacity', seatingCapacity);
      formData.append('price_per_km', pricePerKm);
      formData.append('status', status);
      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      const res = await axiosInstance.post('/vehicles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.status === 201 || res.data?.success) {
        showToast('Vehicle registered successfully with image!', 'success');
        setTimeout(() => {
          navigate('/fleet/vehicles');
        }, 1000);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Server error. Please try again.';
      showToast(msg, 'error');
    } finally {
      setIsSavingVehicle(false);
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
            placeholder="e.g. Sedan, SUV, Luxury"
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

          {/* Vehicle Image Upload Field */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Vehicle Image <span className="text-xs text-gray-400 font-normal">(optional, Max 5MB)</span>
            </label>
            <div className="flex items-center gap-4">
              {imagePreview ? (
                <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-blue-200 shadow-sm bg-gray-50 flex-shrink-0">
                  <img
                    src={imagePreview}
                    alt="Vehicle Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-700 shadow-md transition"
                    title="Remove image"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ) : (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 flex-shrink-0">
                  <FontAwesomeIcon icon={faImage} className="text-2xl mb-1" />
                  <span className="text-[10px]">No Image</span>
                </div>
              )}
              <div className="flex-1">
                <input
                  type="file"
                  id="vehicle-image-upload"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="vehicle-image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition border border-gray-200"
                >
                  <FontAwesomeIcon icon={faImage} />
                  {imagePreview ? 'Change Image' : 'Select Vehicle Photo'}
                </label>
                <p className="text-[11px] text-gray-400 mt-1">Supports JPG, PNG, WEBP up to 5MB</p>
              </div>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex justify-end">
            <CommonButton
              type="submit"
              variant="success"
              className="px-6 py-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSavingVehicle}
            >
              {isSavingVehicle ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                  Registering...
                </>
              ) : (
                'Register Vehicle'
              )}
            </CommonButton>
          </div>
        </form>
      </main>
    </PageLayout>
  );
};

export default AddVehicleMaster;

