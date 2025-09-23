// src/hooks/useAddresses.js

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const useAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    // ВИПРАВЛЕНО: Змінено сортування з 'created_at' на 'date'
    const { data, error } = await supabase
      .from("addresses")
      .select("*, builders(*), stores(*)")
      .order("date", { ascending: false }); // Сортуємо за датою

    if (error) {
      toast.error("Error fetching addresses.");
      console.error("Supabase error:", error);
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
