// src/components/StatsPanel/StatsPanel.jsx
import React from "react";
import styles from "./StatsPanel.module.css";
import { useAnalytics } from "../../hooks/useAnalytics";

const StatsPanel = () => {
  const { stats, loading } = useAnalytics();

  if (loading) {
    return (
      <div className={styles.statsPanel}>
        <h3>Analytics</h3>
        <p>Loading stats...</p>
      </div>
    );
  }

  return (
    <div className={styles.statsPanel}>
      <h3>Month Analytics</h3>
      <div className={styles.statItem}>
        <span>Projects this month</span>
        <strong>{stats.addressCount}</strong>
      </div>
      <div className={styles.statItem}>
        <span>Total Income</span>
        <strong>${stats.totalIncome.toFixed(2)}</strong>
      </div>
      <div className={styles.statItem}>
        <span>Worker Payouts</span>
        <strong>${stats.totalPayouts.toFixed(2)}</strong>
      </div>
      <div className={styles.statItem}>
        <span>Net Profit</span>
        <strong className={styles.netProfit}>
          ${stats.netProfit.toFixed(2)}
        </strong>
      </div>
    </div>
  );
};

export default StatsPanel;
