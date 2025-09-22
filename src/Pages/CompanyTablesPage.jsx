// src/Pages/CompanyTablesPage.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./CompanyTablesPage.module.css";
import toast from "react-hot-toast";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import { FaPlus, FaTrash, FaEdit, FaCheck, FaUsersSlash } from "react-icons/fa";

const CompanyTablesPage = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newTableName, setNewTableName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);

  const fetchCompanyData = async () => {
    if (!companyId) return;
    setLoading(true);

    try {
      const desiredStatus = showInactive ? "inactive" : "active";
      let tablesQuery = supabase
        .from("invoice_tables")
        .select(`id, name, status, invoices(count)`)
        .eq("company_id", companyId)
        .eq("status", desiredStatus)
        .order("created_at", { ascending: false });

      const [companyResult, tablesResult] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name")
          .eq("id", companyId)
          .single(),
        tablesQuery,
      ]);

      if (companyResult.error) throw companyResult.error;
      if (tablesResult.error) throw tablesResult.error;

      setCompany(companyResult.data);
      const formattedTables = tablesResult.data.map((t) => ({
        id: t.id,
        name: t.name,
        status: t.status,
        invoiceCount: t.invoices[0]?.count || 0,
      }));
      setTables(formattedTables);
    } catch (error) {
      toast.error("Could not fetch company data.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyId, showInactive]);

  const handleAddTable = async () => {
    if (newTableName.trim() === "") {
      toast.error("Table name is required");
      return;
    }
    const { error } = await supabase.from("invoice_tables").insert({
      name: newTableName.trim(),
      company_id: companyId,
      status: "active",
    });

    if (error) {
      toast.error("Error adding table");
    } else {
      toast.success("Table added successfully!");
      setNewTableName("");
      fetchCompanyData();
    }
  };

  const handleToggleTableStatus = async (tableId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("invoice_tables")
      .update({ status: newStatus })
      .eq("id", tableId);

    if (error) {
      toast.error("Failed to update table status.");
    } else {
      toast.success(`Table status changed to ${newStatus}.`);
      fetchCompanyData();
    }
  };

  const handleTableClick = (tableId) => {
    if (isEditing) return;
    navigate(`/company/${companyId}/table/${tableId}`);
  };

  const filteredTables = tables.filter((table) =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/companies")}
        >
          Back
        </button>
        <h1 className={styles.pageTitle}>{company?.name || ""} - Tables</h1>
        <div className={styles.headerControls}>
          <button
            onClick={() => setShowInactive(!showInactive)}
            className={styles.showHiddenButton}
          >
            <FaUsersSlash /> {showInactive ? "Show Active" : "Show Inactive"}
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={styles.editButton}
          >
            <FaCheck style={{ display: isEditing ? "inline" : "none" }} />
            <FaEdit style={{ display: !isEditing ? "inline" : "none" }} />
            {isEditing ? " Done" : " Edit"}
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search by table name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* ВИПРАВЛЕНО: Форма додавання тепер завжди видима */}
      <div className={styles.addTableForm}>
        <input
          type="text"
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
          placeholder="New table name"
          className={styles.inputField}
        />
        <button onClick={handleAddTable} className={styles.addTableButton}>
          <FaPlus /> Add Table
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={4} />
      ) : (
        <ul className={styles.tableList}>
          {filteredTables.length > 0 ? (
            filteredTables.map((table) => (
              <li
                key={table.id}
                className={styles.tableItem}
                onClick={() => handleTableClick(table.id)}
              >
                <div className={styles.tableInfo}>
                  <h3>{table.name}</h3>
                  <p>Invoices: {table.invoiceCount}</p>
                </div>
                {isEditing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleTableStatus(table.id, table.status);
                    }}
                    className={styles.hideButton}
                  >
                    {table.status === "active" ? "To Inactive" : "To Active"}
                  </button>
                )}
              </li>
            ))
          ) : (
            <EmptyState
              message={`No ${
                showInactive ? "inactive" : "active"
              } tables found.`}
            />
          )}
        </ul>
      )}
    </div>
  );
};

export default CompanyTablesPage;
