// src/components/AddCompanyForm/AddCompanyForm.jsx

import { useState } from "react";
import { supabase } from "../../supabaseClient"; // ІМПОРТ: Замінюємо axios на supabase
import toast from "react-hot-toast"; // ІМПОРТ: Додаємо toast для сповіщень

// КОМПОНЕНТ: Перейменовано для ясності, що він створює, а не просто додає
const CreateCompanyForm = ({ onCompanyCreated }) => {
  const [companyName, setCompanyName] = useState("");
  const [companyDetails, setCompanyDetails] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName.trim()) {
      toast.error("Company name cannot be empty.");
      return;
    }

    setLoading(true);

    const newCompany = {
      name: companyName.trim(),
      details: companyDetails.trim(),
      status: "active", // Явно вказуємо статус за замовчуванням
      invoiceTables: [], // Ініціалізуємо порожнім масивом
    };

    try {
      // ЗАПИТ: Використовуємо supabase для вставки даних
      const { data, error } = await supabase
        .from("companies")
        .insert([newCompany])
        .select()
        .single(); // .select().single() одразу повертає створений об'єкт

      if (error) {
        throw error;
      }

      // Оновлюємо стан у батьківському компоненті
      onCompanyCreated(data);
      toast.success("Company created successfully!");

      // Очищуємо поля форми
      setCompanyName("");
      setCompanyDetails("");
    } catch (error) {
      console.error("Error adding company:", error);
      toast.error(error.message || "Failed to add company.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // ФОРМА: Додано disabled стани для полів під час завантаження
    <form onSubmit={handleSubmit}>
      <div>
        <label>Company Name:</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          disabled={loading}
          required
        />
      </div>
      <div>
        <label>Company Details:</label>
        <textarea
          value={companyDetails}
          onChange={(e) => setCompanyDetails(e.target.value)}
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading}>
        {loading ? "Adding..." : "Add Company"}
      </button>
    </form>
  );
};

export default CreateCompanyForm;
