// src/Pages/PersonPage.jsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaPlus, FaTrash, FaArrowLeft, FaEdit, FaCheck } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import styles from "./PersonPage.module.css";
import commonStyles from "../styles/common.module.css";
import toast from "react-hot-toast";

const parseTableNameToDate = (name) => {
  if (!name) return new Date(0);

  const numericMatch = name.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (numericMatch) {
    const [, day, month, year] = numericMatch;
    return new Date(year, month - 1, day);
  }

  const textMatch = name.match(/^([A-Za-z]+)\s(\d{1,2})-(?:.*)\s(\d{4})$/);
  if (textMatch) {
    const [, monthStr, dayStr, yearStr] = textMatch;
    const date = new Date(`${monthStr} ${dayStr}, ${yearStr}`);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return new Date(0);
};

const PersonPage = () => {
  const { personId } = useParams();
  const [person, setPerson] = useState(null);
  const [tables, setTables] = useState([]);
  const [newTableName, setNewTableName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ОПТИМІЗАЦІЯ: Використання useCallback для стабілізації посилання на функцію
  const fetchPersonData = useCallback(async () => {
    if (!personId) return;
    setLoading(true);

    const { data: personData, error: personError } = await supabase
      .from("people")
      .select("id, name")
      .eq("id", personId)
      .single();

    if (personError) {
      toast.error("Could not fetch person data.");
      setLoading(false);
      return;
    }
    setPerson(personData);

    const { data: tablesData, error: tablesError } = await supabase
      .from("invoice_tables")
      .select(`id, name, invoices ( count )`)
      .eq("person_id", personId);

    if (tablesError) {
      toast.error("Could not fetch person's tables.");
    } else {
      let formattedTables = tablesData.map((t) => ({
        id: t.id,
        name: t.name,
        invoiceCount: t.invoices[0]?.count || 0,
      }));

      formattedTables.sort((a, b) => {
        const dateA = parseTableNameToDate(a.name);
        const dateB = parseTableNameToDate(b.name);

        if (dateA.getTime() > 0 && dateB.getTime() > 0) {
          return dateB - dateA;
        }
        return b.name.localeCompare(a.name);
      });

      setTables(formattedTables);
    }
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    fetchPersonData();
  }, [fetchPersonData]);

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;

    const { error } = await supabase
      .from("invoice_tables")
      .insert({ name: newTableName.trim(), person_id: personId });

    if (error) {
      toast.error("Failed to add new table.");
    } else {
      toast.success("Table added successfully!");
      setNewTableName("");
      fetchPersonData();
    }
  };

  const handleDeleteTable = async (tableId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this table and all its invoices?",
      )
    )
      return;

    const { error } = await supabase
      .from("invoice_tables")
      .delete()
      .eq("id", tableId);

    if (error) {
      toast.error("Failed to delete table.");
    } else {
      toast.success("Table deleted successfully!");
      fetchPersonData();
    }
  };

  return (
    <div className={styles.personPage}>
      <div className={styles.header}>
        <button
          className={commonStyles.buttonSecondary}
          onClick={() => navigate("/")}
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className={styles.pageTitle}>
          {person ? `${person.name}'s Tables` : "Loading..."}
        </h1>
        <button
          className={
            isEditing ? commonStyles.buttonSuccess : commonStyles.buttonPrimary
          }
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Done" : "Edit"}
        </button>
      </div>

      <div className={styles.addTableForm}>
        <input
          type="text"
          value={newTableName}
          onChange={(e) => setNewTableName(e.target.value)}
          placeholder="Enter new table name (e.g., DD.MM.YYYY)"
          className={styles.inputField}
        />
        <button onClick={handleAddTable} className={commonStyles.buttonSuccess}>
          <FaPlus /> Add Table
        </button>
      </div>

      {loading ? (
        <SkeletonLoader count={3} />
      ) : tables.length > 0 ? (
        <ul className={styles.tableList}>
          {tables.map((table) => (
            <li key={table.id} className={styles.tableItem}>
              <div
                className={styles.tableInfo}
                onClick={() =>
                  navigate(`/person/${personId}/tables/${table.id}`)
                }
              >
                <span className={styles.tableName}>{table.name}</span>
                <div className={styles.tableDetails}>
                  <span>
                    Invoices: <strong>{table.invoiceCount}</strong>
                  </span>
                </div>
              </div>
              {isEditing && (
                <button
                  onClick={() => handleDeleteTable(table.id)}
                  className={commonStyles.buttonIcon}
                >
                  <FaTrash />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="No tables have been created for this person yet." />
      )}
    </div>
  );
};

export default PersonPage;
