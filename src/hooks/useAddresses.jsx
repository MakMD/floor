// src/hooks/useAddresses.js

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const useAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    // ОНОВЛЕНО: Запитуємо статус та імена з пов'язаних таблиць
    const { data, error } = await supabase
      .from("addresses")
      .select("id, address, date, status, builders(name), stores(name)")
      .order("created_at", { ascending: false }); // Сортуємо за датою створення

    if (error) {
      toast.error("Error fetching addresses.");
      setAddresses([]);
    } else {
      setAddresses(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return { addresses, loading, refetch: fetchAddresses };
};
