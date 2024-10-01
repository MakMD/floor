import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./CompanyTablesPage.module.css";

const CompanyTablesPage = () => {
  const { companyName } = useParams();
  const navigate = useNavigate(); // Для навігації назад
  const [tables, setTables] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // Для пошукового запиту
  const [filteredTables, setFilteredTables] = useState([]); // Для зберігання відфільтрованих таблиць
  const [newTable, setNewTable] = useState({
    date: "",
    invoiceNumber: "",
    billTo: "",
    payTo: "",
  });
  const [isEditing, setIsEditing] = useState(false); // Стан для редагування
  const [showHidden, setShowHidden] = useState(false); // Стан для показу прихованих таблиць
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
        );
        let fetchedTables = [];

        if (Array.isArray(response.data)) {
          fetchedTables = response.data[0]?.invoiceTables || [];
        } else {
          fetchedTables = response.data.invoiceTables || [];
        }

        // Ініціалізуємо isHidden для кожної таблиці
        const updatedTables = fetchedTables.map((table) => ({
          ...table,
          isHidden: table.isHidden || false, // Якщо isHidden не визначено, робимо його false
        }));

        setTables(updatedTables);
        setFilteredTables(updatedTables);
      } catch (err) {
        setError("Error fetching tables");
        console.error("Error fetching tables:", err);
      }
    };

    fetchTables();
  }, [companyName]);

  // Оновлюємо фільтровані таблиці на основі пошукового запиту
  useEffect(() => {
    const filtered = tables.filter((table) =>
      table.invoices.some((invoice) =>
        invoice.address.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredTables(filtered);
  }, [searchTerm, tables]);

  const handleInputChange = (e) => {
    setNewTable({
      ...newTable,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value); // Оновлюємо пошуковий запит
  };

  const handleAddTable = async () => {
    const { date, invoiceNumber, billTo, payTo } = newTable;
    if (!date || !invoiceNumber || !billTo || !payTo) {
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
        date,
        invoiceNumber,
        billTo,
        payTo,
      },
      invoices: [],
      isHidden: false, // Новий прапорець для приховування
    };

    try {
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      const currentCompanyData = response.data[0];

      const companyId = currentCompanyData.id;

      const updatedTables = [
        ...(currentCompanyData.invoiceTables || []),
        newTableData,
      ];

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/${companyId}`,
        { ...currentCompanyData, invoiceTables: updatedTables }
      );

      setTables(updatedTables);
      setFilteredTables(updatedTables);
      setNewTable({ date: "", invoiceNumber: "", billTo: "", payTo: "" });
    } catch (error) {
      setError("Error adding table");
      console.error("Error adding table:", error);
    }
  };

  const handleTableClick = (tableId, event) => {
    if (event.target.tagName === "BUTTON") {
      return;
    }
    navigate(`/company/${companyName}/table/${tableId}`);
  };

  const handleHideTable = async (tableId) => {
    const updatedTables = tables.map((table) =>
      table.tableId === tableId ? { ...table, isHidden: true } : table
    );

    const response = await axios.get(
      `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
    );
    const currentCompanyData = response.data[0];
    const companyId = currentCompanyData.id;

    await axios.put(
      `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/${companyId}`,
      { ...currentCompanyData, invoiceTables: updatedTables }
    );

    setTables(updatedTables);
    setFilteredTables(updatedTables);
  };

  const toggleHiddenTables = () => {
    setShowHidden((prev) => !prev);
  };

  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Кнопка "Назад" */}
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>

      <h2 className={styles.pageTitle}>{companyName} - Tables</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* Поле для пошуку за адресою */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by address"
          value={searchTerm}
          onChange={handleSearchInput}
          className={styles.searchField}
        />
      </div>

      <ul className={styles.tableList}>
        {filteredTables.length > 0 ? (
          filteredTables
            .filter((table) => table.isHidden === showHidden) // Фільтруємо за станом isHidden
            .map((table) => (
              <li
                key={table.tableId}
                className={styles.tableItem}
                onClick={(event) => handleTableClick(table.tableId, event)}
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
                    onClick={() => handleHideTable(table.tableId)}
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

      <button onClick={toggleEditMode} className={styles.editButton}>
        {isEditing ? "Stop Editing" : "Edit"}
      </button>

      {/* Форма для додавання нової таблиці */}
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

      <button onClick={toggleHiddenTables} className={styles.showHiddenButton}>
        {showHidden ? "Show Active Tables" : "Show Hidden Tables"}
      </button>
    </div>
  );
};

export default CompanyTablesPage;
