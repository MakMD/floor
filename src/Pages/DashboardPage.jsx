// makmd/floor/floor-ec2a015c38c9b806424861b2badc2086be27f9c6/src/Pages/DashboardPage.jsx

import React from "react";
import styles from "./DashboardPage.module.css";
import ReminderPanel from "../components/ReminderPanel/ReminderPanel";
import StatsCard from "../components/StatsCard/StatsCard";
import { FaDollarSign, FaHardHat, FaWarehouse } from "react-icons/fa";
import { useAnalytics } from "../hooks/useAnalytics";

const DashboardPage = () => {
  const { stats, loading } = useAnalytics();

  // ... (решта логіки компонента залишається без змін) ...
  const incomeChange =
    stats.prevMonthIncome === 0
      ? 0
      : ((stats.totalIncome - stats.prevMonthIncome) / stats.prevMonthIncome) *
        100;
  const incomeComparisonText = `${
    incomeChange >= 0 ? "+" : ""
  }${incomeChange.toFixed(1)}% vs last month`;

  const materialsComparisonText = `${
    stats.materialsUsed - stats.prevWeekMaterials
  } vs last week`;

  const projectsBreakdown = stats.projectsBreakdown.map((item) => ({
    label: item.status,
    value: item.count,
  }));

  const totalProjects = stats.activeProjects;
  const progressBarData =
    totalProjects > 0
      ? stats.projectsBreakdown.map((item) => {
          let color = "";
          switch (item.status) {
            case "Ready":
              color = "var(--color-success)";
              break;
            case "In Process":
              color = "var(--color-warning)";
              break;
            case "Not Finished":
              color = "var(--color-danger)";
              break;
            default:
              color = "var(--color-secondary)";
          }
          return {
            value: (item.count / totalProjects) * 100,
            color: color,
            label: `${item.status}: ${item.count}`,
          };
        })
      : [];

  const incomeDetails = [
    {
      label: "Gross Income",
      value: `$${Number(stats.totalIncome).toLocaleString()}`,
    },
    {
      label: "Worker Payouts",
      value: `-$${Number(stats.totalPayouts).toLocaleString()}`,
    },
    {
      label: "Net Profit",
      value: `$${(stats.totalIncome - stats.totalPayouts).toLocaleString()}`,
    },
  ];

  return (
    <div className={styles.pageContainer}>
      {/* ОНОВЛЕНИЙ БЛОК ЗАГОЛОВКА */}
      <div className={styles.titleContainer}>
        <h1 className={styles.pageTitle}>Dashboard</h1>
      </div>
      <div className={styles.layout}>
        <div className={styles.mainContent}>
          <ReminderPanel />
        </div>
        <aside className={styles.sidebar}>
          <div className={styles.statsGrid}>
            <StatsCard
              title="Financials (Current Month)"
              value={
                loading
                  ? "..."
                  : `$${(
                      stats.totalIncome - stats.totalPayouts
                    ).toLocaleString()}`
              }
              icon={<FaDollarSign />}
              details={loading ? [] : incomeDetails}
              comparisonText={loading ? "..." : incomeComparisonText}
              link="/calendar"
            />
            <StatsCard
              title="Active Projects"
              value={loading ? "..." : stats.activeProjects}
              icon={<FaHardHat />}
              details={loading ? [] : projectsBreakdown}
              progressBar={loading ? [] : progressBarData}
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
