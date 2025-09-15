// src/Pages/TableDetailsPage.jsx

import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import StaticCompanyInfo from "../components/StaticCompanyInfo/StaticCompanyInfo"; // Додаємо імпорт
import styles from "./TableDetailsPage.module.css";
import { FaArrowLeft } from "react-icons/fa";

const TableDetailsPage = () => {
  const { companyName, tableId } = useParams();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState(null);
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchTableDetails = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("companies")
        .select("id, name, invoiceTables")
        .eq("name", companyName)
        .single();

      if (error) {
        console.error("Error fetching company data:", error);
        setLoading(false);
        return;
      }

      if (data && data.invoiceTables) {
        const selectedTable = data.invoiceTables.find(
          (t) => String(t.tableId) === String(tableId)
        );
        if (selectedTable) {
          setCompanyData(data);
          setTable(selectedTable);
        } else {
          console.error("Table not found in company data.");
        }
      }
      setLoading(false);
    };

    fetchTableDetails();
  }, [companyName, tableId]);

  const handleInvoiceChange = (e, index, field) => {
    const updatedInvoices = [...table.invoices];
    updatedInvoices[index][field] = e.target.value;
    setTable((prev) => ({ ...prev, invoices: updatedInvoices }));
  };

  const handleSaveChanges = async () => {
    const updatedTables = companyData.invoiceTables.map((tbl) =>
      tbl.tableId === tableId ? { ...tbl, invoices: table.invoices } : tbl
    );
    const { error } = await supabase
      .from("companies")
      .update({ invoiceTables: updatedTables })
      .eq("id", companyData.id);

    if (error) {
      toast.error("Failed to save changes.");
      console.error(error);
    } else {
      toast.success("Changes saved successfully!");
      setCompanyData((prev) => ({ ...prev, invoiceTables: updatedTables }));
      setIsEditing(false);
    }
  };

  const totalWithoutGst = useMemo(() => {
    return (
      table?.invoices.reduce(
        (acc, inv) => acc + parseFloat(inv.total || 0),
        0
      ) || 0
    );
  }, [table]);

  const totalGst = useMemo(() => {
    return (
      table?.invoices.reduce(
        (acc, inv) => acc + parseFloat(inv.GSTCollected || 0),
        0
      ) || 0
    );
  }, [table]);

  const totalWithGst = useMemo(() => {
    return (
      table?.invoices.reduce(
        (acc, inv) => acc + parseFloat(inv.totalWithGst || 0),
        0
      ) || 0
    );
  }, [table]);

  if (loading || !table) {
    return (
      <div className={styles.invoicePage} style={{ textAlign: "center" }}>
        <p>Loading table details...</p>
      </div>
    );
  }

  return (
    <div className={styles.invoicePage}>
      <div className={styles.btnBackPrintCont}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <button
          className={styles.editButton}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>
      <div className={styles.document}>
        <div className={styles.header}>
          <StaticCompanyInfo />
        </div>
        <div className={styles.invoiceHeader}>
          <h2>Invoice Details</h2>
          <p>
            <strong>Date:</strong> {table.invoiceDetails?.date}
          </p>
          <p>
            <strong>Invoice #:</strong> {table.invoiceDetails?.invoiceNumber}
          </p>
          <p>
            <strong>BILL TO:</strong> {table.invoiceDetails?.billTo}
          </p>
          <p>
            <strong>PAY TO:</strong> {table.invoiceDetails?.payTo}
          </p>
        </div>
        <table className={styles.invoiceTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Address</th>
              <th>Price</th>
              <th>SF/Stairs</th>
              <th>Total</th>
              <th>GST Collected (5%)</th>
              <th>Total With Gst</th>
            </tr>
          </thead>
          <tbody>
            {table.invoices.map((invoice, index) => (
              <tr key={index}>
                <td>{invoice.date}</td>
                <td>{invoice.address}</td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={invoice.price}
                      onChange={(e) => handleInvoiceChange(e, index, "price")}
                    />
                  ) : (
                    invoice.price
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={invoice["sf/stairs"]}
                      onChange={(e) =>
                        handleInvoiceChange(e, index, "sf/stairs")
                      }
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
              <td colSpan="4"></td>
              <td>{totalWithoutGst.toFixed(2)}</td>
              <td>{totalGst.toFixed(2)}</td>
              <td>{totalWithGst.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        {isEditing && (
          <div className={styles.btnSaveCont}>
            <button className={styles.saveButton} onClick={handleSaveChanges}>
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default TableDetailsPage;
