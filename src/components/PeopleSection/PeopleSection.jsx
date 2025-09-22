// src/components/PeopleSection/PeopleSection.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { usePeople } from "../../hooks/usePeople"; // ІМПОРТ: Використовуємо хук
import PeopleList from "../PeopleList/PeopleList";
import SkeletonLoader from "../SkeletonLoader/SkeletonLoader";
import EmptyState from "../EmptyState/EmptyState";
import { FaPlus, FaUsersSlash, FaEdit, FaCheck } from "react-icons/fa";
import styles from "./PeopleSection.module.css";
import toast from "react-hot-toast";

const PeopleSection = () => {
  const { people, loading: isLoading, refetch: onPeopleUpdate } = usePeople(); // ВИКОРИСТАННЯ ХУКА
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const navigate = useNavigate();

  const handleCreatePerson = async () => {
    if (newName.trim() === "") return;
    setAddLoading(true);
    const newPersonData = { name: newName.trim(), status: "active" };
    const { error } = await supabase.from("people").insert([newPersonData]);
    if (error) {
      toast.error("Error creating person.");
    } else {
      setNewName("");
      setIsAdding(false);
      onPeopleUpdate(); // Оновлюємо список через refetch
    }
    setAddLoading(false);
  };

  const handleToggleStatus = async (personId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("people")
      .update({ status: newStatus })
      .eq("id", personId);
    if (error) toast.error("Error updating status.");
    else onPeopleUpdate();
  };

  const handleUpdatePersonName = async (personId, newName) => {
    const { error } = await supabase
      .from("people")
      .update({ name: newName })
      .eq("id", personId);
    if (error) toast.error("Error updating name.");
    else onPeopleUpdate();
  };

  const activePeople = people.filter((p) => p.status === "active");

  return (
    <div className={styles.peopleSectionContainer}>
      <div className={styles.titleContainer}>
        <h2 className={styles.sectionTitle}>People</h2>
        <div className={styles.controls}>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className={`${styles.controlButton} ${styles.addButton}`}
            >
              <FaPlus /> Add Worker
            </button>
          )}
          <button
            onClick={() => navigate("/inactive-workers")}
            className={`${styles.controlButton} ${styles.inactiveLink}`}
          >
            <FaUsersSlash /> Inactive
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`${styles.controlButton} ${styles.editButton}`}
          >
            {isEditing ? (
              <>
                <FaCheck /> Done
              </>
            ) : (
              <>
                <FaEdit /> Edit
              </>
            )}
          </button>
        </div>
      </div>

      {isAdding && (
        <div className={styles.createPersonForm}>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter person name"
            className={styles.inputField}
            disabled={addLoading}
          />
          <button
            onClick={handleCreatePerson}
            className={styles.createButton}
            disabled={addLoading}
          >
            {addLoading ? "Creating..." : "Create"}
          </button>
          <button
            onClick={() => setIsAdding(false)}
            className={styles.cancelButton}
          >
            Cancel
          </button>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader count={6} />
      ) : activePeople.length > 0 ? (
        <PeopleList
          people={activePeople}
          isEditing={isEditing}
          onToggleStatus={handleToggleStatus}
          onUpdatePersonName={handleUpdatePersonName}
        />
      ) : (
        <EmptyState message="No active workers found. Add one to get started!">
          <button
            onClick={() => setIsAdding(true)}
            className={`${styles.controlButton} ${styles.addButton}`}
          >
            <FaPlus /> Add First Worker
          </button>
        </EmptyState>
      )}
    </div>
  );
};

export default PeopleSection;
