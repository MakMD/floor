import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const useAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAddresses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("addresses")
        .select(
          `
          *,
          builders(name),
          stores(name),
          work_orders(product_id)
        `,
        )
        .eq("is_deleted", false) // Правильне розташування: суворо після select()
        .order("date", { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setAddresses(data || []);
    } catch (err) {
      console.error("Error fetching addresses:", err.message);
      setError(err.message);
      toast.error("Failed to load projects.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  return { addresses, loading, error, refetch: fetchAddresses };
};
