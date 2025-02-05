// src/components/AddCompanyForm/AddCompanyForm.jsx

import { useState } from "react";
import axios from "axios";

const AddCompanyForm = ({ onCompanyAdded }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyDetails, setCompanyDetails] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newCompany = {
      name: companyName,
      details: companyDetails,
    };

    try {
      // Надсилаємо запит на сервер для додавання нової компанії
      const response = await axios.post(
        "https://66ac12f3f009b9d5c7310a1a.mockapi.io/TemporaryCompanies", // API для додавання нової компанії
        newCompany
      );

      // Оновлюємо список компаній в батьківському компоненті
      onCompanyAdded(response.data);

      // Очищаємо поля форми
      setCompanyName("");
      setCompanyDetails("");
    } catch (error) {
      console.error("Error adding company:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Company Name:</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Company Details:</label>
        <textarea
          value={companyDetails}
          onChange={(e) => setCompanyDetails(e.target.value)}
          required
        />
      </div>
      <button type="submit">Add Company</button>
    </form>
  );
};

export default AddCompanyForm;
