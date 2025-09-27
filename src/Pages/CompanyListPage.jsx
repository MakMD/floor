// makmd/floor/floor-65963b367ef8c4d4dde3af32af465a056bcb8db5/src/Pages/CompanyListPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEdit, FaCheck, FaUsersSlash } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import { useCompanies } from "../hooks/useCompanies";
import CompanyList from "../components/CompanyList/CompanyList";
import CreateCompanyForm from "../components/CreateCompanyForm/CreateCompanyForm";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import styles from "./CompanyListPage.module.css";
import commonStyles from "../styles/common.module.css"; // ІМПОРТ
import toast from "react-hot-toast";

const CompanyListPage = () => {
  const { companies, loading, refetch } = useCompanies();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleToggleCompanyStatus = async (companyId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("companies")
      .update({ status: newStatus })
      .eq("id", companyId);
    if (error) toast.error("Error updating status.");
    else refetch();
  };

  const handleUpdateCompanyName = async (companyId, newName) => {
    const { error } = await supabase
      .from("companies")
      .update({ name: newName })
      .eq("id", companyId);
    if (error) toast.error("Error updating name.");
    else refetch();
  };

  const activeCompanies = companies.filter((c) => c.status === "active");
  const filteredCompanies = activeCompanies.filter((company) =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button
          className={commonStyles.buttonSecondary} // ВИКОРИСТАННЯ
          onClick={() => navigate("/")}
        >
          <FaArrowLeft /> Back to Main
        </button>
        <h1 className={styles.pageTitle}>Companies</h1>
        <div className={styles.controls}>
          <button
            onClick={() => navigate("/inactive-companies")}
            className={commonStyles.buttonSecondary} // ВИКОРИСТАННЯ
          >
            <FaUsersSlash /> Inactive
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={commonStyles.buttonPrimary} // ВИКОРИСТАННЯ
          >
            {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <CreateCompanyForm onCompanyCreated={refetch} />

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search company by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {loading ? (
        <SkeletonLoader count={8} />
      ) : activeCompanies.length > 0 ? (
        <CompanyList
          companies={filteredCompanies}
          isEditing={isEditing}
          onUpdateCompanyName={handleUpdateCompanyName}
          onToggleCompanyStatus={handleToggleCompanyStatus}
        />
      ) : (
        <EmptyState message="No active companies found." />
      )}
    </div>
  );
};

export default CompanyListPage;
