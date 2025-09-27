// makmd/floor/floor-65963b367ef8c4d4dde3af32af465a056bcb8db5/src/Pages/TableDetailsPage.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import StaticCompanyInfo from "../components/StaticCompanyInfo/StaticCompanyInfo";
import styles from "./TableDetailsPage.module.css";
import commonStyles from "../styles/common.module.css"; // ІМПОРТ
import { FaArrowLeft, FaEdit, FaSave, FaPlus, FaTrash } from "react-icons/fa";

const TableDetailsPage = () => {
  const { companyId, tableId } = useParams();
  const navigate = useNavigate();

  const [company, setCompany] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [invoices, setInvoices] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    date: "",
    address: "",
    total: "",
  });

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    try {
      const [companyResult, tableResult, invoicesResult] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name")
          .eq("id", companyId)
          .single(),
        supabase
          .from("invoice_tables")
          .select("id, name")
          .eq("id", tableId)
          .single(),
        supabase
          .from("invoices")
          .select("*")
          .eq("invoice_table_id", tableId)
          .order("date", { ascending: false }),
      ]);

      if (companyResult.error) throw companyResult.error;
      if (tableResult.error) throw tableResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      setCompany(companyResult.data);
      setTableInfo(tableResult.data);
      setInvoices(invoicesResult.data || []);
    } catch (error) {
      toast.error("Could not load page data.");
      console.error(error);
      navigate("/companies");
    } finally {
      setLoading(false);
    }
  }, [companyId, tableId, navigate]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleInputChange = (e, invoiceId) => {
    const { name, value } = e.target;
    setInvoices((currentInvoices) =>
      currentInvoices.map((inv) =>
        inv.id === invoiceId ? { ...inv, [name]: value } : inv
      )
    );
  };

  const handleNewInvoiceChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.date || !newInvoice.address || !newInvoice.total) {
      toast.error("Please fill all fields for the new invoice.");
      return;
    }

    const total = parseFloat(newInvoice.total);
    const gst = total * 0.05;
    const totalWithGst = total + gst;

    const { error } = await supabase.from("invoices").insert({
      invoice_table_id: tableId,
      date: newInvoice.date,
      address: newInvoice.address,
      total: total,
      GSTCollected: gst,
      totalWithGst: totalWithGst,
    });

    if (error) {
      toast.error("Failed to add new invoice.");
    } else {
      toast.success("Invoice added!");
      setNewInvoice({ date: "", address: "", total: "" });
      fetchPageData();
    }
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!window.confirm("Are you sure you want to delete this invoice?"))
      return;
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);
    if (error) {
      toast.error("Failed to delete invoice.");
    } else {
      toast.success("Invoice deleted.");
      fetchPageData();
    }
  };

  const handleSaveChanges = async () => {
    const updatePromises = invoices.map((inv) => {
      const total = parseFloat(inv.total || 0);
      const gst = total * 0.05;
      const totalWithGst = total + gst;

      return supabase
        .from("invoices")
        .update({
          date: inv.date,
          address: inv.address,
          total: total,
          GSTCollected: gst,
          totalWithGst: totalWithGst,
        })
        .eq("id", inv.id);
    });

    const results = await Promise.all(updatePromises);
    if (results.some((res) => res.error)) {
      toast.error("Some changes could not be saved.");
    } else {
      toast.success("All changes saved successfully!");
      setIsEditing(false);
      fetchPageData();
    }
  };

  const totals = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => {
        acc.total += parseFloat(inv.total || 0);
        acc.gst += parseFloat(inv.GSTCollected || 0);
        acc.totalWithGst += parseFloat(inv.totalWithGst || 0);
        return acc;
      },
      { total: 0, gst: 0, totalWithGst: 0 }
    );
  }, [invoices]);

  if (loading || !company || !tableInfo) {
    return (
      <div className={styles.invoicePage} style={{ textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={styles.invoicePage}>
      <div className={styles.controlsHeader}>
        <button
          className={commonStyles.buttonSecondary}
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft /> Back
        </button>
        <div className={styles.actionButtons}>
          <button
            className={commonStyles.button}
            onClick={() => window.print()}
          >
            Print
          </button>
          <button
            className={commonStyles.buttonPrimary}
            onClick={() =>
              isEditing ? handleSaveChanges() : setIsEditing(true)
            }
          >
            {isEditing ? (
              <>
                <FaSave /> Save
              </>
            ) : (
              <>
                <FaEdit /> Edit
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.document}>
        <div className={styles.header}>
          <StaticCompanyInfo />
        </div>
        <div className={styles.invoiceHeader}>
          <h2>
            {company.name} - {tableInfo.name}
          </h2>
        </div>

        <div className={styles.addInvoiceSection}>
          <h3 className={styles.sectionTitle}>Add New Invoice</h3>
          <div className={styles.addInvoiceForm}>
            <div className={styles.inputGroup}>
              <label htmlFor="new-date">Date</label>
              <input
                id="new-date"
                type="date"
                name="date"
                value={newInvoice.date}
                onChange={handleNewInvoiceChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="new-address">Address</label>
              <input
                id="new-address"
                type="text"
                name="address"
                placeholder="Job site address"
                value={newInvoice.address}
                onChange={handleNewInvoiceChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="new-total">Total (before GST)</label>
              <input
                id="new-total"
                type="number"
                name="total"
                placeholder="0.00"
                value={newInvoice.total}
                onChange={handleNewInvoiceChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <button
                onClick={handleAddInvoice}
                className={commonStyles.buttonSuccess}
              >
                <FaPlus /> Add Invoice
              </button>
            </div>
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th style={{ width: "15%" }}>Date</th>
                <th>Address</th>
                <th style={{ width: "15%" }}>Total</th>
                <th style={{ width: "15%" }}>GST (5%)</th>
                <th style={{ width: "15%" }}>Total+GST</th>
                {isEditing && <th style={{ width: "5%" }}></th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td>
                    {isEditing ? (
                      <input
                        type="date"
                        name="date"
                        value={invoice.date || ""}
                        onChange={(e) => handleInputChange(e, invoice.id)}
                      />
                    ) : (
                      invoice.date
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="text"
                        name="address"
                        value={invoice.address || ""}
                        onChange={(e) => handleInputChange(e, invoice.id)}
                      />
                    ) : (
                      invoice.address
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <input
                        type="number"
                        name="total"
                        value={invoice.total || ""}
                        onChange={(e) => handleInputChange(e, invoice.id)}
                      />
                    ) : (
                      `$${(invoice.total || 0).toFixed(2)}`
                    )}
                  </td>
                  <td>${(invoice.GSTCollected || 0).toFixed(2)}</td>
                  <td>${(invoice.totalWithGst || 0).toFixed(2)}</td>
                  {isEditing && (
                    <td>
                      <button
                        className={commonStyles.buttonIcon}
                        onClick={() => handleDeleteInvoice(invoice.id)}
                      >
                        <FaTrash />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td colSpan="2" style={{ textAlign: "right" }}>
                  <strong>TOTAL:</strong>
                </td>
                <td>
                  <strong>${totals.total.toFixed(2)}</strong>
                </td>
                <td>
                  <strong>${totals.gst.toFixed(2)}</strong>
                </td>
                <td>
                  <strong>${totals.totalWithGst.toFixed(2)}</strong>
                </td>
                {isEditing && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
export default TableDetailsPage;
