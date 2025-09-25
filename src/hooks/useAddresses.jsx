// src/hooks/useAddresses.jsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";

export const useAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    // ОНОВЛЕНО: Додано 'project_type' до запиту
    const { data, error } = await supabase
      .from("addresses")
      .select("*, builders(*), stores(*)");

    if (error) {
      toast.error("Error fetching addresses.");
      console.error("Supabase error:", error);
      setAddresses([]);
    } else {
      const todayString = format(new Date(), "yyyy-MM-dd");

      const todayAddresses = data.filter(
        (address) => address.date === todayString
      );
      const otherAddresses = data.filter(
        (address) => address.date !== todayString
      );

      otherAddresses.sort((a, b) => {
        return parseISO(b.date) - parseISO(a.date);
      });

      setAddresses([...todayAddresses, ...otherAddresses]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return { addresses, loading, refetch: fetchAddresses };
};
