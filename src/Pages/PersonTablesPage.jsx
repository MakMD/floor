import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./PersonTablesPage.module.css"; // Підключаємо стилі

const PersonTablesPage = () => {
  const { personId } = useParams(); // Отримуємо ID людини з URL
  const [person, setPerson] = useState(null); // Стан для зберігання даних людини
  const [newTable, setNewTable] = useState(""); // Для нової таблиці
  const navigate = useNavigate(); // Для навігації назад

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const response = await axios.get(
          `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
        );
        setPerson(response.data); // Зберігаємо дані про людину
      } catch (error) {
        console.error("Error fetching person data:", error);
      }
    };

    fetchPerson();
  }, [personId]);

  const handleAddTable = async () => {
    if (!newTable) return;

    try {
      const updatedPerson = {
        ...person,
        tables: [...person.tables, { name: newTable, invoices: [] }],
      };

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        updatedPerson
      );

      setPerson(updatedPerson); // Оновлюємо стан
      setNewTable(""); // Очищаємо поле вводу
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  return (
    <div className={styles.personTablesPage}>
      {/* Кнопка "Назад" */}
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        Back
      </button>

      {person ? (
        <>
          <h2>{person.name} Tables</h2>
          <ul>
            {person.tables.length > 0 ? (
              person.tables.map((table, index) => (
                <li key={index}>
                  <h3>{table.name}</h3>
                  <ul>
                    {table.invoices.map((invoice, idx) => (
                      <li key={idx}>
                        <p>Invoice: {invoice.name}</p>
                      </li>
                    ))}
                  </ul>
                </li>
              ))
            ) : (
              <p>No tables available for this person.</p>
            )}
          </ul>

          {/* Форма для додавання нової таблиці */}
          <div className={styles.addTableForm}>
            <input
              type="text"
              value={newTable}
              onChange={(e) => setNewTable(e.target.value)}
              placeholder="New Table Name"
            />
            <button onClick={handleAddTable}>Add Table</button>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default PersonTablesPage;
