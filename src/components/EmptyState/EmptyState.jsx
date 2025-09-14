// src/components/EmptyState/EmptyState.jsx
import React from "react";
import styles from "./EmptyState.module.css";

const EmptyState = ({ message, children }) => {
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.icon}>📭</div>
      <p className={styles.message}>{message}</p>
      {children}
    </div>
  );
};

export default EmptyState;
