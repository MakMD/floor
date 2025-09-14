// src/Pages/TableDetailsPage.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient"; // <-- ІМПОРТУЄМО SUPABASE
import styles from "./TableDetailsPage.module.css";

const TableDetailsPage = () => {
  const { companyName, tableId } = useParams();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState(null); // Зберігаємо всі дані про компанію
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

  // --- ОНОВЛЕНА ЛОГІКА ЗАВАНТАЖЕННЯ ДАНИХ ---
  const fetchCompanyData = async () => {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("name", companyName)
      .single();

    if (error) {
      console.error("Error fetching company data:", error);
    } else {
      const selectedTable = data.invoiceTables?.find(
        (t) => t.tableId === tableId
      );
      setCompanyData(data);
      setTable(selectedTable);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [companyName, tableId]);

  // --- УНІВЕРСАЛЬНА ФУНКЦІЯ ОНОВЛЕННЯ ---
  const updateCompanyTables = async (updatedTables) => {
    const { error } = await supabase
      .from("companies")
      .update({ invoiceTables: updatedTables })
      .eq("id", companyData.id);

    if (error) {
      console.error("Error updating company tables:", error);
    } else {
      // Оновлюємо локальний стан для миттєвого відображення
      const updatedTable = updatedTables.find((t) => t.tableId === tableId);
      setTable(updatedTable);
      // Також оновлюємо companyData, щоб наступні операції мали актуальні дані
      setCompanyData((prev) => ({ ...prev, invoiceTables: updatedTables }));
    }
  };

  const handleInputChange = (e) => {
    setNewInvoice({ ...newInvoice, [e.target.name]: e.target.value });
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

    const updatedTables = companyData.invoiceTables.map((tbl) =>
      tbl.tableId === tableId
        ? { ...tbl, invoices: [...(tbl.invoices || []), invoiceToAdd] }
        : tbl
    );

    await updateCompanyTables(updatedTables);
    setNewInvoice({ date: "", workOrder: "", address: "", total: 0 });
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
    }
    setTable({ ...table, invoices: updatedInvoices });
  };

  const handleInvoiceBlur = async (index) => {
    const updatedInvoices = [...table.invoices];
    const invoice = updatedInvoices[index];

    if (!invoice) return; // Якщо інвойс був видалений

    const { gst, totalWithGst } = calculateGSTAndTotal(invoice.total);
    updatedInvoices[index].GSTCollected = gst;
    updatedInvoices[index].payablePerWorkOrder = totalWithGst;

    const updatedTables = companyData.invoiceTables.map((tbl) =>
      tbl.tableId === tableId ? { ...tbl, invoices: updatedInvoices } : tbl
    );
    await updateCompanyTables(updatedTables);
  };

  const calculateTotal = () => {
    if (!table || !table.invoices) return { total: 0, gst: 0, totalWithGst: 0 };
    return table.invoices.reduce(
      (acc, inv) => ({
        total: acc.total + parseFloat(inv.total || 0),
        gst: acc.gst + parseFloat(inv.GSTCollected || 0),
        totalWithGst:
          acc.totalWithGst + parseFloat(inv.payablePerWorkOrder || 0),
      }),
      { total: 0, gst: 0, totalWithGst: 0 }
    );
  };

  const totals = calculateTotal();
  const toggleEditMode = () => setIsEditing((prev) => !prev);
  const handlePrint = () => window.print();

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
        {table ? (
          <>
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

            <div className={styles.header}>
              <h1>FLOORING BOSS LTD.</h1>
              <p>422 ALLARD BLVD SW, EDMONTON, ALBERTA, T6W3S7</p>
              <p>
                Contact Mykhailo: (587) 937 7862 | Contact Myroslav: (825) 461
                1950
              </p>
              <p>
                Email:{" "}
                {companyName === "NewEraFloorGalleryLTD"
                  ? "flooring.boss1@gmail.com"
                  : "Flooringm8pservice@gmail.com"}
              </p>
              <p>GST: 704201813 RT 0001 | WCB: 9839473</p>
            </div>

            <div className={styles.invoiceHeader}>
              <h2>Invoice Number: {table.invoiceDetails.invoiceNumber}</h2>
              <p>Pay to: {table.invoiceDetails.payTo}</p>
              <p>Date: {table.invoiceDetails.date}</p>
              <p>Bill To: {table.invoiceDetails.billTo}</p>
            </div>

            <table className={styles.invoiceTable}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Work Order</th>
                  <th>Address</th>
                  <th>Total</th>
                  <th>GST (5%)</th>
                  <th>Total with GST</th>
                </tr>
              </thead>
              <tbody>
                {table.invoices
                  .slice()
                  .reverse()
                  .map((invoice, index) => (
                    <tr key={index}>
                      <td>{table.invoices.length - index}</td>
                      <td>
                        {isEditing ? (
                          <input
                            type="date"
                            value={invoice.date}
                            onChange={(e) =>
                              handleInvoiceFieldChange(
                                e,
                                table.invoices.length - 1 - index,
                                "date"
                              )
                            }
                            onBlur={() =>
                              handleInvoiceBlur(
                                table.invoices.length - 1 - index
                              )
                            }
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
                              handleInvoiceFieldChange(
                                e,
                                table.invoices.length - 1 - index,
                                "workOrder"
                              )
                            }
                            onBlur={() =>
                              handleInvoiceBlur(
                                table.invoices.length - 1 - index
                              )
                            }
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
                              handleInvoiceFieldChange(
                                e,
                                table.invoices.length - 1 - index,
                                "address"
                              )
                            }
                            onBlur={() =>
                              handleInvoiceBlur(
                                table.invoices.length - 1 - index
                              )
                            }
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
                              handleInvoiceFieldChange(
                                e,
                                table.invoices.length - 1 - index,
                                "total"
                              )
                            }
                            onBlur={() =>
                              handleInvoiceBlur(
                                table.invoices.length - 1 - index
                              )
                            }
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
                  <td colSpan="4">Total</td>
                  <td>{totals.total.toFixed(2)}</td>
                  <td>{totals.gst.toFixed(2)}</td>
                  <td>{totals.totalWithGst.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default TableDetailsPage;
