// src/components/StatsCard/StatsCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StatsCard.module.css";
import { FaArrowUp, FaArrowDown, FaArrowRight } from "react-icons/fa";

const StatsCard = ({ title, value, icon, comparisonText, details, link }) => {
  const navigate = useNavigate();
  const isPositive =
    comparisonText &&
    (comparisonText.startsWith("+") || parseFloat(comparisonText) > 0);
  const isNegative =
    comparisonText &&
    (comparisonText.startsWith("-") || parseFloat(comparisonText) < 0);

  const handleNavigate = () => {
    if (link) {
      navigate(link);
    }
  };

  return (
    <div
      className={`${styles.cardContainer} ${link ? styles.clickable : ""}`}
      onClick={handleNavigate}
    >
      <div className={styles.header}>
        <div className={styles.iconWrapper}>{icon}</div>
        <div className={styles.titleWrapper}>
          <h3 className={styles.cardTitle}>{title}</h3>
          <p className={styles.cardValue}>{value}</p>
        </div>
      </div>

      {details && (
        <div className={styles.detailsSection}>
          {details.map((item, index) => (
            <div key={index} className={styles.detailItem}>
              <span className={styles.detailLabel}>{item.label}</span>
              <span className={styles.detailValue}>{item.value}</span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.footer}>
        {comparisonText && (
          <span
            className={`${styles.changeIndicator} ${
              isPositive ? styles.positive : ""
            } ${isNegative ? styles.negative : ""}`}
          >
            {isPositive && <FaArrowUp />}
            {isNegative && <FaArrowDown />}
            {comparisonText}
          </span>
        )}
        {link && (
          <span className={styles.detailsLink}>
            View More <FaArrowRight />
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
