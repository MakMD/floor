import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import styles from "./PersonPage.module.css";

const PersonPage = () => {
  const { personId } = useParams();
  const [person, setPerson] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null); // Додаємо стан для вибраної таблиці
  const [newInvoice, setNewInvoice] = useState({
    address: "",
    date: "",
    total_income: 0,
  });

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

  const handleTableClick = (table) => {
    setSelectedTable(table); // Встановлюємо вибрану таблицю
  };

  const handleAddInvoice = async () => {
    if (!selectedTable) return; // Якщо немає вибраної таблиці, не додаємо інвойс

    try {
      const updatedInvoices = [...selectedTable.invoices, newInvoice];
      const updatedTables = person.tables.map((table) =>
        table.name === selectedTable.name
          ? { ...table, invoices: updatedInvoices }
          : table
      );

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...person, tables: updatedTables }
      );

      setPerson({ ...person, tables: updatedTables });
      setNewInvoice({ address: "", date: "", total_income: 0 });
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
          <h2>{person.name}'s Tables</h2>

          {/* Відображаємо список таблиць */}
          <ul className={styles.tableList}>
            {person.tables.map((table, index) => (
              <li
                key={index}
                className={styles.tableItem}
                onClick={() => handleTableClick(table)}
              >
                {table.name}
              </li>
            ))}
          </ul>

          {/* Відображаємо вибрану таблицю */}
          {selectedTable && (
            <div>
              <h3>Invoices for {selectedTable.name}</h3>
              <ul className={styles.invoiceList}>
                {selectedTable.invoices.length > 0 ? (
                  selectedTable.invoices.map((invoice, index) => (
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
                  ))
                ) : (
                  <p>No invoices available for this table</p>
                )}
              </ul>

              {/* Форма для додавання нового інвойсу */}
              <div className={styles.addInvoiceForm}>
                <h3>Add New Invoice to {selectedTable.name}</h3>
                <input
                  type="text"
                  name="address"
                  value={newInvoice.address}
                  onChange={handleInvoiceChange}
                  placeholder="Address"
                />
                <input
                  type="date"
                  name="date"
                  value={newInvoice.date}
                  onChange={handleInvoiceChange}
                  placeholder="Date"
                />
                <input
                  type="number"
                  name="total_income"
                  value={newInvoice.total_income}
                  onChange={handleInvoiceChange}
                  placeholder="Total Income"
                />
                <button onClick={handleAddInvoice}>Add Invoice</button>
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
