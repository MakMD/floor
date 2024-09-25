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
    payTo: "", // Додаємо поле "payTo"
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
        );
        if (Array.isArray(response.data)) {
          setTables(response.data[0]?.invoiceTables || []); // Якщо це масив
          setFilteredTables(response.data[0]?.invoiceTables || []);
        } else {
          setTables(response.data.invoiceTables || []); // Якщо це об'єкт
          setFilteredTables(response.data.invoiceTables || []);
        }
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

  // Обробник для введення пошукового запиту
  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value); // Оновлюємо пошуковий запит
  };

  const handleAddTable = async () => {
    const { date, invoiceNumber, billTo, payTo } = newTable; // Додаємо "payTo"
    if (!date || !invoiceNumber || !billTo || !payTo) {
      // Перевірка на наявність "payTo"
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
        payTo, // Додаємо "payTo"
      },
      invoices: [],
    };

    try {
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      const currentCompanyData = response.data[0]; // Отримуємо перший елемент масиву

      const companyId = currentCompanyData.id; // Використовуємо правильний ID

      // Оновлюємо масив таблиць
      const updatedTables = [
        ...(currentCompanyData.invoiceTables || []),
        newTableData,
      ];

      // Оновлюємо дані на сервері
      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/${companyId}`,
        { ...currentCompanyData, invoiceTables: updatedTables }
      );
      console.log("New table data:", newTableData);
      console.log("Updated tables:", updatedTables); // Перевірка оновлених таблиць

      // Оновлюємо стан таблиць
      setTables(updatedTables);
      setNewTable({ date: "", invoiceNumber: "", billTo: "", payTo: "" }); // Очищення полів форми
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

      {/* Поле для пошуку за адресою */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by address"
          value={searchTerm}
          onChange={handleSearchInput}
          className={styles.searchInput}
        />
      </div>

      <ul className={styles.tableList}>
        {filteredTables.length > 0 ? (
          filteredTables.map((table) => (
            <li
              key={table.tableId}
              className={styles.tableItem}
              onClick={() => handleTableClick(table.tableId)}
            >
              <h3>{table.name}</h3>
              <p>Pay To: {table.invoiceDetails.payTo}</p>
              {/* Відображення "Pay To" */}
              <p>Bill To: {table.invoiceDetails.billTo}</p>
              <p>Date: {table.invoiceDetails.date}</p>
            </li>
          ))
        ) : (
          <p>No tables available for this company.</p>
        )}
      </ul>

      {/* Форма для додавання нової таблиці */}
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
        <input
          type="text"
          name="payTo" // Поле для "payTo"
          value={newTable.payTo}
          onChange={handleInputChange}
          placeholder="Pay To"
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
