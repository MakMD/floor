// src/hooks/usePeople.jsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const usePeople = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPeople = useCallback(async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        throw error; // Перекидаємо помилку в блок catch
      }

      // ЗАХИСТ: якщо data раптом null, робимо його порожнім масивом []
      const safeData = data || [];

      const peopleWithStatus = safeData.map((person) => ({
        ...person,
        status: person.status || "active",
      }));

      setPeople(peopleWithStatus);
    } catch (error) {
      console.error("Помилка завантаження працівників:", error.message);
      toast.error("Error fetching people.");
      setPeople([]); // У разі помилки віддаємо порожній список, щоб не ламати UI
    } finally {
      // ЦЕЙ БЛОК ВИКОНАЄТЬСЯ ЗАВЖДИ, знімаючи зависання
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  return { people, loading, refetch: fetchPeople };
};
