import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./PersonPage.module.css";

const PersonPage = () => {
  const { personId } = useParams();
  const [person, setPerson] = useState(null);
  const [newTableName, setNewTableName] = useState(""); // Для нової таблиці
  const [searchTerm, setSearchTerm] = useState(""); // Для пошукового запиту
  const [filteredTables, setFilteredTables] = useState([]); // Для фільтрованих таблиць
  const [isEditing, setIsEditing] = useState(false); // Стан для режиму редагування
  const navigate = useNavigate(); // Ініціалізуємо useNavigate

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        const response = await axios.get(
          `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
        );
        setPerson(response.data);
        setFilteredTables(response.data.tables || []); // Ініціалізуємо відфільтровані таблиці
      } catch (error) {
        console.error("Error fetching person:", error);
      }
    };

    fetchPerson();
  }, [personId]);

  useEffect(() => {
    if (person && person.tables) {
      const filtered = person.tables.filter((table) => {
        if (table.invoices.length > 0) {
          return table.invoices.some((invoice) =>
            invoice.address.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return true;
      });
      setFilteredTables(filtered);
    }
  }, [searchTerm, person]);

  const handleAddTable = async () => {
    if (!newTableName.trim()) return;

    try {
      const newTable = {
        tableId: Date.now().toString(),
        name: newTableName,
        invoices: [],
      };

      const updatedTables = [...(person.tables || []), newTable];

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...person, tables: updatedTables }
      );

      setPerson({ ...person, tables: updatedTables });
      setNewTableName(""); // Очищаємо поле вводу
    } catch (error) {
      console.error("Error adding table:", error);
    }
  };

  const handleDeleteTable = async (tableId) => {
    try {
      const updatedTables = person.tables.filter(
        (table) => table.tableId !== tableId
      );

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...person, tables: updatedTables }
      );

      setPerson({ ...person, tables: updatedTables });
      setFilteredTables(updatedTables);
    } catch (error) {
      console.error("Error deleting table:", error);
    }
  };

  const handleTableClick = (tableId) => {
    navigate(`/person/${personId}/tables/${tableId}`);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing); // Перемикаємо режим редагування
  };

  return (
    <div className={styles.personPage}>
      {person ? (
        <>
          <h2 className={styles.pageTitle}>{person.name} Tables</h2>
          <div className={styles.contBtnBackEdit}>
            {/* Кнопка "Назад" */}
            <button className={styles.backButton} onClick={() => navigate(-1)}>
              Back
            </button>
            <div className={styles.searchContainer}>
              <input
                type="text"
                placeholder="Search by address"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            {/* Кнопка "Редагувати" */}
            <button className={styles.editButton} onClick={toggleEditMode}>
              {isEditing ? "Save" : "Edit"}
            </button>
          </div>

          {/* Поле для пошуку за адресою */}
          {/* <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search by address"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div> */}

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
          {filteredTables && filteredTables.length > 0 ? (
            <ul className={styles.tableList}>
              {filteredTables.map((table, index) => (
                <li key={index} className={styles.tableItem}>
                  <span
                    className={styles.tableName}
                    onClick={() => handleTableClick(table.tableId)}
                  >
                    {table.name}
                  </span>

                  {/* Кнопка для видалення таблиці показується тільки в режимі редагування */}
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteTable(table.tableId)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.noTables}>
              No tables available for this person.
            </p>
          )}
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default PersonPage;
