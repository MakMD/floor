// src/Pages/StoreInvoiceDetailsPage.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FaArrowLeft,
  FaSearch,
  FaFileInvoiceDollar,
  FaPrint,
  FaTrash,
  FaCheck,
} from "react-icons/fa";
import commonStyles from "../styles/common.module.css";
import styles from "./StoreInvoiceDetailsPage.module.css";

const StoreInvoiceDetailsPage = () => {
  const { storeId } = useParams();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [invoicesHistory, setInvoicesHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [previewAddresses, setPreviewAddresses] = useState([]);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchPageData = useCallback(async () => {
    setLoading(true);
    const [storeRes, invoicesRes] = await Promise.all([
      supabase.from("stores").select("*").eq("id", storeId).single(),
      supabase
        .from("store_invoices")
        .select("*")
        .eq("store_id", storeId)
        .order("created_at", { ascending: false }),
    ]);

    if (storeRes.error) {
      toast.error("Store not found");
      navigate("/store-invoices");
      return;
    }

    setStore(storeRes.data);
    setInvoicesHistory(invoicesRes.data || []);
    setLoading(false);
  }, [storeId, navigate]);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handlePreview = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both Start and End dates.");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after End date.");
      return;
    }

    setIsPreviewing(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("id, address, date, total_amount, work_order_number, status")
      .eq("store_id", storeId)
      .eq("is_deleted", false)
      .is("store_invoice_id", null)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true });

    if (error) {
      toast.error("Error fetching preview.");
      console.error(error);
    } else {
      setPreviewAddresses(data || []);
      if (data?.length === 0)
        toast("No un-invoiced projects found in this range.", { icon: "ℹ️" });
    }
    setIsPreviewing(false);
  };

  const handleRemoveFromPreview = (idToRemove) => {
    setPreviewAddresses((prev) => prev.filter((a) => a.id !== idToRemove));
  };

  const totalsPreview = useMemo(() => {
    return previewAddresses.reduce(
      (sum, addr) => sum + (parseFloat(addr.total_amount) || 0),
      0,
    );
  }, [previewAddresses]);

  const handleGenerateInvoice = async () => {
    if (previewAddresses.length === 0) {
      toast.error("No addresses to invoice.");
      return;
    }

    setIsGenerating(true);
    try {
      const name = `${startDate} to ${endDate}`;
      const { data: newInvoice, error: invError } = await supabase
        .from("store_invoices")
        .insert({
          store_id: storeId,
          name,
          start_date: startDate,
          end_date: endDate,
          total_amount: totalsPreview,
        })
        .select()
        .single();

      if (invError) throw invError;

      const addressIds = previewAddresses.map((a) => a.id);
      const { error: updateError } = await supabase
        .from("addresses")
        .update({ store_invoice_id: newInvoice.id })
        .in("id", addressIds);

      if (updateError) throw updateError;

      toast.success("Invoice generated successfully!");
      setPreviewAddresses([]);
      setStartDate("");
      setEndDate("");
      fetchPageData();
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invoice.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async (invoice) => {
    const toastId = toast.loading("Generating PDF...");
    const { data: addrs, error } = await supabase
      .from("addresses")
      .select("date, address, work_order_number, total_amount")
      .eq("store_invoice_id", invoice.id)
      .order("date", { ascending: true });

    if (error) {
      toast.error("Error fetching invoice data.", { id: toastId });
      return;
    }

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(`INVOICE — ${store.name}`, 14, 20);
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Period: ${invoice.start_date} to ${invoice.end_date}`, 14, 28);
    doc.text(`Status: ${invoice.status || "Pending"}`, 14, 34);

    const tableColumn = ["DATE", "WO NUMBER", "ADDRESS", "AMOUNT"];
    const tableRows = (addrs || []).map((addr) => [
      addr.date || "-",
      addr.work_order_number || "-",
      addr.address || "-",
      `$${parseFloat(addr.total_amount || 0).toFixed(2)}`,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      headStyles: {
        fontStyle: "bold",
        textColor: [0, 0, 0],
        lineWidth: { bottom: 0.5 },
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        textColor: [0, 0, 0],
        lineWidth: { bottom: 0.1 },
        lineColor: [220, 220, 220],
      },
    });

    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("TOTAL:", 130, finalY);
    doc.text(
      `$${parseFloat(invoice.total_amount || 0).toFixed(2)}`,
      160,
      finalY,
    );

    // Пряме завантаження файлу замість відкриття у новій вкладці
    const safeStoreName = store.name.replace(/[^a-zA-Z0-9]/g, "_");
    doc.save(
      `Invoice_${safeStoreName}_${invoice.start_date}_to_${invoice.end_date}.pdf`,
    );

    toast.success("PDF Downloaded!", { id: toastId });
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (
      !window.confirm(
        "Are you sure? This will return all associated projects to un-invoiced status.",
      )
    )
      return;

    const { error } = await supabase
      .from("store_invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) {
      toast.error("Failed to delete invoice.");
      console.error(error);
    } else {
      toast.success("Invoice deleted.");
      fetchPageData();
    }
  };

  if (loading || !store)
    return <div className={styles.loadingScreen}>Loading...</div>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainLayout}>
        <div className={styles.header}>
          <button
            className={commonStyles.buttonSecondary}
            onClick={() => navigate(-1)}
            style={{ border: "none" }}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className={styles.pageTitle}>{store.name} Invoices</h1>
          <div style={{ width: "80px" }}></div>
        </div>

        <div className={styles.gridContainer}>
          {/* ЛІВА ЧАСТИНА: ГЕНЕРАТОР */}
          <div className={styles.column}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Generate New Invoice</h3>
              <div className={styles.datePickerRow}>
                <div className={styles.inputGroup}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={styles.inputField}
                  />
                </div>
              </div>
              <button
                className={commonStyles.buttonPrimary}
                onClick={handlePreview}
                disabled={isPreviewing}
                style={{ width: "100%", marginTop: "16px" }}
              >
                <FaSearch /> {isPreviewing ? "Searching..." : "Preview Invoice"}
              </button>
            </div>

            {previewAddresses.length > 0 && (
              <div className={styles.card}>
                <h3 className={styles.cardTitle}>
                  Preview ({previewAddresses.length} items)
                </h3>
                <div className={styles.previewList}>
                  {previewAddresses.map((addr) => (
                    <div key={addr.id} className={styles.previewItem}>
                      <div className={styles.previewInfo}>
                        <span className={styles.previewDate}>
                          {addr.date || "No date"}
                        </span>
                        <span className={styles.previewAddress}>
                          {addr.address}
                        </span>
                        <span className={styles.previewAmount}>
                          ${parseFloat(addr.total_amount || 0).toFixed(2)}
                        </span>
                      </div>
                      <button
                        className={commonStyles.buttonIcon}
                        onClick={() => handleRemoveFromPreview(addr.id)}
                        title="Remove from this invoice"
                      >
                        <FaTrash color="#dc3545" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className={styles.previewTotalRow}>
                  <span>Total Amount:</span>
                  <span className={styles.previewTotalValue}>
                    ${totalsPreview.toFixed(2)}
                  </span>
                </div>
                <button
                  className={commonStyles.buttonSuccess}
                  onClick={handleGenerateInvoice}
                  disabled={isGenerating}
                  style={{ width: "100%", marginTop: "16px", padding: "12px" }}
                >
                  <FaCheck />{" "}
                  {isGenerating ? "Generating..." : "Generate & Save Invoice"}
                </button>
              </div>
            )}
          </div>

          {/* ПРАВА ЧАСТИНА: ІСТОРІЯ */}
          <div className={styles.column}>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Invoice History</h3>
              {invoicesHistory.length > 0 ? (
                <div className={styles.historyList}>
                  {invoicesHistory.map((inv) => (
                    <div key={inv.id} className={styles.historyItem}>
                      <div className={styles.historyInfo}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <FaFileInvoiceDollar size={20} color="#cfa85c" />
                          <span className={styles.historyName}>{inv.name}</span>
                        </div>
                        <span className={styles.historyAmount}>
                          ${parseFloat(inv.total_amount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className={styles.historyActions}>
                        <button
                          className={commonStyles.buttonIcon}
                          onClick={() => handlePrint(inv)}
                        >
                          <FaPrint color="#2c2c2c" />
                        </button>
                        <button
                          className={commonStyles.buttonIcon}
                          onClick={() => handleDeleteInvoice(inv.id)}
                        >
                          <FaTrash color="#dc3545" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyText}>No invoices generated yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreInvoiceDetailsPage;
