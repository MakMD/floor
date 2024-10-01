import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import styles from "./TableDetailsPage.module.css";

const TableDetailsPage = () => {
  const { companyName, tableId } = useParams();
  const navigate = useNavigate();
  const [table, setTable] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    date: "",
    workOrder: "",
    address: "",
    total: 0,
  });

  const calculateGSTAndTotal = (total) => {
    if (!total) return { gst: "0.00", totalWithGst: "0.00" };
    const gst = (total * 0.05).toFixed(2);
    const totalWithGst = (parseFloat(total) + parseFloat(gst)).toFixed(2);
    return { gst, totalWithGst };
  };

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
      return;
    }

    const { gst, totalWithGst } = calculateGSTAndTotal(newInvoice.total);

    const invoiceToAdd = {
      ...newInvoice,
      GSTCollected: gst,
      payablePerWorkOrder: totalWithGst,
    };

    try {
      const updatedInvoices = [...table.invoices, invoiceToAdd];
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      const currentCompanyData = response.data[0];

      const updatedTables = currentCompanyData.invoiceTables.map((tbl) =>
        tbl.tableId === table.tableId
          ? { ...tbl, invoices: updatedInvoices }
          : tbl
      );

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/1`,
        { ...currentCompanyData, invoiceTables: updatedTables }
      );

      setTable((prevTable) => ({
        ...prevTable,
        invoices: updatedInvoices,
      }));

      setNewInvoice({ date: "", workOrder: "", address: "", total: 0 });
    } catch (error) {
      console.error("Error adding invoice:", error);
    }
  };

  const handleInvoiceFieldChange = (e, index, field) => {
    const updatedInvoices = [...table.invoices];
    updatedInvoices[index][field] = e.target.value;

    const isInvoiceEmpty =
      !updatedInvoices[index].date &&
      !updatedInvoices[index].workOrder &&
      !updatedInvoices[index].address &&
      !updatedInvoices[index].total;

    if (isInvoiceEmpty) {
      updatedInvoices.splice(index, 1);
      handleDeleteInvoice(index);
    }

    setTable({ ...table, invoices: updatedInvoices });
  };

  const handleDeleteInvoice = async (invoiceIndex) => {
    try {
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      const currentCompanyData = response.data[0];

      const updatedTables = currentCompanyData.invoiceTables.map((tbl) => {
        if (tbl.tableId === table.tableId) {
          const updatedInvoices = tbl.invoices.filter(
            (invoice, idx) => idx !== invoiceIndex
          );
          return { ...tbl, invoices: updatedInvoices };
        }
        return tbl;
      });

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/1`,
        { ...currentCompanyData, invoiceTables: updatedTables }
      );

      console.log("Invoice deleted successfully");
    } catch (error) {
      console.error("Error deleting invoice:", error);
    }
  };

  const handleInvoiceBlur = async (index, field) => {
    const updatedInvoices = [...table.invoices];

    if (field === "total") {
      const { gst, totalWithGst } = calculateGSTAndTotal(
        updatedInvoices[index].total
      );
      updatedInvoices[index].GSTCollected = gst;
      updatedInvoices[index].payablePerWorkOrder = totalWithGst;
    }

    setTable({ ...table, invoices: updatedInvoices });

    try {
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}`
      );
      const currentCompanyData = response.data[0];

      const updatedTables = currentCompanyData.invoiceTables.map((tbl) =>
        tbl.tableId === table.tableId
          ? { ...tbl, invoices: updatedInvoices }
          : tbl
      );

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${companyName}/1`,
        { ...currentCompanyData, invoiceTables: updatedTables }
      );

      console.log("Invoice updated successfully");
    } catch (error) {
      console.error("Error updating invoice:", error);
    }
  };

  const calculateTotal = () => {
    if (!table || !table.invoices.length)
      return { total: 0, gst: 0, totalWithGst: 0 };
    return table.invoices.reduce(
      (acc, invoice) => {
        const total = parseFloat(invoice.total || 0);
        const gst = parseFloat(invoice.GSTCollected || 0);
        const totalWithGst = parseFloat(invoice.payablePerWorkOrder || 0);

        return {
          total: acc.total + total,
          gst: acc.gst + gst,
          totalWithGst: acc.totalWithGst + totalWithGst,
        };
      },
      { total: 0, gst: 0, totalWithGst: 0 }
    );
  };

  const totals = calculateTotal();

  const toggleEditMode = () => {
    setIsEditing((prevIsEditing) => !prevIsEditing);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.invoicePage}>
      <div className={styles.btnBackPrintCont}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>
        <button onClick={handlePrint} className={styles.printButton}>
          Print
        </button>
        <button onClick={toggleEditMode} className={styles.editButton}>
          {isEditing ? "Save Changes" : "Edit Invoices"}
        </button>
      </div>

      <div className={styles.document}>
        <div className={styles.header}>
          <h1>FLOORING BOSS LTD.</h1>
          <p>422 ALLARD BLVD SW, EDMONTON, ALBERTA, T6W3S7</p>
          <p>
            Contact Mykhailo: (587) 937 7862 | Contact Miroslav: (825) 461 1950
          </p>
          <p>Email: Flooringm8pservice@gmail.com</p>
          <p>GST: 704201813 RT 0001 | WCB: 9839473</p>
        </div>

        {table ? (
          <>
            <div className={styles.invoiceHeader}>
              <h2>Invoice Number: {table.invoiceDetails.invoiceNumber}</h2>
              <p>Pay to: {table.invoiceDetails.payTo}</p>
              <p>Date: {table.invoiceDetails.date}</p>
              <p>Bill To: {table.invoiceDetails.billTo}</p>
            </div>

            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Work Order</th>
                  <th>Address</th>
                  <th>Total</th>
                  <th>GST (5%)</th>
                  <th>Total with GST</th>
                </tr>
              </thead>
              <tbody>
                {table.invoices.map((invoice, index) => (
                  <tr key={index}>
                    <td>
                      {isEditing ? (
                        <input
                          type="date"
                          value={invoice.date}
                          onChange={(e) =>
                            handleInvoiceFieldChange(e, index, "date")
                          }
                          onBlur={() => handleInvoiceBlur(index, "date")}
                        />
                      ) : (
                        invoice.date
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={invoice.workOrder}
                          onChange={(e) =>
                            handleInvoiceFieldChange(e, index, "workOrder")
                          }
                          onBlur={() => handleInvoiceBlur(index, "workOrder")}
                        />
                      ) : (
                        invoice.workOrder
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={invoice.address}
                          onChange={(e) =>
                            handleInvoiceFieldChange(e, index, "address")
                          }
                          onBlur={() => handleInvoiceBlur(index, "address")}
                        />
                      ) : (
                        invoice.address
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="number"
                          value={invoice.total}
                          onChange={(e) =>
                            handleInvoiceFieldChange(e, index, "total")
                          }
                          onBlur={() => handleInvoiceBlur(index, "total")}
                        />
                      ) : (
                        invoice.total
                      )}
                    </td>
                    <td>{invoice.GSTCollected}</td>
                    <td>{invoice.payablePerWorkOrder}</td>
                  </tr>
                ))}
                <tr className={styles.totalRow}>
                  <td colSpan="3">Total</td>
                  <td>{totals.total.toFixed(2)}</td>
                  <td>{totals.gst.toFixed(2)}</td>
                  <td>{totals.totalWithGst.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>

            <hr className={styles.divider} />

            {/* Форма додавання нового інвойсу */}
            <div className={styles.addInvoiceForm}>
              <h3>Add New Invoice</h3>
              <input
                type="date"
                name="date"
                value={newInvoice.date}
                onChange={handleInputChange}
                placeholder="Date"
                className={styles.inputField}
              />
              <input
                type="text"
                name="workOrder"
                value={newInvoice.workOrder}
                onChange={handleInputChange}
                placeholder="Work Order"
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
              <button
                onClick={handleAddInvoice}
                className={styles.addInvoiceButton}
              >
                Add Invoice
              </button>
            </div>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default TableDetailsPage;
