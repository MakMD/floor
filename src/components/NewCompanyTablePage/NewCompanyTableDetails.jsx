// src/components/NewCompanyTablePage/NewCompanyTableDetails.jsx

import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient"; // ІМПОРТ: Замінюємо axios на supabase
import toast from "react-hot-toast"; // ІМПОРТ: Додаємо toast для сповіщень
import styles from "./NewCompanyTableDetails.module.css";

const NewCompanyTableDetails = () => {
  const { companyId, tableId } = useParams(); // Оновлено: отримуємо companyId
  const [tableDetails, setTableDetails] = useState(null);
  const [company, setCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const [newInvoice, setNewInvoice] = useState({
    date: "",
    address: "",
    price: 0,
    "sf/stairs": 0, // Зберігаємо оригінальний ключ
  });

  const [totals, setTotals] = useState({
    totalSum: 0,
    gstSum: 0,
    totalWithGstSum: 0,
  });

  const fetchTableDetails = async () => {
    try {
      const { data: companyData, error } = await supabase
        .from("companies")
        .select("*")
        .eq("id", companyId) // Використовуємо ID для надійного пошуку
        .single();

      if (error) throw error;

      if (companyData) {
        const tableData = companyData.invoiceTables.find(
          (table) => table.tableId === tableId
        );
        if (tableData) {
          setCompany(companyData);
          setTableDetails(tableData);
          calculateTotals(tableData.invoices);
        } else {
          toast.error("Table not found");
          navigate(-1); // Повертаємо користувача, якщо таблиці немає
        }
      } else {
        toast.error("Company not found");
        navigate(-1);
      }
    } catch (error) {
      console.error("Error fetching table details:", error);
      toast.error(error.message || "Error fetching table details");
    }
  };

  useEffect(() => {
    fetchTableDetails();
  }, [companyId, tableId]);

  const calculateTotals = (invoices) => {
    const totalSum = invoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.total || 0),
      0
    );
    const gstSum = invoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.GSTCollected || 0),
      0
    );
    const totalWithGstSum = invoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.totalWithGst || 0),
      0
    );

    setTotals({
      totalSum: totalSum.toFixed(2),
      gstSum: gstSum.toFixed(2),
      totalWithGstSum: totalWithGstSum.toFixed(2),
    });
  };

  const updateInvoicesOnServer = async (updatedInvoices) => {
    const updatedInvoiceTables = company.invoiceTables.map((table) =>
      table.tableId === tableId
        ? { ...table, invoices: updatedInvoices }
        : table
    );

    const { error } = await supabase
      .from("companies")
      .update({ invoiceTables: updatedInvoiceTables })
      .eq("id", company.id);

    if (error) {
      toast.error("Failed to update invoices.");
      console.error("Error updating invoices:", error);
      return false;
    }

    // Оновлюємо локальний стан, щоб уникнути повторного запиту
    const updatedCompany = { ...company, invoiceTables: updatedInvoiceTables };
    setCompany(updatedCompany);
    setTableDetails(
      updatedCompany.invoiceTables.find((t) => t.tableId === tableId)
    );
    calculateTotals(updatedInvoices);

    return true;
  };

  const handleFieldChange = (e, index, field) => {
    const updatedInvoices = [...tableDetails.invoices];
    let value = e.target.value;
    updatedInvoices[index][field] = value;

    if (field === "price" || field === "sf/stairs") {
      const price = parseFloat(updatedInvoices[index].price || 0);
      const sfStairs = parseFloat(updatedInvoices[index]["sf/stairs"] || 0);
      const total = price * sfStairs;
      const gst = total * 0.05;
      const totalWithGst = total + gst;

      updatedInvoices[index].total = total.toFixed(2);
      updatedInvoices[index].GSTCollected = gst.toFixed(2);
      updatedInvoices[index].totalWithGst = totalWithGst.toFixed(2);
    }

    setTableDetails((prev) => ({ ...prev, invoices: updatedInvoices }));
  };

  const handleSaveChanges = async () => {
    const finalInvoices = tableDetails.invoices.filter(
      (invoice) =>
        invoice.date || invoice.address || invoice.price || invoice["sf/stairs"]
    );

    const success = await updateInvoicesOnServer(finalInvoices);
    if (success) {
      toast.success("Changes saved!");
      setIsEditing(false);
    }
  };

  const handleAddInvoice = async () => {
    if (
      !newInvoice.date ||
      !newInvoice.address ||
      !newInvoice.price ||
      !newInvoice["sf/stairs"]
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    const price = parseFloat(newInvoice.price);
    const sfStairs = parseFloat(newInvoice["sf/stairs"]);
    const total = price * sfStairs;
    const gst = total * 0.05;
    const totalWithGst = total + gst;

    const newInvoiceData = {
      ...newInvoice,
      total: total.toFixed(2),
      GSTCollected: gst.toFixed(2),
      totalWithGst: totalWithGst.toFixed(2),
    };

    const updatedInvoices = [...tableDetails.invoices, newInvoiceData];
    const success = await updateInvoicesOnServer(updatedInvoices);

    if (success) {
      toast.success("Invoice added successfully!");
      setNewInvoice({ date: "", address: "", price: 0, "sf/stairs": 0 });
    }
  };

  if (!tableDetails) {
    return <p>Loading...</p>;
  }

  // Рендеринг JSX залишається практично без змін, окрім обробників подій
  // ... (решта JSX коду)
  return (
    <div className={styles.invoicePage}>
      {/* ... Кнопки ... */}
      <div className={styles.buttonContainer}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>
        <button className={styles.printButton} onClick={() => window.print()}>
          Print
        </button>
        <button
          className={styles.editButton}
          onClick={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
        >
          {isEditing ? "Save Changes" : "Edit Invoices"}
        </button>
      </div>

      <div className={styles.document}>
        {/* ... Інформація про компанію та інвойс ... */}
        <table className={styles.invoiceTable}>
          {/* ... Заголовки таблиці ... */}
          <tbody>
            {tableDetails.invoices.map((invoice, index) => (
              <tr key={index}>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={invoice.date}
                      onChange={(e) => handleFieldChange(e, index, "date")}
                    />
                  ) : (
                    invoice.date
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={invoice.address}
                      onChange={(e) => handleFieldChange(e, index, "address")}
                    />
                  ) : (
                    invoice.address
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={invoice.price}
                      onChange={(e) => handleFieldChange(e, index, "price")}
                    />
                  ) : (
                    invoice.price
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={invoice["sf/stairs"]}
                      onChange={(e) => handleFieldChange(e, index, "sf/stairs")}
                    />
                  ) : (
                    invoice["sf/stairs"]
                  )}
                </td>
                <td>{invoice.total}</td>
                <td>{invoice.GSTCollected}</td>
                <td>{invoice.totalWithGst}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan="4" className={styles.totalLabel}>
                Total
              </td>
              <td>{totals.totalSum}</td>
              <td>{totals.gstSum}</td>
              <td>{totals.totalWithGstSum}</td>
            </tr>
          </tfoot>
        </table>

        <div className={styles.formContainer}>
          <h3>Add New Invoice</h3>
          <input
            type="date"
            name="date"
            value={newInvoice.date}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, date: e.target.value })
            }
            placeholder="Date"
            className={styles.inputField}
          />
          <input
            type="text"
            name="address"
            value={newInvoice.address}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, address: e.target.value })
            }
            placeholder="Address"
            className={styles.inputField}
          />
          <input
            type="number"
            name="price"
            value={newInvoice.price}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, price: e.target.value })
            }
            placeholder="Price"
            className={styles.inputField}
          />
          <input
            type="number"
            name="sfStairs"
            value={newInvoice["sf/stairs"]}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, "sf/stairs": e.target.value })
            }
            placeholder="SF/Stairs"
            className={styles.inputField}
          />
          <button
            onClick={handleAddInvoice}
            className={styles.addInvoiceButton}
          >
            Add Invoice
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewCompanyTableDetails;
