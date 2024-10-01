import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./PersonTableDetailsPage.module.css"; // Підключаємо стилі

const PersonTableDetailsPage = () => {
  const { personId, tableId } = useParams();
  const navigate = useNavigate();
  const [personName, setPersonName] = useState(""); // Додаємо стан для імені користувача
  const [table, setTable] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    address: "",
    date: "",
    total_income: 0,
  });
  const [totalWithGST, setTotalWithGST] = useState(null); // Стан для Total with GST
  const [wcb, setWcb] = useState(null); // Стан для WCB
  const [isEditing, setIsEditing] = useState(false); // Стан для перемикання режиму редагування
  const [showGST, setShowGST] = useState(false); // Стан для показу Total + GST
  const [showWCB, setShowWCB] = useState(false); // Стан для показу WCB
  const [isWCBCalculated, setIsWCBCalculated] = useState(false); // Стан для перевірки, чи обчислено WCB
  const [isGSTCalculated, setIsGSTCalculated] = useState(false); // Стан для перевірки, чи обчислено GST
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
        setPersonName(response.data.name); // Встановлюємо ім'я людини
      } catch (error) {
        setError("Error fetching table details");
        console.error("Error fetching table details:", error);
      }
    };

    fetchTableDetails();
  }, [personId, tableId]);

  const handleInvoiceChange = (e, index, field) => {
    const updatedInvoices = [...table.invoices];
    updatedInvoices[index][field] = e.target.value;

    // Перевірка, чи всі поля інвойсу пусті
    const isInvoiceEmpty =
      !updatedInvoices[index].address &&
      !updatedInvoices[index].date &&
      !updatedInvoices[index].total_income;

    if (isInvoiceEmpty) {
      // Видаляємо інвойс, якщо всі поля порожні
      updatedInvoices.splice(index, 1);
    }

    setTable((prevTable) => ({
      ...prevTable,
      invoices: updatedInvoices,
    }));
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

  // Обчислення WCB та Total with GST
  const calculateWCB = () => {
    const newWCB = (totalIncome - (totalIncome / 100) * 3).toFixed(2);
    setWcb(newWCB);
    setShowWCB(true); // Показати поле з WCB
    setIsWCBCalculated(true); // Позначаємо, що WCB вже обчислено

    // Якщо GST вже обчислений, перераховуємо його від Total - WCB
    if (isGSTCalculated) {
      setTotalWithGST((newWCB * 1.05).toFixed(2)); // Додаємо 5% GST до Total - WCB
    }
  };

  const calculateTotalWithGST = () => {
    // Перевіряємо, чи було обчислено WCB, щоб додати GST до Total - WCB або просто Total
    const baseIncome = isWCBCalculated ? wcb : totalIncome;
    setTotalWithGST((baseIncome * 1.05).toFixed(2)); // Додаємо 5% GST до базової суми
    setShowGST(true); // Показати поле з Total + GST
    setIsGSTCalculated(true); // Позначаємо, що GST вже обчислено
  };

  // Функція для друку сторінки
  const handlePrint = () => {
    window.print();
  };

  // Перемикання режиму редагування
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  // Збереження змін на бекенд
  const handleSaveChanges = async () => {
    try {
      const response = await axios.get(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
      );
      const currentPersonData = response.data;

      const updatedTables = currentPersonData.tables.map((tbl) =>
        tbl.tableId === tableId ? { ...tbl, invoices: table.invoices } : tbl
      );

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...currentPersonData, tables: updatedTables }
      );

      console.log("Changes saved successfully");
      setIsEditing(false); // Після збереження вимикаємо режим редагування
    } catch (error) {
      console.error("Error saving changes:", error);
      setError("Failed to save changes.");
    }
  };

  return (
    <div className={styles.tableDetailsContainer}>
      <div className={styles.btnBackPrintCont}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>
        <button onClick={handlePrint} className={styles.printButton}>
          Print
        </button>
        <button
          onClick={isEditing ? handleSaveChanges : toggleEditMode}
          className={styles.editButton}
        >
          {isEditing ? "Save Changes" : "Edit"}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {table ? (
        <>
          <h2 className={styles.personName}>{personName} Details</h2>{" "}
          {/* Виводимо ім'я людини */}
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
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        value={invoice.address}
                        onChange={(e) =>
                          handleInvoiceChange(e, index, "address")
                        }
                        className={styles.inputField}
                      />
                    ) : (
                      invoice.address
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        value={invoice.date}
                        onChange={(e) => handleInvoiceChange(e, index, "date")}
                        className={styles.inputField}
                      />
                    ) : (
                      invoice.date
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        value={invoice.total_income}
                        onChange={(e) =>
                          handleInvoiceChange(e, index, "total_income")
                        }
                        className={styles.inputField}
                      />
                    ) : (
                      invoice.total_income
                    )}
                  </td>
                </tr>
              ))}

              <tr className={styles.totalRow}>
                <td colSpan="2">Total:</td>
                <td>${totalIncome.toFixed(2)}</td>
              </tr>
              {showGST && (
                <tr className={styles.totalRow}>
                  <td colSpan="2">Total with GST:</td>
                  <td>${totalWithGST}</td>
                </tr>
              )}
              {showWCB && (
                <tr className={styles.totalRow}>
                  <td colSpan="2">Total - WCB:</td>
                  <td>${wcb}</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Кнопки для обчислення GST та WCB */}
          <button onClick={calculateTotalWithGST} className={styles.btnGst}>
            +GST
          </button>
          <button onClick={calculateWCB} className={styles.btnWcb}>
            -WCB
          </button>
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
