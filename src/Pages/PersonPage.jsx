import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Додаємо useNavigate
import axios from "axios";
import styles from "./PersonPage.module.css";

const PersonPage = () => {
  const { personId } = useParams();
  const [person, setPerson] = useState(null);
  const [newTableName, setNewTableName] = useState(""); // Для нової таблиці
  const [selectedTable, setSelectedTable] = useState(null); // Для вибраної таблиці
  const [newInvoice, setNewInvoice] = useState({
    address: "",
    date: "",
    total_income: 0,
  }); // Для додавання інвойсу
  const navigate = useNavigate(); // Ініціалізуємо useNavigate

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const response = await axios.get(
          `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
        );
        setPerson(response.data);
      } catch (error) {
        console.error("Error fetching person:", error);
      }
    };

    fetchPerson();
  }, [personId]);

  const handleAddTable = async () => {
    if (!newTableName.trim()) return; // Перевіряємо, чи введене ім'я таблиці

    try {
      const newTable = {
        name: newTableName,
        invoices: [], // Порожній масив інвойсів для нової таблиці
      };

      const updatedTables = [...person.tables, newTable]; // Додаємо нову таблицю

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...person, tables: updatedTables }
      );

      setPerson({ ...person, tables: updatedTables }); // Оновлюємо стан
      setNewTableName(""); // Очищаємо поле вводу
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  const handleAddInvoice = async () => {
    if (!selectedTable) return;

    try {
      const newInvoiceData = { ...newInvoice };

      // Оновлюємо список інвойсів локально
      const updatedInvoices = [...selectedTable.invoices, newInvoiceData]; // Додаємо інвойс до вибраної таблиці

      // Оновлюємо локальний стан таблиць та інвойсів
      const updatedTables = person.tables.map((table) =>
        table.name === selectedTable.name
          ? { ...table, invoices: updatedInvoices }
          : table
      );

      // Оновлюємо стан одразу після додавання
      setSelectedTable({ ...selectedTable, invoices: updatedInvoices });
      setPerson({ ...person, tables: updatedTables });

      // Відправляємо запит на сервер для оновлення даних
      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...person, tables: updatedTables }
      );

      // Очищаємо форму
      setNewInvoice({
        address: "",
        date: "",
        total_income: 0,
      });
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  const handleInvoiceChange = (e) => {
    setNewInvoice({ ...newInvoice, [e.target.name]: e.target.value });
  };

  return (
    <div className={styles.personPage}>
      {person ? (
        <>
          <h2>{person.name} Tables</h2>

          {/* Кнопка "Назад" */}
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>

          {/* Форма для додавання нової таблиці */}
          <div className={styles.addTableForm}>
            <input
              type="text"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              placeholder="Enter new table name"
              className={styles.inputField}
            />
            <button onClick={handleAddTable} className={styles.addTableButton}>
              Add Table
            </button>
          </div>

          {/* Список таблиць */}
          {person.tables && person.tables.length > 0 ? (
            <ul className={styles.tableList}>
              {person.tables.map((table, index) => (
                <li
                  key={index}
                  className={styles.tableItem}
                  onClick={() => setSelectedTable(table)}
                >
                  {table.name}
                </li>
              ))}
            </ul>
          ) : (
            <p>No tables available. Add a new table above.</p>
          )}

          {/* Вибрана таблиця і інвойси */}
          {selectedTable && (
            <div>
              <h3>Invoices for {selectedTable.name}</h3>
              {selectedTable.invoices.length > 0 ? (
                <ul className={styles.invoiceList}>
                  {selectedTable.invoices.map((invoice, index) => (
                    <li key={index} className={styles.invoiceItem}>
                      <p>
                        <strong>Address:</strong> {invoice.address}
                      </p>
                      <p>
                        <strong>Date:</strong> {invoice.date}
                      </p>
                      <p>
                        <strong>Total Income:</strong> ${invoice.total_income}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No invoices available for this table.</p>
              )}

              {/* Форма для додавання нового інвойсу */}
              <div className={styles.addInvoiceForm}>
                <h3>Add New Invoice to {selectedTable.name}</h3>
                <input
                  type="text"
                  name="address"
                  value={newInvoice.address}
                  onChange={handleInvoiceChange}
                  placeholder="Address"
                  className={styles.inputField}
                />
                <input
                  type="date"
                  name="date"
                  value={newInvoice.date}
                  onChange={handleInvoiceChange}
                  placeholder="Date"
                  className={styles.inputField}
                />
                <input
                  type="number"
                  name="total_income"
                  value={newInvoice.total_income}
                  onChange={handleInvoiceChange}
                  placeholder="Total Income"
                  className={styles.inputField}
                />
                <button
                  onClick={handleAddInvoice}
                  className={styles.addInvoiceButton}
                >
                  Add Invoice
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default PersonPage;
