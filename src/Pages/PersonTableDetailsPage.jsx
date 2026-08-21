import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import AutocompleteInput from "../components/AutocompleteInput/AutocompleteInput";
import AddressHistory from "../components/AddressHistory/AddressHistory";
import PersonDetailsModal from "../components/PersonDetailsModal/PersonDetailsModal";
import styles from "./PersonTableDetailsPage.module.css";
import commonStyles from "../styles/common.module.css";
import {
  FaTrash,
  FaArrowLeft,
  FaEdit,
  FaCheck,
  FaPlus,
  FaPrint,
} from "react-icons/fa";

const PersonTableDetailsPage = () => {
  const { personId, tableId } = useParams();
  const navigate = useNavigate();

  const [person, setPerson] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [allPeople, setAllPeople] = useState([]);

  const [newInvoice, setNewInvoice] = useState({
    address: "",
    date: "",
    total_income: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedPersonForModal, setSelectedPersonForModal] = useState(null);
  const [modalFilterAddress, setModalFilterAddress] = useState("");

  const fetchInvoices = useCallback(async () => {
    if (!tableId) return;
    const { data, error } = await supabase
      .from("invoices")
      .select(
        "*, stores(name), builders(name), work_types(id, work_type_templates(name))",
      )
      .eq("invoice_table_id", tableId)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to load invoices.");
      console.error(error);
    } else {
      setInvoices(data || []);
    }
  }, [tableId]);

  useEffect(() => {
    const fetchPageData = async () => {
      setLoading(true);
      const [personResult, tableResult, allPeopleResult] = await Promise.all([
        supabase
          .from("people")
          .select("id, name, has_gst, has_wcb, has_holdback")
          .eq("id", personId)
          .single(),
        supabase
          .from("invoice_tables")
          .select("id, name")
          .eq("id", tableId)
          .single(),
        supabase
          .from("people")
          .select("id, name, invoice_tables(invoices(address, date))"),
      ]);

      if (personResult.error || tableResult.error) {
        toast.error("Could not load page data.");
        setLoading(false);
        return;
      }

      setPerson(personResult.data);
      setTableInfo(tableResult.data);
      setAllPeople(allPeopleResult.data || []);

      await fetchInvoices();
      setLoading(false);
    };

    fetchPageData();
  }, [personId, tableId, fetchInvoices]);

  const uniqueAddresses = useMemo(() => {
    const allAddresses = invoices.map((inv) => inv.address);
    return [...new Set(allAddresses)];
  }, [invoices]);

  const totals = useMemo(() => {
    const baseTotal = invoices.reduce(
      (acc, inv) => acc + parseFloat(inv.total_income || 0),
      0,
    );
    const holdbackAmount = person?.has_holdback ? baseTotal * 0.05 : 0;
    const wcbAmount = person?.has_wcb ? baseTotal * 0.03 : 0;
    const totalAfterDeductions = baseTotal - wcbAmount - holdbackAmount;
    const gstAmount = person?.has_gst ? totalAfterDeductions * 0.05 : 0;
    const finalTotal = totalAfterDeductions + gstAmount;

    return {
      baseTotal,
      holdbackAmount,
      wcbAmount,
      totalAfterDeductions,
      gstAmount,
      finalTotal,
    };
  }, [invoices, person]);

  const handleInvoiceChange = (e, invoiceId, field) => {
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, [field]: e.target.value } : inv,
    );
    setInvoices(updatedInvoices);
  };

  const handleAddInvoice = async () => {
    if (!newInvoice.address || !newInvoice.date || !newInvoice.total_income) {
      toast.error("Please fill in all fields.");
      return;
    }
    const { error } = await supabase.from("invoices").insert({
      invoice_table_id: tableId,
      address: newInvoice.address,
      date: newInvoice.date,
      total_income: parseFloat(newInvoice.total_income),
    });
    if (error) {
      toast.error("Failed to add invoice.");
    } else {
      toast.success("Invoice added successfully!");
      setNewInvoice({ address: "", date: "", total_income: "" });
      fetchInvoices();
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
      toast.success("Invoice deleted!");
      fetchInvoices();
    }
  };

  const handleSaveChanges = async () => {
    const updatePromises = invoices.map((inv) =>
      supabase
        .from("invoices")
        .update({
          address: inv.address,
          date: inv.date,
          total_income: parseFloat(inv.total_income || 0),
        })
        .eq("id", inv.id),
    );
    const results = await Promise.all(updatePromises);
    const hasError = results.some((res) => res.error);
    if (hasError) {
      toast.error("Some changes could not be saved.");
    } else {
      toast.success("Changes saved successfully!");
      setIsEditing(false);
    }
  };

  const handleNewInvoiceChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice((prev) => ({ ...prev, [name]: value }));
  };

  const handleHistoryPersonClick = (clickedPerson) => {
    setSelectedPersonForModal(clickedPerson);
    setModalFilterAddress(newInvoice.address);
  };

  const closeModal = () => {
    setSelectedPersonForModal(null);
    setModalFilterAddress("");
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading || !person || !tableInfo) {
    return (
      <div className={styles.pageContainer}>
        <div
          className={styles.mobileLayout}
          style={{ textAlign: "center", padding: "40px" }}
        >
          <p>Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileLayout}>
        <div className={`${styles.header} ${styles.noPrint}`}>
          <button
            className={commonStyles.buttonSecondary}
            onClick={() => navigate(-1)}
            style={{ border: "none" }}
          >
            <FaArrowLeft /> Back
          </button>

          <div className={styles.headerButtons}>
            <button
              onClick={handlePrint}
              className={commonStyles.buttonSecondary}
            >
              <FaPrint /> Print
            </button>
            <button
              onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
              className={
                isEditing
                  ? commonStyles.buttonSuccess
                  : commonStyles.buttonSecondary
              }
            >
              {isEditing ? <FaCheck /> : <FaEdit />}{" "}
              {isEditing ? "Save" : "Edit"}
            </button>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div className={styles.gridColumn}>
            <div className={`${styles.detailCard} ${styles.noPrint}`}>
              <h3>Add New Invoice</h3>
              <div className={styles.cardContentWrapper}>
                <div className={styles.addInvoiceForm}>
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
                  <button
                    onClick={handleAddInvoice}
                    className={commonStyles.buttonPrimary}
                  >
                    <FaPlus /> Add
                  </button>
                </div>
              </div>
            </div>

            <div className={`${styles.detailCard} ${styles.printableCard}`}>
              {/* ЗАГОЛОВОК ДЛЯ ЕКРАНА */}
              <h3 className={styles.screenTitle}>
                INVOICE: {person.name} <br />
                <span style={{ fontSize: "0.85rem", fontWeight: "normal" }}>
                  {tableInfo.name}
                </span>
              </h3>

              {/* ЗАГОЛОВОК ДЛЯ ПАПЕРУ */}
              <h3 className={styles.printTitle}>
                {person.name} — {tableInfo.name}
              </h3>

              <div
                className={styles.cardContentWrapper}
                style={{ padding: "0" }}
              >
                <div className={styles.tableWrapper}>
                  <table className={styles.invoiceTable}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Address</th>
                        <th className={styles.hideOnPrint}>Builder</th>
                        <th className={styles.hideOnPrint}>Store</th>
                        <th>Work Type</th>
                        <th>Amount</th>
                        {isEditing && <th className={styles.noPrint}></th>}
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice.id}>
                          <td data-label="Date">
                            {isEditing ? (
                              <input
                                type="date"
                                value={invoice.date}
                                onChange={(e) =>
                                  handleInvoiceChange(e, invoice.id, "date")
                                }
                              />
                            ) : (
                              invoice.date
                            )}
                          </td>
                          <td data-label="Address">
                            {isEditing ? (
                              <input
                                type="text"
                                value={invoice.address}
                                onChange={(e) =>
                                  handleInvoiceChange(e, invoice.id, "address")
                                }
                              />
                            ) : (
                              invoice.address
                            )}
                          </td>
                          <td
                            data-label="Builder"
                            className={styles.hideOnPrint}
                          >
                            {invoice.builders?.name || ""}
                          </td>
                          <td data-label="Store" className={styles.hideOnPrint}>
                            {invoice.stores?.name || "-"}
                          </td>
                          <td data-label="Work Type">
                            {invoice.work_types?.work_type_templates?.name ||
                              "-"}
                          </td>
                          <td data-label="Amount">
                            {isEditing ? (
                              <input
                                type="number"
                                value={invoice.total_income}
                                onChange={(e) =>
                                  handleInvoiceChange(
                                    e,
                                    invoice.id,
                                    "total_income",
                                  )
                                }
                              />
                            ) : (
                              `$${parseFloat(invoice.total_income || 0).toFixed(2)}`
                            )}
                          </td>
                          {isEditing && (
                            <td data-label="Actions" className={styles.noPrint}>
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

                    {/* ПІДСУМОК 1: ДЛЯ ЕКРАНА (показується тільки на сайті) */}
                    <tfoot className={styles.screenOnlyTfoot}>
                      <tr className={styles.totalRow}>
                        <td colSpan="3" className={styles.emptyCell}></td>
                        <td
                          className={`${styles.hideOnPrint} ${styles.emptyCell}`}
                        ></td>
                        <td className={styles.totalLabel}>SUBTOTAL:</td>
                        <td className={styles.totalValue}>
                          ${totals.baseTotal.toFixed(2)}
                        </td>
                        {isEditing && (
                          <td
                            className={`${styles.noPrint} ${styles.emptyCell}`}
                          ></td>
                        )}
                      </tr>
                      {person.has_holdback && (
                        <tr className={styles.totalRow}>
                          <td colSpan="3" className={styles.emptyCell}></td>
                          <td
                            className={`${styles.hideOnPrint} ${styles.emptyCell}`}
                          ></td>
                          <td className={styles.totalLabel}>
                            Holdback Deduction (5%):
                          </td>
                          <td
                            className={styles.totalValue}
                            style={{ color: "#dc3545" }}
                          >
                            -${totals.holdbackAmount.toFixed(2)}
                          </td>
                          {isEditing && (
                            <td
                              className={`${styles.noPrint} ${styles.emptyCell}`}
                            ></td>
                          )}
                        </tr>
                      )}
                      {person.has_wcb && (
                        <tr className={styles.totalRow}>
                          <td colSpan="3" className={styles.emptyCell}></td>
                          <td
                            className={`${styles.hideOnPrint} ${styles.emptyCell}`}
                          ></td>
                          <td className={styles.totalLabel}>
                            WCB Deduction (3%):
                          </td>
                          <td
                            className={styles.totalValue}
                            style={{ color: "#dc3545" }}
                          >
                            -${totals.wcbAmount.toFixed(2)}
                          </td>
                          {isEditing && (
                            <td
                              className={`${styles.noPrint} ${styles.emptyCell}`}
                            ></td>
                          )}
                        </tr>
                      )}
                      {person.has_gst && (
                        <tr className={styles.totalRow}>
                          <td colSpan="3" className={styles.emptyCell}></td>
                          <td
                            className={`${styles.hideOnPrint} ${styles.emptyCell}`}
                          ></td>
                          <td className={styles.totalLabel}>GST (5%):</td>
                          <td className={styles.totalValue}>
                            +${totals.gstAmount.toFixed(2)}
                          </td>
                          {isEditing && (
                            <td
                              className={`${styles.noPrint} ${styles.emptyCell}`}
                            ></td>
                          )}
                        </tr>
                      )}
                      <tr className={styles.finalTotalRow}>
                        <td colSpan="3" className={styles.emptyCell}></td>
                        <td
                          className={`${styles.hideOnPrint} ${styles.emptyCell}`}
                        ></td>
                        <td className={styles.totalLabel}>FINAL PAYOUT:</td>
                        <td className={styles.totalValue}>
                          ${totals.finalTotal.toFixed(2)}
                        </td>
                        {isEditing && (
                          <td
                            className={`${styles.noPrint} ${styles.emptyCell}`}
                          ></td>
                        )}
                      </tr>
                    </tfoot>

                    {/* ПІДСУМОК 2: ДЛЯ ДРУКУ (показується тільки на папері) 
                        Тут тільки 4 колонки: Дата, Адреса, Робота, Сума. 
                        Тому ми робимо colSpan="3" для тексту і залишаємо 1 колонку для суми */}
                    <tfoot className={styles.printOnlyTfoot}>
                      <tr>
                        <td colSpan="3" className={styles.totalLabel}>
                          TOTAL:
                        </td>
                        <td className={styles.totalValue}>
                          ${totals.baseTotal.toFixed(2)}
                        </td>
                      </tr>
                      {person.has_holdback && (
                        <tr>
                          <td colSpan="3" className={styles.totalLabel}>
                            Holdback 5%:
                          </td>
                          <td className={styles.totalValue}>
                            -${totals.holdbackAmount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {person.has_wcb && (
                        <tr>
                          <td colSpan="3" className={styles.totalLabel}>
                            WCB 3%:
                          </td>
                          <td className={styles.totalValue}>
                            -${totals.wcbAmount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      {person.has_gst && (
                        <tr>
                          <td colSpan="3" className={styles.totalLabel}>
                            GST 5%:
                          </td>
                          <td className={styles.totalValue}>
                            ${totals.gstAmount.toFixed(2)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="3" className={styles.totalLabel}>
                          {person.has_gst ||
                          person.has_holdback ||
                          person.has_wcb
                            ? "TOTAL PAYOUT:"
                            : ""}
                        </td>
                        <td className={styles.totalValue}>
                          {person.has_gst ||
                          person.has_holdback ||
                          person.has_wcb
                            ? `$${totals.finalTotal.toFixed(2)}`
                            : ""}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className={`${styles.gridColumn} ${styles.noPrint}`}>
            <div className={styles.detailCard}>
              <h3>Address History</h3>
              <div className={styles.cardContentWrapper}>
                <AddressHistory
                  allPeople={allPeople}
                  currentAddress={newInvoice.address}
                  currentPersonId={person.id}
                  onPersonClick={handleHistoryPersonClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedPersonForModal && (
        <PersonDetailsModal
          person={selectedPersonForModal}
          filterAddress={modalFilterAddress}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
export default PersonTableDetailsPage;
