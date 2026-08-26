import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PageLayout from "../../../../components/PageLayout";
import axiosInstance from "../../../../utils/axiosInstance";
import { showToast } from "../../../../components/AlertBox";

// ✅ Common components
import { DataTable, Column } from "../../../../components/DataTable";
import CommonButton from "../../../../components/CommonButton";
import SearchBar from "../../../../components/SearchBar";
import TrashToggleButton from "../../../../components/TrashToggleButton";

type Company = {
  companyId: string;
  companyName: string;
  type: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  status: string;
};

const ListCompany: React.FC = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [showTrashed, setShowTrashed] = useState(false);
  const [deletePopupOpen, setDeletePopupOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  /** Fetch organizations */
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get<{ data: any[] }>("/organizations");
      const list = (data.data || []).map((item) => ({
        companyId: item.id,
        companyName: item.name,
        type: item.type,
        contactPerson: item.contact_person,
        email: item.email,
        phone: item.phone,
        address: item.address,
        status: item.status || 'active',
      }));
      setCompanies(list);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      showToast("Failed to fetch organizations", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Apply search filter and active/inactive toggle
  useEffect(() => {
    let result = companies;

    // Filter by status (trashed mapping to inactive status)
    if (showTrashed) {
      result = result.filter(c => c.status.toLowerCase() === 'inactive');
    } else {
      result = result.filter(c => c.status.toLowerCase() !== 'inactive');
    }

    // Filter by keyword
    if (searchKeyword.trim()) {
      const q = searchKeyword.toLowerCase();
      result = result.filter(c => 
        c.companyName.toLowerCase().includes(q) ||
        c.contactPerson.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    }

    setFilteredCompanies(result);
  }, [companies, showTrashed, searchKeyword]);

  /** Edit */
  const handleEdit = (company: Company) => {
    navigate(`/company/edit/${company.companyId}`, { state: company });
  };

  /** Delete ask */
  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeletePopupOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCompany) return;
    try {
      await axiosInstance.delete(`/organizations/${selectedCompany.companyId}`);
      showToast("Organization deleted successfully!", "success");
      setDeletePopupOpen(false);
      fetchCompanies();
    } catch (error) {
      console.error("Error deleting organization:", error);
      showToast("Failed to delete organization", "error");
    }
  };

  /** Restore (Toggle status back to active) */
  const handleActivate = async (company: Company) => {
    try {
      const fullRecord = companies.find(c => c.companyId === company.companyId);
      if (!fullRecord) return;
      await axiosInstance.put(`/organizations/${company.companyId}`, {
        name: fullRecord.companyName,
        type: fullRecord.type,
        contact_person: fullRecord.contactPerson,
        email: fullRecord.email,
        phone: fullRecord.phone,
        address: fullRecord.address,
        billing_address: fullRecord.address,
        billing_contact_name: fullRecord.contactPerson,
        billing_contact_email: fullRecord.email,
        billing_contact_phone: fullRecord.phone,
        status: 'active'
      });
      showToast("Organization activated successfully!", "success");
      fetchCompanies();
    } catch (error) {
      console.error("Error restoring organization:", error);
      showToast("Failed to restore organization", "error");
    }
  };

  /** Columns for DataTable */
  const columns: Column<Company>[] = [
    { header: "Organization Name", accessor: "companyName" },
    { header: "Type", accessor: "type" },
    { header: "Contact Person", accessor: "contactPerson" },
    { header: "Email", accessor: "email" },
    { header: "Phone", accessor: "phone" },
    { header: "Status", accessor: "status" },
  ];

  return (
    <PageLayout>
      <div className="py-6">
        <h1 className="text-3xl font-bold">
          List Organizations {showTrashed ? "- (Inactive)" : ""}
        </h1>

        <main className="flex-1 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <SearchBar
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              onSearch={() => {}}
              placeholder="Keywords (Organization)"
            />

            <TrashToggleButton
              showTrashed={showTrashed}
              onToggle={() => setShowTrashed((prev) => !prev)}
            />
          </div>

          <DataTable
            key={searchKeyword + showTrashed + filteredCompanies.length}
            columns={columns}
            data={filteredCompanies}
            loading={loading}
            onEdit={!showTrashed ? handleEdit : undefined}
            onDelete={!showTrashed ? handleDelete : undefined}
            onRestore={showTrashed ? handleActivate : undefined}
            rowsPerPage={5}
          />
        </main>

        {deletePopupOpen && selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
              <h2 className="text-xl font-bold mb-4 text-red-600">
                Delete Organization
              </h2>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete{" "}
                <strong>{selectedCompany.companyName}</strong>?
              </p>
              <div className="mt-4 flex gap-2 justify-end">
                <CommonButton
                  onClick={() => setDeletePopupOpen(false)}
                  variant="secondary"
                >
                  Cancel
                </CommonButton>
                <CommonButton onClick={confirmDelete} variant="danger">
                  Confirm
                </CommonButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default ListCompany;
