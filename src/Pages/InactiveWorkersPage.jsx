// src/Pages/InactiveWorkersPage.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { usePeople } from "../hooks/usePeople"; // ІМПОРТ
import PeopleList from "../components/PeopleList/PeopleList";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import styles from "./CompanyListPage.module.css"; // Перевикористовуємо стилі

const InactiveWorkersPage = () => {
  const { people, loading, refetch } = usePeople(); // ВИКОРИСТАННЯ
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleToggleStatus = async (personId) => {
    const { error } = await supabase
      .from("people")
      .update({ status: "active" })
      .eq("id", personId);
    if (error) console.error("Error updating person status:", error);
    else await refetch();
  };

  const handleUpdatePersonName = async (personId, newName) => {
    const { error } = await supabase
      .from("people")
      .update({ name: newName })
      .eq("id", personId);
    if (error) console.error("Error updating person name:", error);
    else await refetch();
  };

  const inactivePeople = people.filter((p) => p.status === "inactive");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          Back to Main
        </button>
        <h1 className={styles.pageTitle}>Inactive Workers</h1>
        <div className={styles.controls}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={styles.editButton}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonLoader count={4} />
      ) : inactivePeople.length > 0 ? (
        <PeopleList
          people={inactivePeople}
          isEditing={isEditing}
          onToggleStatus={handleToggleStatus}
          onUpdatePersonName={handleUpdatePersonName}
        />
      ) : (
        <EmptyState message="There are no inactive workers." />
      )}
    </div>
  );
};

export default InactiveWorkersPage;
