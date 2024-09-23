import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./NewCompanyTableDetails.module.css"; // Стилі для деталей таблиці

const NewCompanyTableDetails = () => {
  const { companyName, tableId } = useParams(); // Отримуємо companyName і tableId з URL
  const [table, setTable] = useState(null); // Зберігаємо дані конкретної таблиці
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Додали useNavigate для кнопки "Назад"

  useEffect(() => {
    const fetchTableDetails = async () => {
      try {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany/${tableId}`
        );
        if (response.data) {
          setTable(response.data);
        } else {
          setError("No table data found");
        }
      } catch (err) {
        setError("Error fetching table details");
        console.error("Error fetching table details:", err);
      }
    };

    fetchTableDetails();
  }, [companyName, tableId]);

  return (
    <div className={styles.tableDetailsPage}>
      {/* Кнопка "Назад" */}
      <button onClick={() => navigate(-1)} className={styles.backButton}>
        Back
      </button>

      {error && <p className={styles.error}>{error}</p>}

      {table ? (
        <>
          <h2>
            Table Details for Invoice #
            {table.invoiceDetails?.invoiceNumber || "N/A"}
          </h2>
          <p>Date: {table.invoiceDetails?.date || "N/A"}</p>
          <p>Bill To: {table.invoiceDetails?.billTo || "N/A"}</p>
          <p>Price: {table.price || "Not available"}</p>
          <p>SF/Stairs: {table.sfStairs || "Not available"}</p>
          <h3>Invoices:</h3>
          <ul>
            {table.invoices && table.invoices.length > 0 ? (
              table.invoices.map((invoice) => (
                <li key={invoice.id}>
                  <p>Date: {invoice.date}</p>
                  <p>Address: {invoice.address}</p>
                  <p>Total: {invoice.total}</p>
                  <p>GST Collected: {invoice.GSTCollected}</p>
                  <p>Payable: {invoice.payablePerWorkOrder}</p>
                </li>
              ))
            ) : (
              <p>No invoices available</p>
            )}
          </ul>
        </>
      ) : (
        <p>Loading table details...</p>
      )}
    </div>
  );
};

export default NewCompanyTableDetails;
