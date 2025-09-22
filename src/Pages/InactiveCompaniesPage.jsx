// src/Pages/InactiveCompaniesPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useCompanies } from "../hooks/useCompanies"; // ІМПОРТ
import CompanyList from "../components/CompanyList/CompanyList";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import styles from "./CompanyListPage.module.css";

const InactiveCompaniesPage = () => {
  const { companies, loading, refetch } = useCompanies(); // ВИКОРИСТАННЯ
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleToggleCompanyStatus = async (companyId) => {
    const { error } = await supabase
      .from("companies")
      .update({ status: "active" })
      .eq("id", companyId);
    if (error) console.error("Error updating status:", error);
    else await refetch();
  };

  const handleUpdateCompanyName = async (companyId, newName) => {
    const { error } = await supabase
      .from("companies")
      .update({ name: newName })
      .eq("id", companyId);
    if (error) console.error("Error updating name:", error);
    else await refetch();
  };

  const inactiveCompanies = companies.filter((c) => c.status === "inactive");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/companies")}
        >
          Back to Companies
        </button>
        <h1 className={styles.pageTitle}>Inactive Companies</h1>
        <div className={styles.controls}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={styles.editButton}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={4} />
      ) : inactiveCompanies.length > 0 ? (
        <CompanyList
          companies={inactiveCompanies}
          isEditing={isEditing}
          onUpdateCompanyName={handleUpdateCompanyName}
          onToggleCompanyStatus={handleToggleCompanyStatus}
        />
      ) : (
        <EmptyState message="There are no inactive companies." />
      )}
    </div>
  );
};

export default InactiveCompaniesPage;
