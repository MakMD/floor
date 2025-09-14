// src/components/CreatePersonForm/CreatePersonForm.jsx

import { useState } from "react";
import { supabase } from "../../supabaseClient"; // <-- ІМПОРТУЄМО SUPABASE
import styles from "./CreatePersonForm.module.css";

const CreatePersonForm = ({ onPersonCreated }) => {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Додаємо стан завантаження

  const handleCreatePerson = async () => {
    if (name.trim() === "") {
      setError("Name cannot be empty");
      return;
    }

    setLoading(true);
    setError("");

    // Готуємо об'єкт для вставки в Supabase
    const newPersonData = {
      name: name.trim(),
      status: "active", // За замовчуванням всі нові працівники активні
      tables: [], // Порожній масив таблиць
    };

    // Виконуємо запит до Supabase
    const { data, error: insertError } = await supabase
      .from("people")
      .insert([newPersonData])
      .select(); // .select() повертає щойно створений запис

    if (insertError) {
      console.error("Error creating person:", insertError);
      setError("Failed to create person. " + insertError.message);
    } else {
      // Передаємо створений об'єкт (data[0]) у батьківський компонент
      onPersonCreated(data[0]);
      setName(""); // Очищуємо поле
    }

    setLoading(false);
  };

  return (
    <div className={styles.createPersonForm}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter person name"
        className={styles.inputField}
        disabled={loading} // Блокуємо поле під час запиту
      />
      <button
        onClick={handleCreatePerson}
        className={styles.createPersonButton}
        disabled={loading} // Блокуємо кнопку під час запиту
      >
        {loading ? "Creating..." : "Create Person"}
      </button>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default CreatePersonForm;
