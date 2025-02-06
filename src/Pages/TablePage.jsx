import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import InvoiceList from "../components/InvoiceList/InvoiceList";
import styles from "./TablePage.module.css"; // Підключення як styles

const TablePage = () => {
  const { tableName } = useParams();
  const [invoices, setInvoices] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    date: "",
    workOrder: "",
    address: "",
    incomeWithoutGst: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await axios.get(
          "https://66ac12f3f009b9d5c7310a1a.mockapi.io/tables"
        );
        const tableData = response.data.find((tableObj) =>
          Object.keys(tableObj.tables).includes(tableName)
        );
        if (tableData) {
          setInvoices(tableData.tables[tableName] || []);
        }
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    };

    fetchInvoices();
  }, [tableName]);

  const handleInputChange = (e) => {
    setNewInvoice({
      ...newInvoice,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddInvoice = async () => {
    const gst = (newInvoice.incomeWithoutGst * 0.05).toFixed(2);
    const incomeWithGst = (
      parseFloat(newInvoice.incomeWithoutGst) + parseFloat(gst)
    ).toFixed(2);

    const invoiceToAdd = {
      ...newInvoice,
      GST: gst,
      incomeWithGst: incomeWithGst,
    };

    try {
      const response = await axios.get(
        "https://66ac12f3f009b9d5c7310a1a.mockapi.io/tables"
      );
      const tableData = response.data.find((tableObj) =>
        Object.keys(tableObj.tables).includes(tableName)
      );

      if (tableData) {
        const updatedInvoices = [...tableData.tables[tableName], invoiceToAdd];

        await axios.put(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/tables/${tableData.id}`,
          {
            tables: {
              ...tableData.tables,
              [tableName]: updatedInvoices,
            },
          }
        );

        setInvoices(updatedInvoices);
        setNewInvoice({
          date: "",
          workOrder: "",
          address: "",
          incomeWithoutGst: "",
        });
      }
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  return (
    <div className={styles.tablePage}>
      <h2 className={styles.pageTitle}>Invoices for {tableName}</h2>

      <button onClick={() => navigate("/")} className={styles.buttonBack}>
        Back to Tables
      </button>

      <InvoiceList data={invoices} />

      <div className={styles.addInvoiceForm}>
        <input
          type="text"
          name="date"
          placeholder="Date"
          value={newInvoice.date}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <input
          type="text"
          name="workOrder"
          placeholder="Work Order"
          value={newInvoice.workOrder}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <input
          type="text"
          name="address"
          placeholder="Address"
          value={newInvoice.address}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <input
          type="number"
          name="incomeWithoutGst"
          placeholder="Income Without GST"
          value={newInvoice.incomeWithoutGst}
          onChange={handleInputChange}
          className={styles.inputField}
        />
        <button onClick={handleAddInvoice} className={styles.addInvoiceButton}>
          Add Invoice
        </button>
      </div>
    </div>
  );
};

export default TablePage;
