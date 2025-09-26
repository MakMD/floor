// src/components/CreateCompanyForm/CreateCompanyForm.jsx
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import styles from "./CreateCompanyForm.module.css";
import { FaPlus } from "react-icons/fa";

const CreateCompanyForm = ({ onCompanyCreated }) => {
  const [companyName, setCompanyName] = useState("");
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
      status: "active",
    };

    const { data, error } = await supabase
      .from("companies")
      .insert([newCompany])
      .select()
      .single();

    if (error) {
      toast.error(error.message || "Failed to add company.");
    } else {
      onCompanyCreated(data);
      toast.success("Company created successfully!");
      setCompanyName("");
    }
    setLoading(false);
  };

  return (
    <div className={styles.formSection}>
      <h3>Create New Company</h3>
      <form className={styles.form} onSubmit={handleSubmit}>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="New company name..."
          className={styles.inputField}
          disabled={loading}
        />
        <button type="submit" className={styles.addButton} disabled={loading}>
          <FaPlus /> {loading ? "Creating..." : "Add Company"}
        </button>
      </form>
    </div>
  );
};

export default CreateCompanyForm;
