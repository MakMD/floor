import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const useAdminLists = () => {
  const [builders, setBuilders] = useState([]);
  const [stores, setStores] = useState([]);
  const [workTypeTemplates, setWorkTypeTemplates] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [products, setProducts] = useState([]); // Додано стейт
  const [loading, setLoading] = useState(true);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const [buildersRes, storesRes, workTypesRes, materialsRes, productsRes] =
        await Promise.all([
          supabase.from("builders").select("id, name").order("name"),
          supabase.from("stores").select("id, name").order("name"),
          supabase.from("work_type_templates").select("id, name").order("name"),
          supabase.from("materials").select("id, name").order("name"),
          supabase.from("products").select("id, name").order("name"), // Додано запит
        ]);

      if (buildersRes.error) throw buildersRes.error;
      if (storesRes.error) throw storesRes.error;
      if (workTypesRes.error) throw workTypesRes.error;
      if (materialsRes.error) throw materialsRes.error;
      if (productsRes.error) throw productsRes.error; // Перевірка помилок

      setBuilders(buildersRes.data);
      setStores(storesRes.data);
      setWorkTypeTemplates(workTypesRes.data);
      setMaterials(materialsRes.data);
      setProducts(productsRes.data); // Збереження результатів
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

  return { builders, stores, workTypeTemplates, materials, products, loading }; // Додано products у return
};
