import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Додаємо useNavigate
import axios from "axios";
import styles from "./PersonPage.module.css"; // Оновлення імпорту стилів

const PersonPage = () => {
  const { personId } = useParams();
  const [person, setPerson] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    address: "",
    date: "",
    total_income: 0,
  });
  const navigate = useNavigate(); // Ініціалізуємо useNavigate для навігації назад

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

  const handleAddInvoice = async () => {
    try {
      const updatedInvoices = [...person.invoices, newInvoice];
      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...person, invoices: updatedInvoices }
      );
      setPerson({ ...person, invoices: updatedInvoices });
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
          <h2>{person.name} Invoices</h2>

          {/* Кнопка "Назад" */}
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>

          <ul className={styles.invoiceList}>
            {person.invoices && person.invoices.length > 0 ? (
              person.invoices.map((invoice, index) => (
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
              <li>No invoices available</li>
            )}
          </ul>

          <div className={styles.addInvoiceForm}>
            <h3>Add New Invoice</h3>
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
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default PersonPage;
