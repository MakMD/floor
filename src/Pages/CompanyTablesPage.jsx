// src/Pages/CompanyTablesPage.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./CompanyTablesPage.module.css";

const CompanyTablesPage = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState(null);
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTables, setFilteredTables] = useState([]);
  const [newTable, setNewTable] = useState({
    date: "",
    invoiceNumber: "",
    billTo: "",
    payTo: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");

  const fetchCompanyData = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("name", companyName)
      .single();

    if (error) {
      setError("Error fetching company tables");
      console.error("Error fetching company tables:", error);
    } else {
      const fetchedTables = data.invoiceTables || [];
      const updatedTables = fetchedTables.map((table) => ({
        ...table,
        isHidden: table.isHidden || false,
      }));
      updatedTables.sort(
        (a, b) =>
          new Date(b.invoiceDetails.date) - new Date(a.invoiceDetails.date)
      );
      setCompanyData(data);
      setTables(updatedTables);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyName]);

  // --- ВИПРАВЛЕНА ТА ПОКРАЩЕНА ЛОГІКА ФІЛЬТРАЦІЇ ---
  useEffect(() => {
    if (!tables) return;

    const filtered = tables
      .filter((table) => (showHidden ? table.isHidden : !table.isHidden))
      .filter((table) => {
        // Якщо рядок пошуку порожній, показуємо таблицю
        if (!searchTerm.trim()) {
          return true;
        }
        // Якщо рядок пошуку не порожній, перевіряємо інвойси
        if (!table.invoices || table.invoices.length === 0) {
          return false; // Не показуємо таблицю без інвойсів при пошуку
        }
        // Шукаємо збіг в адресах, безпечно перевіряючи наявність invoice.address
        return table.invoices.some(
          (invoice) =>
            invoice.address &&
            invoice.address.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    setFilteredTables(filtered);
  }, [searchTerm, tables, showHidden]);

  const handleAddTable = async () => {
    const { date, invoiceNumber, billTo, payTo } = newTable;
    if (!date || !invoiceNumber || !billTo || !payTo) {
      setError("All fields are required");
      return;
    }
    const newTableData = {
      tableId: `${Date.now()}_${Math.random()}`,
      name: `Invoices for ${new Date(date).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      })}`,
      invoiceDetails: { date, invoiceNumber, billTo, payTo },
      invoices: [],
      isHidden: false,
    };
    const updatedTables = [newTableData, ...tables];
    const { error: updateError } = await supabase
      .from("companies")
      .update({ invoiceTables: updatedTables })
      .eq("id", companyData.id);
    if (updateError) {
      setError("Error adding table");
      console.error("Error adding table:", updateError);
    } else {
      setTables(updatedTables);
      setNewTable({ date: "", invoiceNumber: "", billTo: "", payTo: "" });
      setError("");
      setShowAddForm(false);
    }
  };

  const handleHideTable = async (tableId) => {
    const updatedTables = tables.map((table) =>
      table.tableId === tableId ? { ...table, isHidden: true } : table
    );
    const { error: updateError } = await supabase
      .from("companies")
      .update({ invoiceTables: updatedTables })
      .eq("id", companyData.id);
    if (updateError) console.error("Error hiding table:", updateError);
    else setTables(updatedTables);
  };

  const handleTableClick = (tableId, event) => {
    if (event.target.tagName === "BUTTON") return;
    navigate(`/company/${companyName}/table/${tableId}`);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/companies")}
        >
          Back
        </button>
        <h1 className={styles.pageTitle}>{companyName} - Tables</h1>
        <div className={styles.headerControls}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={styles.editButton}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
          <button
            onClick={() => setShowHidden(!showHidden)}
            className={styles.showHiddenButton}
          >
            {showHidden ? "Show Active" : "Show Hidden"}
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search by address in invoices..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={styles.addTableButton}
        >
          {showAddForm ? "Close Form" : "Add New Table"}
        </button>
      </div>

      {showAddForm && (
        <div className={styles.addTableForm}>
          <input
            type="date"
            name="date"
            value={newTable.date}
            onChange={(e) => setNewTable({ ...newTable, date: e.target.value })}
            className={styles.inputField}
          />
          <input
            type="text"
            name="invoiceNumber"
            value={newTable.invoiceNumber}
            onChange={(e) =>
              setNewTable({ ...newTable, invoiceNumber: e.target.value })
            }
            placeholder="Invoice Number"
            className={styles.inputField}
          />
          <input
            type="text"
            name="billTo"
            value={newTable.billTo}
            onChange={(e) =>
              setNewTable({ ...newTable, billTo: e.target.value })
            }
            placeholder="Bill To"
            className={styles.inputField}
          />
          <input
            type="text"
            name="payTo"
            value={newTable.payTo}
            onChange={(e) =>
              setNewTable({ ...newTable, payTo: e.target.value })
            }
            placeholder="Pay To"
            className={styles.inputField}
          />
          <button onClick={handleAddTable} className={styles.saveButton}>
            Save New Table
          </button>
        </div>
      )}

      {error && <p>{error}</p>}

      <ul className={styles.tableList}>
        {filteredTables.length > 0 ? (
          filteredTables.map((table) => (
            <li
              key={table.tableId}
              className={styles.tableItem}
              onClick={(event) => handleTableClick(table.tableId, event)}
            >
              <h3>{table.name}</h3>
              <p>Invoice Number: {table.invoiceDetails.invoiceNumber}</p>
              <p>Pay To: {table.invoiceDetails.payTo}</p>
              <p>Bill To: {table.invoiceDetails.billTo}</p>
              <p>Date: {table.invoiceDetails.date}</p>
              {isEditing && (
                <button
                  onClick={() => handleHideTable(table.tableId)}
                  className={styles.hideButton}
                >
                  Hide
                </button>
              )}
            </li>
          ))
        ) : (
          <p>No tables available.</p>
        )}
      </ul>
    </div>
  );
};

export default CompanyTablesPage;
