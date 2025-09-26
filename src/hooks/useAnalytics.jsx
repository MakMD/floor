// src/hooks/useAnalytics.jsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";

export const useAnalytics = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    prevMonthIncome: 0,
    activeProjects: 0,
    projectsBreakdown: [],
    materialsUsed: 0,
    prevWeekMaterials: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [
          incomeRes,
          prevIncomeRes,
          projectsRes,
          breakdownRes,
          materialsRes,
          prevMaterialsRes,
        ] = await Promise.all([
          supabase.rpc("get_total_income_current_month"),
          supabase.rpc("get_total_income_previous_month"),
          supabase.rpc("get_active_projects_count"),
          supabase.rpc("get_active_projects_breakdown"),
          supabase.rpc("get_materials_used_this_week"),
          supabase.rpc("get_materials_used_last_week"),
        ]);

        if (incomeRes.error) throw incomeRes.error;
        if (prevIncomeRes.error) throw prevIncomeRes.error;
        if (projectsRes.error) throw projectsRes.error;
        if (breakdownRes.error) throw breakdownRes.error;
        if (materialsRes.error) throw materialsRes.error;
        if (prevMaterialsRes.error) throw prevMaterialsRes.error;

        setStats({
          totalIncome: incomeRes.data[0]?.total_income || 0,
          prevMonthIncome: prevIncomeRes.data[0]?.total_income || 0,
          activeProjects: projectsRes.data[0]?.active_projects_count || 0,
          projectsBreakdown: breakdownRes.data || [],
          materialsUsed: materialsRes.data[0]?.materials_used_count || 0,
          prevWeekMaterials:
            prevMaterialsRes.data[0]?.materials_used_count || 0,
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
