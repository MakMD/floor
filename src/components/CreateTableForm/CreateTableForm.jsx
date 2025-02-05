import { useState } from "react";
import axios from "axios";

const CreateTableForm = () => {
  const [tableName, setTableName] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://66ac12f3f009b9d5c7310a1a.mockapi.io/tables", {
        tables: { [tableName]: [] },
      });
      setMessage(`Table ${tableName} created successfully`);
      setTableName("");
    } catch (error) {
      setMessage("Failed to create table");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create New Table</h2>
      <input
        type="text"
        value={tableName}
        onChange={(e) => setTableName(e.target.value)}
        placeholder="Enter table name"
      />
      <button type="submit">Create Table</button>
      {message && <p>{message}</p>}
    </form>
  );
};

export default CreateTableForm;
