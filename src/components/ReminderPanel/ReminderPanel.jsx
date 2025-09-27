// makmd/floor/floor-65963b367ef8c4d4dde3af32af465a056bcb8db5/src/components/ReminderPanel/ReminderPanel.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import styles from "./ReminderPanel.module.css";
import { FaExclamationTriangle } from "react-icons/fa";

const ReminderPanel = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReminders = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc(
        "get_projects_requiring_attention"
      );

      if (error) {
        console.error("Error fetching reminders:", error);
      } else {
        setReminders(data || []);
      }
      setLoading(false);
    };

    fetchReminders();
  }, []);

  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <FaExclamationTriangle className={styles.icon} />
        <h2 className={styles.panelTitle}>Action Required</h2>
      </div>
      {loading ? (
        <p>Loading reminders...</p>
      ) : reminders.length > 0 ? (
        <ul className={styles.reminderList}>
          {reminders.map((item) => (
            <li
              key={item.id}
              className={styles.reminderItem}
              onClick={() => navigate(`/address/${item.id}`)}
            >
              <div className={styles.itemContent}>
                <span className={styles.addressName}>{item.address}</span>
                <span className={styles.dateInfo}>
                  {item.status === "Not Finished"
                    ? `Status: Not Finished (Date: ${item.date})`
                    : `Was due on: ${item.date}`}
                </span>
              </div>
              <span className={styles.statusTag}>{item.status}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noReminders}>
          No projects require immediate attention. Great job!
        </p>
      )}
    </div>
  );
};

export default ReminderPanel;
