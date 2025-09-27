// makmd/floor/floor-ec2a015c38c9b806424861b2badc2086be27f9c6/src/hooks/useAnalytics.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export const useAnalytics = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    prevMonthIncome: 0,
    totalPayouts: 0,
    activeProjects: 0,
    projectsBreakdown: [],
    materialsUsed: 0,
    prevWeekMaterials: 0,
    // НОВІ ПОЛЯ ДЛЯ СТАТИСТИКИ
    materialsUsage: [],
    personStats: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Додаємо виклики нових функцій
        const [
          incomeRes,
          prevIncomeRes,
          payoutsRes,
          projectsRes,
          breakdownRes,
          materialsRes,
          prevMaterialsRes,
          materialsUsageRes, // Новий запит
          personStatsRes, // Новий запит
        ] = await Promise.all([
          supabase.rpc("get_total_income_current_month"),
          supabase.rpc("get_total_income_previous_month"),
          supabase.rpc("get_total_payouts_current_month"),
          supabase.rpc("get_active_projects_count"),
          supabase.rpc("get_active_projects_breakdown"),
          supabase.rpc("get_materials_used_this_week"),
          supabase.rpc("get_materials_used_last_week"),
          supabase.rpc("get_materials_usage_stats"), // Виклик функції
          supabase.rpc("get_person_stats"), // Виклик функції
        ]);

        if (incomeRes.error) throw incomeRes.error;
        if (prevIncomeRes.error) throw prevIncomeRes.error;
        if (payoutsRes.error) throw payoutsRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (breakdownRes.error) throw breakdownRes.error;
        if (materialsRes.error) throw materialsRes.error;
        if (prevMaterialsRes.error) throw prevMaterialsRes.error;
        if (materialsUsageRes.error) throw materialsUsageRes.error; // Обробка помилки
        if (personStatsRes.error) throw personStatsRes.error; // Обробка помилки

        setStats({
          totalIncome: incomeRes.data[0]?.total_income || 0,
          prevMonthIncome: prevIncomeRes.data[0]?.total_income || 0,
          totalPayouts: payoutsRes.data[0]?.total_payouts || 0,
          activeProjects: projectsRes.data[0]?.active_projects_count || 0,
          projectsBreakdown: breakdownRes.data || [],
          materialsUsed: materialsRes.data[0]?.materials_used_count || 0,
          prevWeekMaterials:
            prevMaterialsRes.data[0]?.materials_used_count || 0,
          // Зберігаємо нові дані
          materialsUsage: materialsUsageRes.data || [],
          personStats: personStatsRes.data || [],
        });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return { stats, loading };
};
