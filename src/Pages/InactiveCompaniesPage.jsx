// src/Pages/InactiveCompaniesPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import CompanyList from "../components/CompanyList/CompanyList";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import styles from "./CompanyListPage.module.css";

const InactiveCompaniesPage = () => {
  const [inactiveCompanies, setInactiveCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const fetchInactiveCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("status", "inactive");

    if (error) {
      console.error("Error fetching inactive companies:", error);
    } else {
      setInactiveCompanies(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInactiveCompanies();
  }, []);

  const handleToggleCompanyStatus = async (companyId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("companies")
      .update({ status: newStatus })
      .eq("id", companyId);
    if (error) console.error("Error updating status:", error);
    else await fetchInactiveCompanies();
  };

  const handleUpdateCompanyName = async (companyId, newName) => {
    const { error } = await supabase
      .from("companies")
      .update({ name: newName })
      .eq("id", companyId);
    if (error) console.error("Error updating name:", error);
    else await fetchInactiveCompanies();
  };

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
