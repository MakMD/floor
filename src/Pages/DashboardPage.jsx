// makmd/floor/floor-65963b367ef8c4d4dde3af32af465a056bcb8db5/src/Pages/DashboardPage.jsx

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
  const incomeComparisonText = `${
    incomeChange >= 0 ? "+" : ""
  }${incomeChange.toFixed(1)}% vs last month`;

  // Формування рядка для порівняння матеріалів
  const materialsComparisonText = `${
    stats.materialsUsed - stats.prevWeekMaterials
  } vs last week`;

  // ОНОВЛЕНО: Додано розрахунки та дані для індикатора прогресу
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

  // Формування розбивки для картки доходів
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
      <h1 className={styles.pageTitle}>Dashboard</h1>
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
              progressBar={loading ? [] : progressBarData} // ОНОВЛЕНО: Передаємо дані для індикатора
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
