import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import styles from "./InvoicePage.module.css";

const InvoicePage = () => {
  const { companyName, tableId } = useParams();
  const [table, setTable] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    date: "",
    workOrder: "",
    address: "",
    total: 0,
  });

  useEffect(() => {
    const fetchTable = async () => {
      try {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
        );
        const selectedTable = response.data[0]?.invoiceTables.find(
          (table) => table.tableId === tableId
        );
        setTable(selectedTable);
      } catch (error) {
        console.error("Error fetching table:", error);
      }
    };

    fetchTable();
  }, [companyName, tableId]);

  const handleInputChange = (e) => {
    setNewInvoice({
      ...newInvoice,
      [e.target.name]: e.target.value,
    });
  };

  const handleAddInvoice = async () => {
    if (
      !newInvoice.date ||
      !newInvoice.workOrder ||
      !newInvoice.address ||
      !newInvoice.total
    ) {
      alert("All fields are required");
      return;
    }

    const updatedInvoices = [...table.invoices, newInvoice];

    try {
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      const currentCompanyData = response.data[0];

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/1`,
        {
          ...currentCompanyData,
          invoiceTables: currentCompanyData.invoiceTables.map((tbl) =>
            tbl.tableId === tableId
              ? { ...tbl, invoices: updatedInvoices }
              : tbl
          ),
        }
      );

      setTable((prevTable) => ({
        ...prevTable,
        invoices: updatedInvoices,
      }));

      setNewInvoice({
        date: "",
        workOrder: "",
        address: "",
        total: 0,
      });
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  return (
    <div className={styles.invoicePage}>
      {table ? (
        <>
          <h2>Invoices for {table.name}</h2>
          <ul>
            {table.invoices.map((invoice, index) => (
              <li key={index}>
                <p>Work Order: {invoice.workOrder}</p>
                <p>Address: {invoice.address}</p>
                <p>Total: {invoice.total}</p>
              </li>
            ))}
          </ul>

          <div className={styles.addInvoiceForm}>
            <h3>Add New Invoice</h3>
            <input
              type="date"
              name="date"
              value={newInvoice.date}
              onChange={handleInputChange}
              placeholder="Date"
            />
            <input
              type="text"
              name="workOrder"
              value={newInvoice.workOrder}
              onChange={handleInputChange}
              placeholder="Work Order"
            />
            <input
              type="text"
              name="address"
              value={newInvoice.address}
              onChange={handleInputChange}
              placeholder="Address"
            />
            <input
              type="number"
              name="total"
              value={newInvoice.total}
              onChange={handleInputChange}
              placeholder="Total"
            />
            <button onClick={handleAddInvoice}>Add Invoice</button>
          </div>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default InvoicePage;
