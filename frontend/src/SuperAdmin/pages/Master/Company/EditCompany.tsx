import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import CommonButton from "../../../../components/CommonButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faReceipt,
  faUser,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";
import { showToast, AlertContainer } from "../../../../components/AlertBox";
import axiosInstance from "../../../../utils/axiosInstance";

export default function EditCompany() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    type: "company",
    contact_person: "",
    email: "",
    phone: "",
    address: "",
    billing_address: "",
    tax_number: "",
    billing_contact_name: "",
    billing_contact_email: "",
    billing_contact_phone: "",
    status: "active",
  });

  const [sameAsContact, setSameAsContact] = useState(false);
  const [sameAsAddress, setSameAsAddress] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get(`/organizations/${companyId}`);
        const org = data?.data;
        if (org) {
          setForm({
            name: org.name || "",
            type: org.type || "company",
            contact_person: org.contact_person || "",
            email: org.email || "",
            phone: org.phone || "",
            address: org.address || "",
            billing_address: org.billing_address || "",
            tax_number: org.tax_number || "",
            billing_contact_name: org.billing_contact_name || "",
            billing_contact_email: org.billing_contact_email || "",
            billing_contact_phone: org.billing_contact_phone || "",
            status: org.status || "active",
          });

          // Check if contact person is identical to billing contact details
          if (
            org.contact_person === org.billing_contact_name &&
            org.email === org.billing_contact_email &&
            org.phone === org.billing_contact_phone
          ) {
            setSameAsContact(true);
          }

          // Check if address is identical to billing address
          if (org.address === org.billing_address) {
            setSameAsAddress(true);
          }
        }
      } catch (err) {
        console.error("Error fetching organization details:", err);
        showToast("Failed to load organization details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (companyId) {
      fetchCompany();
    }
  }, [companyId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };

      if (sameAsContact) {
        if (name === "contact_person") updated.billing_contact_name = value;
        if (name === "email") updated.billing_contact_email = value;
        if (name === "phone") updated.billing_contact_phone = value;
      }

      if (sameAsAddress) {
        if (name === "address") updated.billing_address = value;
      }

      return updated;
    });
  };

  const handleSameAsContactToggle = (checked: boolean) => {
    setSameAsContact(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        billing_contact_name: prev.contact_person,
        billing_contact_email: prev.email,
        billing_contact_phone: prev.phone,
      }));
    }
  };

  const handleSameAsAddressToggle = (checked: boolean) => {
    setSameAsAddress(checked);
    if (checked) {
      setForm((prev) => ({
        ...prev,
        billing_address: prev.address,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.contact_person.trim() || !form.email.trim() || !form.phone.trim() || !form.address.trim() || !form.billing_address.trim() || !form.billing_contact_name.trim() || !form.billing_contact_email.trim() || !form.billing_contact_phone.trim()) {
      showToast("Please fill in all required fields marked with *", "warn");
      return;
    }

    setSubmitting(true);
    try {
      await axiosInstance.put(`/organizations/${companyId}`, form);
      showToast("Organization updated successfully!", "success");
      navigate("/organizations");
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to update organization. Please try again.";
      showToast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="py-12 text-center text-gray-500 font-medium">
          Loading organization details...
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <AlertContainer />
      <main className="py-6 max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faBuilding} className="text-[#275981]" />
            Edit Organization
          </h1>
          <p className="text-sm text-gray-500 mt-1">Update organization information and contact details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Organization General Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide border-b border-gray-50 pb-2">
              General Info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faBuilding} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. Danfoss Industries"
                    value={form.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Organization Type <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    name="type"
                    required
                    value={form.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55 h-[42px]"
                  >
                    <option value="company">Company</option>
                    <option value="school">School</option>
                    <option value="college">College</option>
                    <option value="hospital">Hospital</option>
                    <option value="institution">Institution</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Contact Person <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="text"
                    name="contact_person"
                    required
                    placeholder="e.g. John Doe"
                    value={form.contact_person}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="e.g. hr@danfoss.com"
                    value={form.email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="text"
                    name="phone"
                    required
                    placeholder="e.g. 9999999994"
                    value={form.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  GST/Tax Number <span className="text-gray-400 font-normal normal-case">(optional)</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faReceipt} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="text"
                    name="tax_number"
                    placeholder="e.g. 33AAAAA1111A1Z1"
                    value={form.tax_number}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                <textarea
                  name="address"
                  required
                  rows={2}
                  placeholder="Enter full physical address"
                  value={form.address}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Billing Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Billing Info
              </h2>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={sameAsContact}
                    onChange={(e) => handleSameAsContactToggle(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-500"
                  />
                  Same as Contact Person
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer font-semibold">
                  <input
                    type="checkbox"
                    checked={sameAsAddress}
                    onChange={(e) => handleSameAsAddressToggle(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-blue-500"
                  />
                  Same as Address
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Billing Contact Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faUser} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="text"
                    name="billing_contact_name"
                    required
                    placeholder="e.g. John Doe"
                    disabled={sameAsContact}
                    value={form.billing_contact_name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55 disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Billing Contact Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faEnvelope} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="email"
                    name="billing_contact_email"
                    required
                    placeholder="e.g. hr@danfoss.com"
                    disabled={sameAsContact}
                    value={form.billing_contact_email}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55 disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Billing Contact Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faPhone} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                  <input
                    type="text"
                    name="billing_contact_phone"
                    required
                    placeholder="e.g. 9999999994"
                    disabled={sameAsContact}
                    value={form.billing_contact_phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55 disabled:opacity-70"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                  Status <span className="text-red-500">*</span>
                </label>
                <select
                  name="status"
                  required
                  value={form.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55 h-[42px]"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                Billing Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="absolute left-3.5 top-3.5 text-gray-400 text-sm" />
                <textarea
                  name="billing_address"
                  required
                  rows={2}
                  placeholder="Enter full billing address"
                  disabled={sameAsAddress}
                  value={form.billing_address}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-55 resize-none disabled:opacity-70"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/organizations")}
              className="px-6 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50 active:bg-gray-100 transition-all text-sm"
            >
              Cancel
            </button>
            <CommonButton
              type="submit"
              variant="success"
              disabled={submitting}
              className="px-8 py-3 rounded-xl shadow-lg font-extrabold flex items-center gap-2"
            >
              {submitting && <FontAwesomeIcon icon={faCheckCircle} className="animate-spin" />}
              Save Changes
            </CommonButton>
          </div>
        </form>
      </main>
    </PageLayout>
  );
}
