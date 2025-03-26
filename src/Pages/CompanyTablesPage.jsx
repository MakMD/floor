import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CompanyTablesPage.module.css";

const CompanyTablesPage = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
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
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
        );
        let fetchedTables = Array.isArray(response.data)
          ? response.data[0]?.invoiceTables || []
          : response.data.invoiceTables || [];

        // Додаємо isHidden, якщо його немає
        const updatedTables = fetchedTables.map((table) => ({
          ...table,
          isHidden: table.isHidden || false,
        }));

        setTables(updatedTables);
        setFilteredTables(updatedTables.reverse()); // Відображаємо у зворотному порядку
      } catch (err) {
        setError("Error fetching tables");
        console.error("Error fetching tables:", err);
      }
    };

    fetchTables();
  }, [companyName]);

  useEffect(() => {
    const filtered = tables
      .filter((table) => (showHidden ? table.isHidden : !table.isHidden))
      .filter(
        (table) =>
          table.invoices.length === 0 ||
          table.invoices.some((invoice) =>
            invoice.address.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    setFilteredTables(filtered);
  }, [searchTerm, tables, showHidden]);

  const handleInputChange = (e) => {
    setNewTable({
      ...newTable,
      [e.target.name]: e.target.value,
    });
  };

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

    try {
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      let currentCompanyData = Array.isArray(response.data)
        ? response.data[0]
        : response.data;

      const companyId = currentCompanyData.id;
      const updatedTables = [
        newTableData,
        ...(currentCompanyData.invoiceTables || []),
      ];

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/${companyId}`,
        { ...currentCompanyData, invoiceTables: updatedTables }
      );

      setTables(updatedTables);
      setFilteredTables(updatedTables);
      setNewTable({ date: "", invoiceNumber: "", billTo: "", payTo: "" });
      setError("");
    } catch (error) {
      setError("Error adding table");
      console.error("Error adding table:", error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.backEditBtnCont}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>
        <input
          type="text"
          placeholder="Search by address"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchField}
        />
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={styles.editButton}
        >
          {isEditing ? "Stop Editing" : "Edit"}
        </button>
      </div>

      <h2 className={styles.pageTitle}>{companyName} - Tables</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* Форма для додавання таблиці (переміщена вверх) */}
      <div className={styles.addTableForm}>
        <h3 className={styles.formTitle}>Add New Table</h3>
        <input
          type="date"
          name="date"
          value={newTable.date}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <input
          type="text"
          name="invoiceNumber"
          value={newTable.invoiceNumber}
          onChange={handleInputChange}
          placeholder="Invoice Number"
          className={styles.inputField}
        />
        <input
          type="text"
          name="billTo"
          value={newTable.billTo}
          onChange={handleInputChange}
          placeholder="Bill To"
          className={styles.inputField}
        />
        <input
          type="text"
          name="payTo"
          value={newTable.payTo}
          onChange={handleInputChange}
          placeholder="Pay To"
          className={styles.inputField}
        />
        <button onClick={handleAddTable} className={styles.addTableButton}>
          Add Table
        </button>
      </div>

      {/* Список таблиць (нові зверху) */}
      <ul className={styles.tableList}>
        {filteredTables.length > 0 ? (
          filteredTables.map((table) => (
            <li
              key={table.tableId}
              className={styles.tableItem}
              onClick={(event) => {
                if (event.target.tagName !== "BUTTON")
                  navigate(`/company/${companyName}/table/${table.tableId}`);
              }}
            >
              <h3 className={styles.tableTitle}>{table.name}</h3>
              <p className={styles.tablePayTo}>
                Pay To: {table.invoiceDetails.payTo}
              </p>
              <p className={styles.tableBillTo}>
                Bill To: {table.invoiceDetails.billTo}
              </p>
              <p className={styles.tableDate}>
                Date: {table.invoiceDetails.date}
              </p>
              {isEditing && (
                <button
                  onClick={() => {
                    const updatedTables = tables.map((t) =>
                      t.tableId === table.tableId ? { ...t, isHidden: true } : t
                    );
                    setTables(updatedTables);
                    setFilteredTables(updatedTables);
                  }}
                  className={styles.hideButton}
                >
                  Hide
                </button>
              )}
            </li>
          ))
        ) : (
          <p className={styles.noTablesMessage}>
            No tables available for this company.
          </p>
        )}
      </ul>

      <button
        onClick={() => setShowHidden(!showHidden)}
        className={styles.showHiddenButton}
      >
        {showHidden ? "Show Active Tables" : "Show Hidden Tables"}
      </button>
    </div>
  );
};

export default CompanyTablesPage;
