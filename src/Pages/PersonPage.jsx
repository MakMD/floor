// src/Pages/PersonPage.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaArrowLeft, FaEdit, FaCheck } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import styles from "./PersonPage.module.css";

const PersonPage = () => {
  const { personId } = useParams();
  const [person, setPerson] = useState(null);
  const [newTableName, setNewTableName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const fetchPerson = async () => {
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .eq("id", personId)
      .single();
    if (error) {
      console.error("Error fetching person:", error);
      setPerson({ tables: [] });
    } else {
      const sortedTables = (data.tables || []).sort((a, b) =>
        b.name.localeCompare(a.name)
      );
      setPerson({ ...data, tables: sortedTables });
    }
  };

  useEffect(() => {
    fetchPerson();
  }, [personId]);

  const updatePersonTables = async (updatedTables) => {
    const { error } = await supabase
      .from("people")
      .update({ tables: updatedTables })
      .eq("id", personId);
    if (error) console.error("Error updating tables:", error);
    else await fetchPerson();
  };

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;
    const newTable = {
      tableId: Date.now().toString(),
      name: newTableName,
      invoices: [],
    };
    const updatedTables = [...(person.tables || []), newTable];
    await updatePersonTables(updatedTables);
    setNewTableName("");
  };

  const handleDeleteTable = async (tableId) => {
    if (!window.confirm("Are you sure you want to delete this table?")) return;
    const updatedTables = person.tables.filter(
      (table) => table.tableId !== tableId
    );
    await updatePersonTables(updatedTables);
  };

  return (
    <div className={styles.personPage}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          <FaArrowLeft /> Back
        </button>
        <h1 className={styles.pageTitle}>
          {person ? `${person.name}'s Tables` : "Loading..."}
        </h1>
        <button
          className={styles.editButton}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <>
              <FaCheck /> Done
            </>
          ) : (
            <>
              <FaEdit /> Edit
            </>
          )}
        </button>
      </div>

      <div className={styles.addTableForm}>
        <input
          type="text"
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
          placeholder="Enter new table name (e.g., Month YYYY)"
          className={styles.inputField}
        />
        <button onClick={handleAddTable} className={styles.addTableButton}>
          <FaPlus /> Add Table
        </button>
      </div>

      {!person ? (
        <SkeletonLoader count={3} />
      ) : person.tables && person.tables.length > 0 ? (
        <ul className={styles.tableList}>
          {person.tables.map((table) => {
            const invoiceCount = table.invoices?.length || 0;
            const totalIncome =
              table.invoices?.reduce(
                (sum, inv) => sum + parseFloat(inv.total_income || 0),
                0
              ) || 0;
            return (
              <li key={table.tableId} className={styles.tableItem}>
                <div
                  className={styles.tableInfo}
                  onClick={() =>
                    navigate(`/person/${personId}/tables/${table.tableId}`)
                  }
                >
                  <span className={styles.tableName}>{table.name}</span>
                  <div className={styles.tableDetails}>
                    <span>
                      Invoices: <strong>{invoiceCount}</strong>
                    </span>
                    <span>
                      Total: <strong>${totalIncome.toFixed(2)}</strong>
                    </span>
                  </div>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleDeleteTable(table.tableId)}
                    className={styles.deleteButton}
                  >
                    <FaTrash />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState message="No tables have been created for this person yet." />
      )}
    </div>
  );
};

export default PersonPage;
