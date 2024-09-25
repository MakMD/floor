import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NewCompanyTablePage.module.css";

const NewCompanyTablesPage = () => {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]); // Для відображення таблиць після фільтрації
  const [searchQuery, setSearchQuery] = useState(""); // Для зберігання пошукового запиту
  const [error, setError] = useState("");
  const [newTable, setNewTable] = useState({
    date: "",
    invoiceNumber: "",
    billTo: "",
    payTo: "",
  });
  const navigate = useNavigate(); // Використовуємо useNavigate для навігації

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          "https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany"
        );
        if (response.data.length > 0) {
          setTables(response.data[0]?.invoiceTables || []);
          setFilteredTables(response.data[0]?.invoiceTables || []); // Ініціалізуємо відфільтровані таблиці
        } else {
          setError("No data found for this company.");
        }
      } catch (error) {
        setError("Error fetching tables.");
        console.error("Error fetching tables:", error);
      }
    };

    fetchTables();
  }, []);

  // Пошук за адресою
  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = tables.filter((table) =>
      table.invoices.some((invoice) =>
        invoice.address.toLowerCase().includes(query)
      )
    );
    setFilteredTables(filtered);
  };

  const handleTableClick = (tableId) => {
    // Перенаправляємо на шлях з tableId
    navigate(`/company/newcompany/table/${tableId}`);
  };

  // Функція для обробки змін у формі
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTable((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Функція для додавання нової таблиці
  const handleAddTable = async () => {
    if (
      !newTable.date ||
      !newTable.invoiceNumber ||
      !newTable.billTo ||
      !newTable.payTo
    ) {
      alert("Please fill out all fields.");
      return;
    }

    const newTableData = {
      tableId: Date.now().toString(),
      invoiceDetails: {
        date: newTable.date,
        invoiceNumber: newTable.invoiceNumber,
        billTo: newTable.billTo,
        payTo: newTable.payTo,
      },
      invoices: [],
    };

    try {
      // Отримуємо поточні дані компанії
      const response = await axios.get(
        "https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany"
      );
      const currentCompanyData = response.data[0];

      // Оновлюємо таблиці компанії
      if (currentCompanyData) {
        await axios.put(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany/${currentCompanyData.id}`,
          {
            ...currentCompanyData,
            invoiceTables: [...currentCompanyData.invoiceTables, newTableData],
          }
        );
        setTables((prev) => [...prev, newTableData]); // Додаємо нову таблицю до списку
        setFilteredTables((prev) => [...prev, newTableData]); // Оновлюємо відфільтровані таблиці
        setNewTable({ date: "", invoiceNumber: "", billTo: "", payTo: "" }); // Очищуємо форму
      }
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Кнопка "Назад" */}
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>

      <h2 className={styles.pageTitle}>Tables for New Company</h2>
      {error && <p className={styles.errorMessage}>{error}</p>}

      {/* Поле для пошуку за адресою */}
      <input
        type="text"
        placeholder="Search by address"
        value={searchQuery}
        onChange={handleSearch}
        className={styles.searchField}
      />

      <ul className={styles.tableList}>
        {filteredTables.length > 0 ? (
          filteredTables.map((table) => (
            <li
              key={table.tableId}
              className={styles.tableItem}
              onClick={() => handleTableClick(table.tableId)} // При натисканні перенаправляємо
            >
              <h3 className={styles.tableTitle}>
                {table.invoiceDetails.invoiceNumber}
              </h3>
              <p className={styles.tableDate}>
                Date: {table.invoiceDetails.date}
              </p>
              <p className={styles.tableBillTo}>
                Bill To: {table.invoiceDetails.billTo}
              </p>
              <p className={styles.tablePayTo}>
                Pay To: {table.invoiceDetails.payTo}
              </p>
            </li>
          ))
        ) : (
          <p className={styles.noTablesMessage}>No tables available.</p>
        )}
      </ul>

      {/* Форма для додавання нової таблиці */}
      <div className={styles.addTableForm}>
        <h3 className={styles.formTitle}>Add New Table</h3>
        <input
          type="date"
          name="date"
          value={newTable.date}
          onChange={handleInputChange}
          placeholder="Date"
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
    </div>
  );
};

export default NewCompanyTablesPage;
