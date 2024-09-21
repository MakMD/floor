import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./PersonTableDetailsPage.module.css"; // Підключаємо стилі

const PersonTableDetailsPage = () => {
  const { personId, tableId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
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

  return (
    <div className={styles.tableDetailsContainer}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {table ? (
        <>
          <h2 className={styles.tableTitle}>{table.name} Details</h2>

          {/* Таблиця інвойсів */}
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
                  <td>${invoice.total_income}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className={styles.loading}>Loading table details...</p>
      )}
    </div>
  );
};

export default PersonTableDetailsPage;
