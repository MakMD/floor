import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CompanyTablesPage.module.css";

const CompanyTablesPage = () => {
  const { companyName } = useParams();
  const navigate = useNavigate(); // Для навігації назад
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({
    date: "",
    invoiceNumber: "",
    billTo: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
        );
        setTables(response.data[0]?.invoiceTables || []);
      } catch (err) {
        setError("Error fetching tables");
        console.error("Error fetching tables:", err);
      }
    };

    fetchTables();
  }, [companyName]);

  const handleInputChange = (e) => {
    setNewTable({
      ...newTable,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddTable = async () => {
    const { date, invoiceNumber, billTo } = newTable;
    if (!date || !invoiceNumber || !billTo) {
      setError("All fields are required");
      return;
    }

    const newTableData = {
      tableId: Date.now().toString(),
      name: `Invoices for ${new Date(date).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      })}`,
      invoiceDetails: {
        date: newTable.date,
        invoiceNumber: newTable.invoiceNumber,
        billTo: newTable.billTo,
      },
      invoices: [],
    };

    try {
      const updatedTables = [...tables, newTableData];

      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      const currentCompanyData = response.data[0];

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/1`,
        { ...currentCompanyData, invoiceTables: updatedTables }
      );

      setTables(updatedTables);
      setNewTable({ date: "", invoiceNumber: "", billTo: "" });
    } catch (error) {
      setError("Error adding table");
      console.error("Error adding table:", error);
    }
  };

  const handleTableClick = (tableId) => {
    navigate(`/company/${companyName}/table/${tableId}`);
  };

  return (
    <div className={styles.companyTablesPage}>
      {/* Кнопка "Назад" */}
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>

      <h2>{companyName} - Tables</h2>
      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.tableList}>
        {tables.length > 0 ? (
          tables.map((table) => (
            <li
              key={table.tableId}
              className={styles.tableItem}
              onClick={() => handleTableClick(table.tableId)}
            >
              <h3>{table.name}</h3>
              <p>Date: {table.invoiceDetails.date}</p>
              <p>Bill To: {table.invoiceDetails.billTo}</p>
            </li>
          ))
        ) : (
          <p>No tables available for this company.</p>
        )}
      </ul>

      <div className={styles.addTableForm}>
        <h3>Add New Table</h3>
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
        <button onClick={handleAddTable} className={styles.addTableButton}>
          Add Table
        </button>
      </div>
    </div>
  );
};

export default CompanyTablesPage;
