import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./PersonTableDetailsPage.module.css"; // Підключаємо стилі

const PersonTableDetailsPage = () => {
  const { personId, tableId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    address: "",
    date: "",
    total_income: 0,
  });
  const [totalWithGST, setTotalWithGST] = useState(0); // Додаємо стан для Total with GST
  const [adjustedTotal, setAdjustedTotal] = useState(0); // Стан для відкоригованого Total з WCB
  const [wcb, setWcb] = useState(""); // Додаємо стан для WCB
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchTableDetails = async () => {
      try {
        const response = await axios.get(
          `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
        );
        const selectedTable = response.data.tables.find(
          (table) => table.tableId === tableId
        );
        setTable(selectedTable);
      } catch (error) {
        setError("Error fetching table details");
        console.error("Error fetching table details:", error);
      }
    };

    fetchTableDetails();
  }, [personId, tableId]);

  const handleInvoiceChange = (e) => {
    setNewInvoice({ ...newInvoice, [e.target.name]: e.target.value });
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.address || !newInvoice.date || !newInvoice.total_income) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const updatedInvoices = [...table.invoices, newInvoice];

      const response = await axios.get(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
      );
      const currentPersonData = response.data;

      const updatedTables = currentPersonData.tables.map((tbl) =>
        tbl.tableId === tableId ? { ...tbl, invoices: updatedInvoices } : tbl
      );

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...currentPersonData, tables: updatedTables }
      );

      setTable((prevTable) => ({
        ...prevTable,
        invoices: updatedInvoices,
      }));

      setNewInvoice({ address: "", date: "", total_income: 0 });
    } catch (error) {
      console.error("Error adding invoice:", error);
      setError("Failed to add invoice.");
    }
  };

  // Підрахунок загальної суми total_income
  const totalIncome = table?.invoices.reduce(
    (acc, invoice) => acc + parseFloat(invoice.total_income || 0),
    0
  );

  // Додавання функціоналу для обчислення Total with GST
  const handleAddGST = () => {
    setTotalWithGST(totalIncome + totalIncome * 0.05); // Додаємо 5% GST
  };

  // Віднімання WCB від Total
  const handleSubtractWCB = () => {
    setAdjustedTotal(totalIncome - parseFloat(wcb)); // Віднімаємо WCB від Total
  };

  return (
    <div className={styles.tableDetailsContainer}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {table ? (
        <>
          <h2>{table.name} Details</h2>
          {/* Стилізована таблиця інвойсів */}
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th>Address</th>
                <th>Date</th>
                <th>Total Income</th>
              </tr>
            </thead>
            <tbody>
              {table.invoices.map((invoice, index) => (
                <tr key={index}>
                  <td>{invoice.address}</td>
                  <td>{invoice.date}</td>
                  <td>{invoice.total_income}</td>
                </tr>
              ))}
              {/* Рядок з підсумковою сумою */}
              <tr className={styles.totalRow}>
                <td colSpan="2">Total:</td>
                <td>${totalIncome.toFixed(2)}</td>
              </tr>
              <tr className={styles.totalRow}>
                <td colSpan="2">Total with GST:</td>
                <td>${totalWithGST.toFixed(2)}</td>
              </tr>
              <tr className={styles.totalRow}>
                <td colSpan="2">Total - WCB (-WCB):</td>
                <td>${adjustedTotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Кнопка для додавання GST */}
          <button onClick={handleAddGST}>+GST</button>

          {/* Поле та кнопка для введення WCB */}
          <input
            type="number"
            placeholder="Enter WCB"
            value={wcb}
            onChange={(e) => setWcb(e.target.value)}
            className={styles.inputField}
          />
          <button onClick={handleSubtractWCB}>-WCB</button>

          {/* Форма для додавання нового інвойсу */}
          <div className={styles.addInvoiceForm}>
            <h3>Add New Invoice</h3>
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
        </>
      ) : (
        <p>Loading table details...</p>
      )}
    </div>
  );
};

export default PersonTableDetailsPage;
