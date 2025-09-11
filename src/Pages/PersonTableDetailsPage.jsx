// src/Pages/PersonTableDetailsPage.jsx

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AutocompleteInput from "../components/AutocompleteInput/AutocompleteInput";
import styles from "./PersonTableDetailsPage.module.css";

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
  const [totalWithGST, setTotalWithGST] = useState(null);
  const [wcb, setWcb] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showGST, setShowGST] = useState(false);
  const [showWCB, setShowWCB] = useState(false);
  const [isWCBCalculated, setIsWCBCalculated] = useState(false);
  const [isGSTCalculated, setIsGSTCalculated] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchPersonData = async () => {
      try {
        const response = await axios.get(
          `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`
        );
        const personData = response.data;
        const selectedTable = personData.tables.find(
          (table) => table.tableId === tableId
        );
        setPerson(personData);
        setTable(selectedTable);
      } catch (error) {
        setError("Error fetching table details");
        console.error("Error fetching table details:", error);
      }
    };

    fetchPersonData();
  }, [personId, tableId]);

  const uniqueAddresses = useMemo(() => {
    if (!person || !person.tables) return [];

    const allAddresses = person.tables.flatMap((table) =>
      table.invoices.map((invoice) => invoice.address)
    );
    return [...new Set(allAddresses)];
  }, [person]);

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

    setTable((prevTable) => ({
      ...prevTable,
      invoices: updatedInvoices,
    }));
  };

  const handleNewInvoiceChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prevInvoice) => ({
      ...prevInvoice,
      [name]: value,
    }));
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.address || !newInvoice.date || !newInvoice.total_income) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      const updatedInvoices = [newInvoice, ...table.invoices];
      const currentPersonData = person; // Використовуємо вже завантажені дані

      const updatedTables = currentPersonData.tables.map((tbl) =>
        tbl.tableId === tableId ? { ...tbl, invoices: updatedInvoices } : tbl
      );

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...currentPersonData, tables: updatedTables }
      );

      setTable((prevTable) => ({
        ...prevTable,
        invoices: updatedInvoices,
      }));
      // Оновлюємо стан person, щоб унікальні адреси могли оновитись, якщо введено нову
      setPerson((prevPerson) => ({ ...prevPerson, tables: updatedTables }));

      setNewInvoice({ address: "", date: "", total_income: 0 });
    } catch (error) {
      console.error("Error adding invoice:", error);
      setError("Failed to add invoice.");
    }
  };

  const totalIncome = table?.invoices.reduce(
    (acc, invoice) => acc + parseFloat(invoice.total_income || 0),
    0
  );

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

  const handlePrint = () => {
    window.print();
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveChanges = async () => {
    try {
      const currentPersonData = person;
      const updatedTables = currentPersonData.tables.map((tbl) =>
        tbl.tableId === tableId ? { ...tbl, invoices: table.invoices } : tbl
      );

      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { ...currentPersonData, tables: updatedTables }
      );

      setIsEditing(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      setError("Failed to save changes.");
    }
  };

  return (
    <div className={styles.tableDetailsContainer}>
      <div className={styles.btnBackPrintCont}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>
        <button onClick={handlePrint} className={styles.printButton}>
          Print
        </button>
        <button
          onClick={isEditing ? handleSaveChanges : toggleEditMode}
          className={styles.editButton}
        >
          {isEditing ? "Save Changes" : "Edit"}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {table ? (
        <>
          <h2 className={styles.personName}>{person?.name} Details</h2>
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
              placeholder="Date"
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
            <button
              onClick={handleAddInvoice}
              className={styles.addInvoiceButton}
            >
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
                        onChange={(e) =>
                          handleInvoiceChange(e, index, "address")
                        }
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
                      invoice.total_income
                    )}
                  </td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td colSpan="3">Total:</td>
                <td>${totalIncome.toFixed(2)}</td>
              </tr>
              {showGST && (
                <tr className={styles.totalRow}>
                  <td colSpan="3">Total with GST:</td>
                  <td>${totalWithGST}</td>
                </tr>
              )}
              {showWCB && (
                <tr className={styles.totalRow}>
                  <td colSpan="3">Total - WCB:</td>
                  <td>${wcb}</td>
                </tr>
              )}
            </tbody>
          </table>

          <button onClick={calculateTotalWithGST} className={styles.btnGst}>
            +GST
          </button>
          <button onClick={calculateWCB} className={styles.btnWcb}>
            -WCB
          </button>
        </>
      ) : (
        <p>Loading table details...</p>
      )}
    </div>
  );
};

export default PersonTableDetailsPage;
