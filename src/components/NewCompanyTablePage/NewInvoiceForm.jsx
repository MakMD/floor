import { useState } from "react";
import axios from "axios";
import styles from "./NewInvoiceForm.module.css";

const NewInvoiceForm = ({ tableId, companyName, onInvoiceAdded }) => {
  const [newInvoice, setNewInvoice] = useState({
    date: "",
    address: "",
    total: "",
    price: "", // Додаємо поле price
    sfStairs: "", // Додаємо поле SF/Stairs
  });

  const handleInputChange = (e) => {
    setNewInvoice({
      ...newInvoice,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddInvoice = async () => {
    const { date, address, total, price, sfStairs } = newInvoice;
    if (!date || !address || !total || !price || !sfStairs) {
      alert("Please fill in all fields");
      return;
    }

    const newInvoiceData = {
      date,
      address,
      total,
      price,
      sfStairs,
    };

    try {
      const response = await axios.get(
        `https://your-backend-api.com/${companyName}`
      );
      const currentCompanyData = response.data[0];

      const tableIndex = currentCompanyData.invoiceTables.findIndex(
        (table) => table.tableId === tableId
      );

      const updatedInvoices = [
        ...currentCompanyData.invoiceTables[tableIndex].invoices,
        newInvoiceData,
      ];

      currentCompanyData.invoiceTables[tableIndex].invoices = updatedInvoices;

      await axios.put(
        `https://your-backend-api.com/${companyName}/1`,
        currentCompanyData
      );

      onInvoiceAdded(newInvoiceData); // Оновлюємо інвойси на сторінці
      setNewInvoice({
        date: "",
        address: "",
        total: "",
        price: "",
        sfStairs: "",
      });
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  return (
    <div className={styles.newInvoiceForm}>
      <h3>Add New Invoice</h3>
      <input
        type="date"
        name="date"
        value={newInvoice.date}
        onChange={handleInputChange}
        className={styles.inputField}
      />
      <input
        type="text"
        name="address"
        value={newInvoice.address}
        onChange={handleInputChange}
        placeholder="Address"
        className={styles.inputField}
      />
      <input
        type="number"
        name="total"
        value={newInvoice.total}
        onChange={handleInputChange}
        placeholder="Total"
        className={styles.inputField}
      />
      <input
        type="text"
        name="price"
        value={newInvoice.price}
        onChange={handleInputChange}
        placeholder="Price"
        className={styles.inputField}
      />
      <input
        type="text"
        name="sfStairs"
        value={newInvoice.sfStairs}
        onChange={handleInputChange}
        placeholder="SF/Stairs"
        className={styles.inputField}
      />
      <button onClick={handleAddInvoice} className={styles.addInvoiceButton}>
        Add Invoice
      </button>
    </div>
  );
};

export default NewInvoiceForm;
