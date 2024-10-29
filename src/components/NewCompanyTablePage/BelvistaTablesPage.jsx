import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NewCompanyTablePage.module.css"; // Стилі для сторінки

const BelvistaHomesTablesPage = () => {
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
  const [isEditing, setIsEditing] = useState(false); // Режим редагування
  const [showHidden, setShowHidden] = useState(false); // Показ прихованих таблиць
  const navigate = useNavigate(); // Використовуємо useNavigate для навігації

  // Завантаження таблиць після завантаження сторінки
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          "https://66ac12f3f009b9d5c7310a1a.mockapi.io/BelvistaHomesLTD"
        );
        if (response.data.length > 0) {
          const fetchedTables = response.data[0]?.invoiceTables || [];

          // Фільтруємо таблиці за умовою showHidden
          const filtered = fetchedTables.filter((table) =>
            showHidden ? table.isHidden : !table.isHidden
          );

          setTables(fetchedTables);
          setFilteredTables(filtered); // Оновлюємо відфільтровані таблиці
        } else {
          setError("No data found for this company.");
        }
      } catch (error) {
        setError("Error fetching tables.");
        console.error("Error fetching tables:", error);
      }
    };

    fetchTables();
  }, [showHidden]); // Залежність від showHidden

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

  // Кліком по таблиці перенаправляємо на деталі таблиці
  const handleTableClick = (tableId) => {
    navigate(`/company/BelvistaHomesLTD/table/${tableId}`);
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
      isHidden: false, // Додаємо поле для приховування таблиць
    };

    try {
      // Отримуємо поточні дані компанії
      const response = await axios.get(
        "https://66ac12f3f009b9d5c7310a1a.mockapi.io/BelvistaHomesLTD"
      );
      const currentCompanyData = response.data[0];

      // Оновлюємо таблиці компанії
      if (currentCompanyData) {
        await axios.put(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/BelvistaHomesLTD/${currentCompanyData.id}`,
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

  // Функція для приховування таблиці
  const handleHideTable = async (tableId, e) => {
    e.stopPropagation(); // Зупиняємо вспливання події, щоб не активувалось відкриття таблиці

    const updatedTables = tables.map((table) =>
      table.tableId === tableId ? { ...table, isHidden: true } : table
    );
    setTables(updatedTables);
    setFilteredTables(updatedTables.filter((table) => !table.isHidden));

    try {
      // Отримуємо поточні дані компанії з сервера
      const response = await axios.get(
        "https://66ac12f3f009b9d5c7310a1a.mockapi.io/BelvistaHomesLTD"
      );
      const currentCompanyData = response.data[0];

      // Оновлюємо таблиці на сервері
      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/BelvistaHomesLTD/${currentCompanyData.id}`,
        {
          ...currentCompanyData,
          invoiceTables: updatedTables, // Відправляємо оновлені таблиці із прапорцем isHidden
        }
      );
    } catch (error) {
      console.error("Error hiding table:", error);
    }
  };

  // Перемикання режиму редагування
  const toggleEditMode = () => {
    setIsEditing((prev) => !prev);
  };

  // Перемикання між активними та прихованими таблицями
  const toggleHiddenTables = () => {
    setShowHidden((prev) => !prev);
  };

  return (
    <div className={styles.pageContainer}>
      {/* Кнопка "Назад" */}
      {/* <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>


      <button onClick={toggleEditMode} className={styles.editButton}>
        {isEditing ? "Stop Editing" : "Edit"}
      </button> */}
      <div className={styles.backEditBtnCont}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>

        {/* <div className={styles.searchContainer}></div> */}
        <button onClick={toggleEditMode} className={styles.editButton}>
          {isEditing ? "Stop Editing" : "Edit"}
        </button>
      </div>
      <h2 className={styles.pageTitle}>Tables for Belvista Homes</h2>
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
              {isEditing && (
                <button
                  className={styles.hideButton}
                  onClick={(e) => handleHideTable(table.tableId, e)} // Використовуємо stopPropagation
                >
                  Hide
                </button>
              )}
            </li>
          ))
        ) : (
          <p className={styles.noTablesMessage}>No tables available.</p>
        )}
      </ul>

      {/* Кнопка для переходу в режим редагування */}
      <button onClick={toggleEditMode} className={styles.editButton}>
        {isEditing ? "Stop Editing" : "Edit"}
      </button>

      {/* Кнопка для показу прихованих таблиць */}
      <button onClick={toggleHiddenTables} className={styles.showHiddenButton}>
        {showHidden ? "Show Active Tables" : "Show Hidden Tables"}
      </button>

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

export default BelvistaHomesTablesPage;
