// src/components/PersonDetailsModal/PersonDetailsModal.jsx

import React from "react";
import { FaTimes, FaRegListAlt } from "react-icons/fa";
import styles from "./PersonDetailsModal.module.css";

const PersonDetailsModal = ({ person, filterAddress, onClose }) => {
  // --- ДІАГНОСТИКА ---
  // Ми виведемо в консоль, які саме дані отримало модальне вікно
  console.log("--- Modal Diagnostics ---");
  console.log("Received person:", person?.name);
  console.log("Received filterAddress:", filterAddress);
  // ---------------------

  if (!person) return null;

  const getFilteredTables = () => {
    const sourceTables = person.tables || [];

    if (!filterAddress || filterAddress.trim() === "") {
      console.log("Filter address is empty, showing all tables.");
      return sourceTables;
    }

    const lowercasedFilter = filterAddress.toLowerCase();
    console.log("Filtering by address:", lowercasedFilter);

    const filteredTables = sourceTables
      .map((table) => {
        const matchingInvoices = (table.invoices || []).filter(
          (invoice) =>
            invoice.address &&
            invoice.address.toLowerCase().includes(lowercasedFilter)
        );
        return { ...table, invoices: matchingInvoices };
      })
      .filter((table) => table.invoices.length > 0);

    console.log("Filtered tables result:", filteredTables);
    return filteredTables;
  };

  const displayedTables = getFilteredTables().sort((a, b) =>
    b.name.localeCompare(a.name)
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          <FaTimes />
        </button>
        <h2 className={styles.title}>{person.name}</h2>
        {filterAddress && (
          <p className={styles.filterNotice}>
            Showing invoices for: <strong>{filterAddress}</strong>
          </p>
        )}

        <div className={styles.content}>
          <h3 className={styles.subtitle}>Invoice Tables</h3>
          {displayedTables.length > 0 ? (
            <ul className={styles.tableList}>
              {displayedTables.map((table) => {
                const invoiceCount = table.invoices?.length || 0;
                const totalIncome =
                  table.invoices?.reduce(
                    (sum, inv) => sum + parseFloat(inv.total_income || 0),
                    0
                  ) || 0;
                return (
                  <li key={table.tableId} className={styles.tableItem}>
                    <div className={styles.tableIcon}>
                      <FaRegListAlt />
                    </div>
                    <div className={styles.tableInfo}>
                      <span className={styles.tableName}>{table.name}</span>
                      <div className={styles.tableStats}>
                        <span>
                          Invoices: <strong>{invoiceCount}</strong>
                        </span>
                        <span>
                          Total: <strong>${totalIncome.toFixed(2)}</strong>
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
        </div>
      </div>
    </div>
  );
};

export default PersonDetailsModal;
