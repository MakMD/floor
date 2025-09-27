// src/components/PersonStats/PersonStats.jsx

import React from "react";
import { FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import styles from "./PersonStats.module.css";

const PersonStats = ({ stats, loading }) => {
  return (
    <div className={styles.statsContainer}>
      <h3 className={styles.title}>Worker Performance</h3>
      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <ul className={styles.personList}>
          {stats.length > 0 ? (
            stats.map((person) => (
              <li key={person.person_id} className={styles.personItem}>
                <span className={styles.personName}>{person.name}</span>
                <div className={styles.metrics}>
                  <span className={`${styles.metric} ${styles.ready}`}>
                    <FaCheckCircle /> {person.ready_count}
                  </span>
                  <span className={`${styles.metric} ${styles.notFinished}`}>
                    <FaExclamationCircle /> {person.not_finished_count}
                  </span>
                </div>
              </li>
            ))
          ) : (
            <p className={styles.noData}>No performance data available.</p>
          )}
        </ul>
      )}
    </div>
  );
};

export default PersonStats;
