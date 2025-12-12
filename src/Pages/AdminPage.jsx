import React from "react";
import AdminListManager from "../components/AdminListManager/AdminListManager";
import styles from "./AdminPage.module.css";
import {
  FaStore,
  FaHardHat,
  FaPaintRoller,
  FaClipboardList,
} from "react-icons/fa"; // ІМПОРТ: Нова іконка

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
        {/* --- НОВА КАРТКА ДЛЯ ТИПІВ РОБІТ --- */}
        <div className={styles.managerCard}>
          <div className={styles.cardHeader}>
            <FaClipboardList className={styles.cardIcon} />
            <h2>Work Types</h2>
          </div>
          <AdminListManager
            tableName="work_type_templates"
            itemName="work type"
          />
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
