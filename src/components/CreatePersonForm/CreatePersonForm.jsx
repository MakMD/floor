import { useState } from "react";
import axios from "axios";
import styles from "./CreatePersonForm.module.css";

const CreatePersonForm = ({ onPersonCreated }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleCreatePerson = async () => {
    if (name.trim() === "") {
      setError("Name cannot be empty");
      return;
    }

    try {
      // Створюємо нову людину з порожнім масивом таблиць
      const newPerson = {
        name,
        tables: [], // Порожній масив таблиць при створенні нової людини
      };

      const response = await axios.post(
        "https://66e3d74dd2405277ed1201b1.mockapi.io/people",
        newPerson
      );

      onPersonCreated(response.data); // Передаємо нову людину в батьківський компонент
      setName("");
      setError("");
    } catch (error) {
      console.error("Error creating person:", error);
      setError("Failed to create person");
    }
  };

  return (
    <div className={styles.createPersonForm}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter person name"
        className={styles.inputField}
      />
      <button
        onClick={handleCreatePerson}
        className={styles.createPersonButton}
      >
        Create Person
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default CreatePersonForm;
