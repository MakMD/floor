// src/Pages/AdminPage.jsx

import React from "react";
import AdminListManager from "../components/AdminListManager/AdminListManager";
import styles from "./AdminPage.module.css";
import { FaStore, FaHardHat, FaPaintRoller } from "react-icons/fa";

const AdminPage = () => {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Admin Panel</h1>
      <p className={styles.pageSubtitle}>
        Manage your application's reference lists here.
      </p>
      <div className={styles.managersGrid}>
        <div className={styles.managerCard}>
          <div className={styles.cardHeader}>
            <FaHardHat className={styles.cardIcon} />
            <h2>Builders</h2>
          </div>
          <AdminListManager tableName="builders" itemName="builder" />
        </div>
        <div className={styles.managerCard}>
          <div className={styles.cardHeader}>
            <FaStore className={styles.cardIcon} />
            <h2>Stores</h2>
          </div>
          <AdminListManager tableName="stores" itemName="store" />
        </div>
        <div className={styles.managerCard}>
          <div className={styles.cardHeader}>
            <FaPaintRoller className={styles.cardIcon} />
            <h2>Materials</h2>
          </div>
          <AdminListManager tableName="materials" itemName="material" />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
