// src/hooks/useAddresses.js

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const useAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("id, address, date")
      .order("address", { ascending: true });

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
