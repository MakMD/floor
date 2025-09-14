// src/components/SkeletonLoader/SkeletonLoader.jsx
import React from "react";
import styles from "./SkeletonLoader.module.css";

const SkeletonCard = () => (
  <div className={styles.skeletonCard}>
    <div className={`${styles.skeletonLine} ${styles.title}`}></div>
    <div className={`${styles.skeletonLine} ${styles.button}`}></div>
  </div>
);

const SkeletonLoader = ({ count = 6 }) => {
  return (
    <div className={styles.skeletonGrid}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
