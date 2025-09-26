// src/Pages/DashboardPage.jsx
import React from "react";
import styles from "./DashboardPage.module.css";
import ReminderPanel from "../components/ReminderPanel/ReminderPanel";
import StatsCard from "../components/StatsCard/StatsCard";
import { FaDollarSign, FaHardHat, FaWarehouse } from "react-icons/fa";
import { useAnalytics } from "../hooks/useAnalytics";

const DashboardPage = () => {
  const { stats, loading } = useAnalytics();

  // Обчислення відсоткової зміни для доходу
  const incomeChange =
    stats.prevMonthIncome === 0
      ? 0
      : ((stats.totalIncome - stats.prevMonthIncome) / stats.prevMonthIncome) *
        100;

  // Формування рядка для порівняння доходу
  const incomeComparisonText = `${
    incomeChange >= 0 ? "+" : ""
  }${incomeChange.toFixed(1)}% vs last month`;

  // Формування рядка для порівняння матеріалів
  const materialsComparisonText = `${
    stats.materialsUsed - stats.prevWeekMaterials
  } vs last week`;

  // Формування розбивки проектів
  const projectsBreakdown = stats.projectsBreakdown.map((item) => ({
    label: item.status,
    value: item.count,
  }));

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Dashboard</h1>
      <div className={styles.layout}>
        <div className={styles.mainContent}>
          <ReminderPanel />
        </div>
        <aside className={styles.sidebar}>
          <div className={styles.statsGrid}>
            <StatsCard
              title="Income (Current Month)"
              value={
                loading
                  ? "..."
                  : `$${Number(stats.totalIncome).toLocaleString()}`
              }
              icon={<FaDollarSign />}
              comparisonText={loading ? "..." : incomeComparisonText}
              link="/calendar"
            />
            <StatsCard
              title="Active Projects"
              value={loading ? "..." : stats.activeProjects}
              icon={<FaHardHat />}
              details={loading ? [] : projectsBreakdown}
              link="/addresses"
            />
            <StatsCard
              title="Materials Used (This Week)"
              value={loading ? "..." : `${stats.materialsUsed} units`}
              icon={<FaWarehouse />}
              comparisonText={loading ? "..." : materialsComparisonText}
              link="/admin"
            />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default DashboardPage;
