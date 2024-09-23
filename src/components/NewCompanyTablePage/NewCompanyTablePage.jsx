import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NewInvoiceForm.module.css"; // Стилі для нової компанії

const NewCompanyTablePage = () => {
  const { companyName } = useParams();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [newTable, setNewTable] = useState({
    date: "",
    invoiceNumber: "",
    billTo: "",
    price: "", // Поле для Price
    sfStairs: "", // Поле для SF/Stairs
  });
  const [error, setError] = useState("");

  // Завантаження таблиць з бекенду
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany`
        );
        if (response.data.length > 0) {
          setTables(response.data[0]?.invoiceTables || []);
        } else {
          setError("No data found for this company");
        }
      } catch (err) {
        setError("Error fetching tables");
        console.error("Error fetching tables:", err);
      }
    };

    fetchTables();
  }, [companyName]);

  // Оновлення полів форми
  const handleInputChange = (e) => {
    setNewTable({
      ...newTable,
      [e.target.name]: e.target.value,
    });
  };

  // Додавання нової таблиці
  const handleAddTable = async () => {
    const { date, invoiceNumber, billTo, price, sfStairs } = newTable;
    if (!date || !invoiceNumber || !billTo || !price || !sfStairs) {
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
      },
      price,
      sfStairs,
      invoices: [],
    };

    try {
      const updatedTables = [...tables, newTableData];

      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany`
      );
      const currentCompanyData = response.data[0]; // Якщо є масив, беремо перший елемент

      if (currentCompanyData) {
        await axios.put(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany/${currentCompanyData.id}`,
          { ...currentCompanyData, invoiceTables: updatedTables }
        );
      }

      setTables(updatedTables);
      setNewTable({
        date: "",
        invoiceNumber: "",
        billTo: "",
        price: "",
        sfStairs: "",
      });
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

      <h2>{companyName} - Custom Tables</h2>
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
              <p>Price: {table.price || "Not available"}</p>
              <p>SF/Stairs: {table.sfStairs || "Not available"}</p>
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
        {/* Специфічні поля для нової компанії */}
        <input
          type="text"
          name="price"
          value={newTable.price}
          onChange={handleInputChange}
          placeholder="Price"
          className={styles.inputField}
        />
        <input
          type="text"
          name="sfStairs"
          value={newTable.sfStairs}
          onChange={handleInputChange}
          placeholder="SF/Stairs"
          className={styles.inputField}
        />
        <button onClick={handleAddTable} className={styles.addTableButton}>
          Add Table
        </button>
      </div>
    </div>
  );
};

export default NewCompanyTablePage;
