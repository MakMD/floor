import React, { useState } from "react";
import AdminListManager from "../components/AdminListManager/AdminListManager";
import styles from "./AdminPage.module.css";
import {
  FaStore,
  FaHardHat,
  FaPaintRoller,
  FaClipboardList,
  FaBox,
} from "react-icons/fa";
import { MdKeyboardArrowDown } from "react-icons/md"; // Додано іконку стрілочки

// Конфігурація всіх розділів для чистоти коду
const SECTIONS = [
  {
    id: "builders",
    title: "Builders",
    icon: FaHardHat,
    tableName: "builders",
    itemName: "builder",
  },
  {
    id: "stores",
    title: "Stores",
    icon: FaStore,
    tableName: "stores",
    itemName: "store",
  },
  {
    id: "materials",
    title: "Materials",
    icon: FaPaintRoller,
    tableName: "materials",
    itemName: "material",
  },
  {
    id: "workTypes",
    title: "Work Types",
    icon: FaClipboardList,
    tableName: "work_type_templates",
    itemName: "work type",
  },
  {
    id: "products",
    title: "Products",
    icon: FaBox,
    tableName: "products",
    itemName: "product",
  },
];

const AdminPage = () => {
  // Стан для збереження відкритих секцій
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileLayout}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>Admin Panel</h1>
          <p className={styles.pageSubtitle}>
            Manage your application's reference lists here.
          </p>
        </div>

        {/* Замість сітки тепер вертикальний список акордеонів */}
        <div className={styles.managersList}>
          {SECTIONS.map((sec) => (
            <div key={sec.id} className={styles.managerCard}>
              {/* Клікабельний заголовок */}
              <div
                className={`${styles.cardHeader} ${expandedSections[sec.id] ? styles.open : ""}`}
                onClick={() => toggleSection(sec.id)}
              >
                <div className={styles.headerTitleGroup}>
                  <sec.icon className={styles.cardIcon} />
                  <h2>{sec.title}</h2>
                </div>
                {/* Стрілочка, яка крутиться */}
                <MdKeyboardArrowDown
                  className={`${styles.chevron} ${expandedSections[sec.id] ? styles.open : ""}`}
                />
              </div>

              {/* Контент (рендериться тільки якщо секція відкрита) */}
              {expandedSections[sec.id] && (
                <div className={styles.cardContent}>
                  <AdminListManager
                    tableName={sec.tableName}
                    itemName={sec.itemName}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
