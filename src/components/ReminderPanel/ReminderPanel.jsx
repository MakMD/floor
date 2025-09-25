// src/components/ReminderPanel/ReminderPanel.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import styles from "./ReminderPanel.module.css";
import { FaExclamationTriangle } from "react-icons/fa";

const ReminderPanel = () => {
  const [overdue, setOverdue] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOverdueAddresses = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_overdue_addresses");

      if (error) {
        console.error("Error fetching overdue addresses:", error);
      } else {
        setOverdue(data || []);
      }
      setLoading(false);
    };

    fetchOverdueAddresses();
  }, []);

  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <FaExclamationTriangle className={styles.icon} />
        <h2 className={styles.panelTitle}>Overdue Addresses</h2>
      </div>
      {loading ? (
        <p>Loading reminders...</p>
      ) : overdue.length > 0 ? (
        <ul className={styles.reminderList}>
          {overdue.map((item) => (
            <li
              key={item.id}
              className={styles.reminderItem}
              onClick={() => navigate(`/address/${item.id}`)}
            >
              <div className={styles.itemContent}>
                <span className={styles.addressName}>{item.address}</span>
                <span className={styles.dateInfo}>Was due on: {item.date}</span>
              </div>
              <span className={styles.statusTag}>{item.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noReminders}>No overdue addresses. Great job!</p>
      )}
    </div>
  );
};

export default ReminderPanel;
