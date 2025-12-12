// makmd/floor/floor-ec2a015c38c9b806424861b2badc2086be27f9c6/src/components/ReminderPanel/ReminderPanel.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import styles from "./ReminderPanel.module.css";
import {
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  parseISO,
  isWithinInterval,
} from "date-fns";

const ReminderPanel = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const navigate = useNavigate();

  const weekStartsOn = 1;

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

  const currentWeekStart = startOfWeek(currentDate, { weekStartsOn });
  const currentWeekEnd = endOfWeek(currentDate, { weekStartsOn });

  const filteredReminders = useMemo(() => {
    return reminders.filter((item) => {
      if (!item.date) return false;
      const itemDate = parseISO(item.date);
      return isWithinInterval(itemDate, {
        start: currentWeekStart,
        end: currentWeekEnd,
      });
    });
  }, [reminders, currentWeekStart, currentWeekEnd]);

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  const dateRangeLabel = `${format(currentWeekStart, "d MMM")} - ${format(
    currentWeekEnd,
    "d MMM"
  )}`;

  return (
    <div className={styles.panelContainer}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <FaExclamationTriangle className={styles.icon} />
          <h2 className={styles.panelTitle}>Action Required</h2>
          {/* НОВЕ: Бульбашка з загальною кількістю */}
          {reminders.length > 0 && (
            <span className={styles.totalBadge} title="Total pending items">
              {reminders.length}
            </span>
          )}
        </div>

        <div className={styles.weekControls}>
          <button onClick={prevWeek} className={styles.navButton}>
            <FaChevronLeft />
          </button>
          {/* НОВЕ: Контейнер для дати та лічильника тижня */}
          <div className={styles.weekInfo}>
            <span className={styles.weekLabel}>{dateRangeLabel}</span>
            <span className={styles.weekCount}>
              {filteredReminders.length}{" "}
              {filteredReminders.length === 1 ? "item" : "items"}
            </span>
          </div>
          <button onClick={nextWeek} className={styles.navButton}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading reminders...</p>
      ) : filteredReminders.length > 0 ? (
        <ul className={styles.reminderList}>
          {filteredReminders.map((item) => {
            const statusBackgroundClass =
              {
                Ready: styles.readyBackground,
                "In Process": styles.inProcessBackground,
                "Not Finished": styles.notFinishedBackground,
              }[item.status] || "";

            return (
              <li
                key={item.id}
                className={`${styles.reminderItem} ${statusBackgroundClass}`}
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
            );
          })}
        </ul>
      ) : (
        <div className={styles.emptyWeek}>
          <p className={styles.noReminders}>No items due this week.</p>
          {reminders.length > 0 && (
            <span className={styles.checkTotalHint}>
              (You have {reminders.length} pending items in total)
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReminderPanel;
