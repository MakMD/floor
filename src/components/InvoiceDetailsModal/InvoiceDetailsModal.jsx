// src/components/InvoiceDetailsModal/InvoiceDetailsModal.jsx

import React from "react";
import Modal from "../Modal/Modal"; // ІМПОРТ
import styles from "./InvoiceDetailsModal.module.css";

const InvoiceDetailsModal = ({ invoice, onClose }) => {
  if (!invoice) return null;

  return (
    <Modal title="Invoice Details" onClose={onClose}>
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
    </Modal>
  );
};

export default InvoiceDetailsModal;
