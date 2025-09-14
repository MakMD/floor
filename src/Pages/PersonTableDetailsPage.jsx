// src/Pages/PersonTableDetailsPage.jsx

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import AutocompleteInput from "../components/AutocompleteInput/AutocompleteInput";
import styles from "./PersonTableDetailsPage.module.css";

// Іконка кошика для кнопки видалення
const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

const PersonTableDetailsPage = () => {
  const { personId, tableId } = useParams();
  const navigate = useNavigate();
  const [person, setPerson] = useState(null);
  const [table, setTable] = useState(null);
  const [newInvoice, setNewInvoice] = useState({
    address: "",
    date: "",
    total_income: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [totalWithGST, setTotalWithGST] = useState(null);
  const [wcb, setWcb] = useState(null);
  const [showGST, setShowGST] = useState(false);
  const [showWCB, setShowWCB] = useState(false);
  const [isWCBCalculated, setIsWCBCalculated] = useState(false);
  const [isGSTCalculated, setIsGSTCalculated] = useState(false);

  const fetchPersonData = async () => {
    const { data: personData, error } = await supabase
      .from("people")
      .select("*")
      .eq("id", personId)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return;
    }

    if (personData && personData.tables) {
      const selectedTable = personData.tables.find(
        (t) => String(t.tableId) === String(tableId)
      );

      if (selectedTable) {
        setPerson(personData);
        setTable(selectedTable);
      } else {
        console.error("Table not found inside person's data.");
      }
    }
  };

  useEffect(() => {
    fetchPersonData();
  }, [personId, tableId]);

  const uniqueAddresses = useMemo(() => {
    if (!person || !person.tables) return [];
    const allAddresses = person.tables.flatMap((t) =>
      t.invoices.map((inv) => inv.address)
    );
    return [...new Set(allAddresses)];
  }, [person]);

  const updateTablesOnServer = async (updatedTables, successMessage) => {
    const { error } = await supabase
      .from("people")
      .update({ tables: updatedTables })
      .eq("id", person.id);

    if (error) {
      toast.error("Failed to save changes.");
      console.error(error);
    } else {
      if (successMessage) toast.success(successMessage);
      setPerson((prev) => ({ ...prev, tables: updatedTables }));
      const updatedTable = updatedTables.find((t) => t.tableId === tableId);
      setTable(updatedTable);
    }
  };

  const handleInvoiceChange = (e, index, field) => {
    const updatedInvoices = [...table.invoices];
    updatedInvoices[index][field] = e.target.value;
    const isInvoiceEmpty =
      !updatedInvoices[index].address &&
      !updatedInvoices[index].date &&
      !updatedInvoices[index].total_income;
    if (isInvoiceEmpty) {
      updatedInvoices.splice(index, 1);
    }
    setTable((prev) => ({ ...prev, invoices: updatedInvoices }));
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.address || !newInvoice.date || !newInvoice.total_income) {
      toast.error("Please fill in all fields.");
      return;
    }
    const updatedInvoices = [newInvoice, ...table.invoices];
    const updatedTables = person.tables.map((tbl) =>
      tbl.tableId === tableId ? { ...tbl, invoices: updatedInvoices } : tbl
    );
    await updateTablesOnServer(updatedTables, "Invoice added successfully!");
    setNewInvoice({ address: "", date: "", total_income: 0 });
  };

  const handleDeleteInvoice = async (invoiceIndex) => {
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;
    const updatedInvoices = table.invoices.filter(
      (_, index) => index !== invoiceIndex
    );
    const updatedTables = person.tables.map((tbl) =>
      tbl.tableId === tableId ? { ...tbl, invoices: updatedInvoices } : tbl
    );
    await updateTablesOnServer(updatedTables, "Invoice deleted!");
  };

  const handleSaveChanges = async () => {
    const updatedTables = person.tables.map((tbl) =>
      tbl.tableId === tableId ? { ...tbl, invoices: table.invoices } : tbl
    );
    await updateTablesOnServer(updatedTables, "Changes saved successfully!");
    setIsEditing(false);
  };

  const handleNewInvoiceChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const totalIncome = useMemo(() => {
    return (
      table?.invoices.reduce(
        (acc, inv) => acc + parseFloat(inv.total_income || 0),
        0
      ) || 0
    );
  }, [table]);

  const calculateWCB = () => {
    const newWCB = (totalIncome - (totalIncome / 100) * 3).toFixed(2);
    setWcb(newWCB);
    setShowWCB(true);
    setIsWCBCalculated(true);
    if (isGSTCalculated) {
      setTotalWithGST((newWCB * 1.05).toFixed(2));
    }
  };

  const calculateTotalWithGST = () => {
    const baseIncome = isWCBCalculated ? wcb : totalIncome;
    setTotalWithGST((baseIncome * 1.05).toFixed(2));
    setShowGST(true);
    setIsGSTCalculated(true);
  };

  const handlePrint = () => window.print();
  const toggleEditMode = () => setIsEditing(!isEditing);

  if (!table) {
    return (
      <div
        className={styles.tableDetailsContainer}
        style={{ textAlign: "center" }}
      >
        <p>Loading table details...</p>
      </div>
    );
  }

  return (
    <div className={styles.tableDetailsContainer}>
      <div className={styles.btnBackPrintCont}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>
        <button className={styles.printButton} onClick={handlePrint}>
          Print
        </button>
        <button
          onClick={isEditing ? handleSaveChanges : toggleEditMode}
          className={styles.editButton}
        >
          {isEditing ? "Save Changes" : "Edit"}
        </button>
      </div>

      <h2 className={styles.personName}>
        {person?.name || "Employee"} Details
      </h2>

      <div className={styles.addInvoiceForm}>
        <h3>Add New Invoice</h3>
        <AutocompleteInput
          name="address"
          value={newInvoice.address}
          onChange={handleNewInvoiceChange}
          placeholder="Address"
          suggestions={uniqueAddresses}
        />
        <input
          type="date"
          name="date"
          value={newInvoice.date}
          onChange={handleNewInvoiceChange}
          className={styles.inputField}
        />
        <input
          type="number"
          name="total_income"
          value={newInvoice.total_income}
          onChange={handleNewInvoiceChange}
          placeholder="Total Income"
          className={styles.inputField}
        />
        <button onClick={handleAddInvoice} className={styles.addInvoiceButton}>
          Add Invoice
        </button>
      </div>

      <table className={styles.invoiceTable}>
        <thead>
          <tr>
            <th>#</th>
            <th>Address</th>
            <th>Date</th>
            <th>Total Income</th>
            {isEditing && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {table.invoices.map((invoice, index) => (
            <tr key={index}>
              <td>{index + 1}</td>
              <td>
                {isEditing ? (
                  <input
                    type="text"
                    value={invoice.address}
                    onChange={(e) => handleInvoiceChange(e, index, "address")}
                    className={styles.inputField}
                  />
                ) : (
                  invoice.address
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="date"
                    value={invoice.date}
                    onChange={(e) => handleInvoiceChange(e, index, "date")}
                    className={styles.inputField}
                  />
                ) : (
                  invoice.date
                )}
              </td>
              <td>
                {isEditing ? (
                  <input
                    type="number"
                    value={invoice.total_income}
                    onChange={(e) =>
                      handleInvoiceChange(e, index, "total_income")
                    }
                    className={styles.inputField}
                  />
                ) : (
                  `$${parseFloat(invoice.total_income || 0).toFixed(2)}`
                )}
              </td>
              {isEditing && (
                <td>
                  <button
                    className={styles.deleteInvoiceButton}
                    onClick={() => handleDeleteInvoice(index)}
                  >
                    <DeleteIcon />
                  </button>
                </td>
              )}
            </tr>
          ))}
          <tr className={styles.totalRow}>
            <td colSpan={isEditing ? 3 : 2}></td>
            <td style={{ textAlign: "right" }}>
              <strong>Total:</strong>
            </td>
            <td>
              <strong>${totalIncome.toFixed(2)}</strong>
            </td>
            {isEditing && <td></td>}
          </tr>
          {showGST && (
            <tr className={styles.totalRow}>
              <td colSpan={isEditing ? 3 : 2}></td>
              <td style={{ textAlign: "right" }}>
                <strong>Total with GST:</strong>
              </td>
              <td>
                <strong>${totalWithGST}</strong>
              </td>
              {isEditing && <td></td>}
            </tr>
          )}
          {showWCB && (
            <tr className={styles.totalRow}>
              <td colSpan={isEditing ? 3 : 2}></td>
              <td style={{ textAlign: "right" }}>
                <strong>Total - WCB:</strong>
              </td>
              <td>
                <strong>${wcb}</strong>
              </td>
              {isEditing && <td></td>}
            </tr>
          )}
        </tbody>
      </table>

      <div className={styles.calculationButtons}>
        <button onClick={calculateTotalWithGST} className={styles.btnGst}>
          +GST (5%)
        </button>
        <button onClick={calculateWCB} className={styles.btnWcb}>
          -WCB (3%)
        </button>
      </div>
    </div>
  );
};

export default PersonTableDetailsPage;
