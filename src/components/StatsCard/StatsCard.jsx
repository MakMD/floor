// src/components/StatsCard/StatsCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StatsCard.module.css";
import { FaArrowUp, FaArrowDown } from "react-icons/fa";

const StatsCard = ({ title, value, icon, description, change, link }) => {
  const navigate = useNavigate();
  const isPositive = change && change.startsWith("+");

  const handleNavigate = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div className={styles.cardContainer} onClick={handleNavigate}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div className={styles.titleWrapper}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardValue}>{value}</p>
        </div>
      </div>
      <p className={styles.cardDescription}>{description}</p>
      <div className={styles.footer}>
        {change && (
          <span
            className={`${styles.changeIndicator} ${
              isPositive ? styles.positive : styles.negative
            }`}
          >
            {isPositive ? <FaArrowUp /> : <FaArrowDown />} {change}
          </span>
        )}
        {link && <span className={styles.detailsLink}>View Details →</span>}
      </div>
    </div>
  );
};

export default StatsCard;
