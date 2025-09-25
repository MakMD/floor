// src/Pages/DashboardPage.jsx
import React from "react";
import styles from "./DashboardPage.module.css";
import ReminderPanel from "../components/ReminderPanel/ReminderPanel";
import StatsPanel from "../components/StatsPanel/StatsPanel"; // Import StatsPanel

const DashboardPage = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <div className={styles.layout}>
        <div className={styles.mainContent}>
          <ReminderPanel />
          {/* Other main content can go here */}
        </div>
        <aside className={styles.sidebar}>
          <StatsPanel />
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
