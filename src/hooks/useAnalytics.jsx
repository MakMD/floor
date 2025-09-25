// src/hooks/useAnalytics.jsx
import { useState, useEffect, useMemo } from "react";
import { supabase } from "../supabaseClient";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const useAnalytics = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const today = new Date();
      const startOfCurrentMonth = startOfMonth(today);
      const endOfCurrentMonth = endOfMonth(today);

      const { data, error } = await supabase
        .from("addresses")
        .select("*, work_types(payment_amount)")
        .gte("date", format(startOfCurrentMonth, "yyyy-MM-dd"))
        .lte("date", format(endOfCurrentMonth, "yyyy-MM-dd"));

      if (error) {
        console.error(error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    fetchEvents();
  }, []);

  const stats = useMemo(() => {
    const calculateTotals = (eventList) => {
      return eventList.reduce(
        (acc, event) => {
          acc.totalIncome += event.total_amount || 0;
          const payments =
            event.work_types?.reduce(
              (sum, wt) => sum + (wt.payment_amount || 0),
              0
            ) || 0;
          acc.totalPayouts += payments;
          return acc;
        },
        { totalIncome: 0, totalPayouts: 0 }
      );
    };

    const currentMonthTotals = calculateTotals(events);

    return {
      ...currentMonthTotals,
      netProfit:
        currentMonthTotals.totalIncome - currentMonthTotals.totalPayouts,
      addressCount: events.length,
    };
  }, [events]);

  return { stats, loading };
};
