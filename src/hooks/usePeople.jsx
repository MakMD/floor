// makmd/floor/floor-ec2a015c38c9b806424861b2badc2086be27f9c6/src/hooks/usePeople.jsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

export const usePeople = () => {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPeople = useCallback(async () => {
    setLoading(true);
    // ОНОВЛЕНО: витягуємо всі поля, включаючи 'phone'
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      toast.error("Error fetching people.");
      setPeople([]);
    } else {
      const peopleWithStatus = data.map((person) => ({
        ...person,
        status: person.status || "active",
      }));
      setPeople(peopleWithStatus);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

  return { people, loading, refetch: fetchPeople };
};
