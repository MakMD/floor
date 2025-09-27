// makmd/floor/floor-65963b367ef8c4d4dde3af32af465a056bcb8db5/src/components/StatsCard/StatsCard.jsx

import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "./StatsCard.module.css";
import { FaArrowUp, FaArrowDown, FaArrowRight } from "react-icons/fa";

// ОНОВЛЕНО: Додано новий проп progressBar
const StatsCard = ({
  title,
  value,
  icon,
  comparisonText,
  details,
  link,
  progressBar,
}) => {
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

      {/* ОНОВЛЕНО: Умовний рендеринг індикатора прогресу */}
      {progressBar && progressBar.length > 0 && (
        <div className={styles.progressBarContainer}>
          {progressBar.map((segment, index) => (
            <div
              key={index}
              className={styles.progressBarSegment}
              style={{
                width: `${segment.value}%`,
                backgroundColor: segment.color,
              }}
              title={segment.label}
            />
          ))}
        </div>
      )}

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
