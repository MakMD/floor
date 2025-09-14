// src/components/PersonDetailsModal/PersonDetailsModal.jsx

import React, { useState, useEffect } from "react";
import { FaTimes, FaRegListAlt, FaArrowLeft } from "react-icons/fa";
import styles from "./PersonDetailsModal.module.css";
import InvoiceDetailsModal from "../InvoiceDetailsModal/InvoiceDetailsModal";

const PersonDetailsModal = ({ person, filterAddress, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [filteredTables, setFilteredTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    if (!person || !person.tables) return;

    setLoading(true);
    const lowercasedFilter = filterAddress.toLowerCase();

    const tablesWithMatchingInvoices = person.tables
      .map((table) => {
        const matchingInvoices = (table.invoices || []).filter(
          (invoice) =>
            invoice.address &&
            invoice.address.toLowerCase().includes(lowercasedFilter)
        );
        return { ...table, invoices: matchingInvoices };
      })
      .filter((table) => table.invoices.length > 0)
      .sort((a, b) => b.name.localeCompare(a.name));

    setFilteredTables(tablesWithMatchingInvoices);
    setLoading(false);
  }, [person, filterAddress]);

  if (!person) return null;

  const handleTableClick = (table) => {
    setSelectedTable(table);
  };

  const handleInvoiceClick = (invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleCloseInvoiceModal = () => {
    setSelectedInvoice(null);
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          {/* Оновлений заголовок модального вікна з правильним розташуванням елементів */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              {selectedTable && (
                <button
                  className={styles.backButton}
                  onClick={() => setSelectedTable(null)}
                >
                  <FaArrowLeft /> Back
                </button>
              )}
            </div>
            <h2 className={styles.title}>{person.name}</h2>
            <button className={styles.closeButton} onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          {filterAddress && (
            <p className={styles.filterNotice}>
              Showing invoices for: <strong>{filterAddress}</strong>
            </p>
          )}

          <div className={styles.content}>
            {loading ? (
              <p>Loading tables...</p>
            ) : selectedTable ? (
              // Stage 2: Display invoices of the selected table
              <div className={styles.invoiceListContainer}>
                <h3 className={styles.subtitle}>
                  Invoices in "{selectedTable.name}"
                </h3>
                {selectedTable.invoices.length > 0 ? (
                  <ul className={styles.invoiceList}>
                    {selectedTable.invoices.map((invoice, index) => (
                      <li
                        key={index}
                        className={styles.invoiceItem}
                        onClick={() => handleInvoiceClick(invoice)}
                      >
                        <span className={styles.invoiceAddress}>
                          {invoice.address}
                        </span>
                        <span className={styles.invoiceDate}>
                          {invoice.date}
                        </span>
                        <span className={styles.invoiceIncome}>
                          ${parseFloat(invoice.total_income || 0).toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.noTablesMessage}>
                    No invoices found for this address in this table.
                  </p>
                )}
              </div>
            ) : (
              // Stage 1: Display filtered tables
              <>
                <h3 className={styles.subtitle}>Invoice Tables</h3>
                {filteredTables.length > 0 ? (
                  <ul className={styles.tableList}>
                    {filteredTables.map((table) => {
                      const invoiceCount = table.invoices?.length || 0;
                      const totalIncome =
                        table.invoices?.reduce(
                          (sum, inv) => sum + parseFloat(inv.total_income || 0),
                          0
                        ) || 0;
                      return (
                        <li
                          key={table.tableId}
                          className={styles.tableItem}
                          onClick={() => handleTableClick(table)}
                        >
                          <div className={styles.tableIcon}>
                            <FaRegListAlt />
                          </div>
                          <div className={styles.tableInfo}>
                            <span className={styles.tableName}>
                              {table.name}
                            </span>
                            <div className={styles.tableStats}>
                              <span>
                                Invoices: <strong>{invoiceCount}</strong>
                              </span>
                              <span>
                                Total:{" "}
                                <strong>${totalIncome.toFixed(2)}</strong>
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={styles.noTablesMessage}>
                    No matching invoices found for this person.
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      {/* Умовний рендеринг другого модального вікна */}
      {selectedInvoice && (
        <InvoiceDetailsModal
          invoice={selectedInvoice}
          onClose={handleCloseInvoiceModal}
        />
      )}
    </>
  );
};

export default PersonDetailsModal;
