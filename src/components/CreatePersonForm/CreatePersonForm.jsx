import { useState } from "react";
import axios from "axios";
import "./CreatePersonForm.module.css"; // Імпорт стилів

const CreatePersonForm = ({ onPersonCreated }) => {
  const [personName, setPersonName] = useState("");

  const handleCreatePerson = async () => {
    if (!personName) return;

    try {
      const response = await axios.post(
        "https://66e3d74dd2405277ed1201b1.mockapi.io/people",
        { name: personName }
      );
      onPersonCreated(response.data); // Оновлюємо список людей
      setPersonName(""); // Очищення поля
    } catch (error) {
      console.error("Error creating person:", error);
    }
  };

  return (
    <div className="form-container">
      <input
        type="text"
        value={personName}
        onChange={(e) => setPersonName(e.target.value)}
        placeholder="Enter person's name"
      />
      <button onClick={handleCreatePerson}>Create Person</button>
    </div>
  );
};

export default CreatePersonForm;
