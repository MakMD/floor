// src/Pages/PersonTableDetailsPage.jsx

import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supabase } from "../supabaseClient";
import AutocompleteInput from "../components/AutocompleteInput/AutocompleteInput";
import AddressHistory from "../components/AddressHistory/AddressHistory";
import PersonDetailsModal from "../components/PersonDetailsModal/PersonDetailsModal";
import styles from "./PersonTableDetailsPage.module.css";
import { FaTrash } from "react-icons/fa";

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
      .select("*, stores(name), work_types(id, work_type_templates(name))")
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
        supabase.from("people").select("id, name").eq("id", personId).single(),
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

  const handleInvoiceChange = (e, invoiceId, field) => {
    const updatedInvoices = invoices.map((inv) =>
      inv.id === invoiceId ? { ...inv, [field]: e.target.value } : inv
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
        .eq("id", inv.id)
    );
    const results = await Promise.all(updatePromises);
    const hasError = results.some((res) => res.error);
    if (hasError) {
      toast.error("Some changes could not be saved.");
    } else {
      toast.success("Changes saved successfully!");
      setIsEditing(false);
      fetchInvoices();
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

  const totalIncome = useMemo(() => {
    return invoices.reduce(
      (acc, inv) => acc + parseFloat(inv.total_income || 0),
      0
    );
  }, [invoices]);

  if (loading || !person || !tableInfo) {
    return (
      <div className={styles.pageLayout}>
        <div className={styles.mainContent} style={{ textAlign: "center" }}>
          <p>Loading details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageLayout}>
      <div className={styles.mainContent}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            Back
          </button>
          <h1 className={styles.pageTitle}>
            {person.name} - {tableInfo.name}
          </h1>
          <button
            onClick={isEditing ? handleSaveChanges : () => setIsEditing(true)}
            className={styles.editButton}
          >
            {isEditing ? "Save" : "Edit"}
          </button>
        </div>

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
          <button
            onClick={handleAddInvoice}
            className={styles.addInvoiceButton}
          >
            Add Invoice
          </button>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.invoiceTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Address</th>
                <th>Store</th>
                <th>Work Type</th>
                <th>Total</th>
                {isEditing && <th></th>}
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
                  <td data-label="Store">{invoice.stores?.name || "N/A"}</td>
                  <td data-label="Work Type">
                    {invoice.work_types?.work_type_templates?.name || "N/A"}
                  </td>
                  <td data-label="Total">
                    {isEditing ? (
                      <input
                        type="number"
                        value={invoice.total_income}
                        onChange={(e) =>
                          handleInvoiceChange(e, invoice.id, "total_income")
                        }
                      />
                    ) : (
                      `$${parseFloat(invoice.total_income || 0).toFixed(2)}`
                    )}
                  </td>
                  {isEditing && (
                    <td data-label="Actions">
                      <button
                        className={styles.deleteButton}
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
                <td colSpan="4">
                  <strong>TOTAL:</strong>
                </td>
                <td>
                  <strong>${totalIncome.toFixed(2)}</strong>
                </td>
                {isEditing && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <aside className={styles.sidebar}>
        <AddressHistory
          allPeople={allPeople}
          currentAddress={newInvoice.address}
          currentPersonId={person.id}
          onPersonClick={handleHistoryPersonClick}
        />
      </aside>

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
