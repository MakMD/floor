import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const useCompanies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);

    // ОНОВЛЕНО: Викликаємо нашу нову RPC-функцію замість прямого запиту до таблиці
    const { data, error } = await supabase.rpc("get_companies_with_counts");

    if (error) {
      toast.error("Error fetching companies.");
      console.error("RPC Error:", error);
      setCompanies([]);
    } else {
      // Дані вже приходять у потрібному форматі
      setCompanies(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  return { companies, loading, refetch: fetchCompanies };
};
