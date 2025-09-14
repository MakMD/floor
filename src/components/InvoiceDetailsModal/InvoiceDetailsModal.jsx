// src/components/InvoiceDetailsModal/InvoiceDetailsModal.jsx

import React from "react";
import styles from "./InvoiceDetailsModal.module.css";

const InvoiceDetailsModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Invoice Details</h2>
          <button className={styles.closeButton} onClick={onClose}>
            &times;
          </button>
        </div>
        <div className={styles.details}>
          <p>
            <strong>Address:</strong> {invoice.address}
          </p>
          <p>
            <strong>Date:</strong> {invoice.date}
          </p>
          <p>
            <strong>Total Income:</strong> $
            {parseFloat(invoice.total_income || 0).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InvoiceDetailsModal;
