// src/hooks/useAdminLists.js

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const useAdminLists = () => {
  const [builders, setBuilders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const [buildersRes, storesRes] = await Promise.all([
        supabase.from("builders").select("id, name").order("name"),
        supabase.from("stores").select("id, name").order("name"),
      ]);

      if (buildersRes.error) throw buildersRes.error;
      if (storesRes.error) throw storesRes.error;

      setBuilders(buildersRes.data);
      setStores(storesRes.data);
    } catch (error) {
      toast.error("Could not load reference lists.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return { builders, stores, loading };
};
