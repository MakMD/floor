import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./PersonTablesPage.module.css"; // Підключаємо стилі

const PersonTablesPage = () => {
  const { personId } = useParams(); // Отримуємо ID людини з URL
  const navigate = useNavigate(); // Для навігації на нову сторінку
  const [person, setPerson] = useState(null); // Данні про людину
  const [error, setError] = useState(""); // Для помилок

  useEffect(() => {
    const fetchPersonTables = async () => {
      try {
        const response = await axios.get(
          `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
        );
        setPerson(response.data); // Оновлюємо стан людини та її таблиць
      } catch (error) {
        setError("Error fetching tables");
        console.error("Error fetching person tables:", error);
      }
    };

    fetchPersonTables();
  }, [personId]);

  const handleTableClick = (tableId) => {
    console.log("Table clicked with ID: ", tableId); // Лог для перевірки
    navigate(`/person/${personId}/table/${tableId}`);
  };

  return (
    <div className={styles.tablesContainer}>
      <h2 className={styles.pageTitle}>
        {person ? `${person.name}'s Tables` : "Loading..."}
      </h2>

      {/* Кнопка "Назад" */}
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>

      {/* Виведення таблиць */}
      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.tablesList}>
        {person && person.tables.length > 0 ? (
          person.tables.map((table) => (
            <li
              key={table.tableId} // Використовуємо унікальний tableId як ключ
              className={styles.tableItem}
              onClick={() => handleTableClick(table.tableId)} // Використовуємо tableId для навігації
            >
              <h3>{table.name}</h3>
              <p className={styles.tableInfo}>Created on: {table.createdAt}</p>
            </li>
          ))
        ) : (
          <p>No tables available for this person.</p>
        )}
      </ul>
    </div>
  );
};

export default PersonTablesPage;
