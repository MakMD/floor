import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import PeopleList from "../PeopleList/PeopleList";
import SkeletonLoader from "../SkeletonLoader/SkeletonLoader";
import EmptyState from "../EmptyState/EmptyState";
import { FaPlus, FaUsersSlash, FaEdit, FaCheck, FaTimes } from "react-icons/fa";
import styles from "./PeopleSection.module.css";
import commonStyles from "../../styles/common.module.css";
import toast from "react-hot-toast";

const PeopleSection = () => {
  const [people, setPeople] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const navigate = useNavigate();

  const fetchPeople = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("people")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      const safeData = data || [];
      const peopleWithStatus = safeData.map((person) => ({
        ...person,
        status: person.status || "active",
      }));
      setPeople(peopleWithStatus);
    } catch (error) {
      console.error("Помилка завантаження працівників:", error.message);
      toast.error("Error fetching people.");
      setPeople([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPeople();
  }, [fetchPeople]);

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
      fetchPeople();
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
    else fetchPeople();
  };

  const handleUpdatePersonName = async (personId, newName) => {
    const { error } = await supabase
      .from("people")
      .update({ name: newName })
      .eq("id", personId);

    if (error) toast.error("Error updating name.");
    else fetchPeople();
  };

  const handleUpdatePersonPhone = async (personId, newPhone) => {
    const { error } = await supabase
      .from("people")
      .update({ phone: newPhone.trim() })
      .eq("id", personId);

    if (error) {
      toast.error("Error updating phone number.");
    } else {
      toast.success("Phone number updated!");
      fetchPeople();
    }
  };

  const activePeople = people.filter((p) => p.status === "active");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileLayout}>
        <div className={styles.header}>
          <h1 className={styles.pageTitle}>People</h1>
          <div className={styles.controls}>
            <button
              onClick={() => setIsAdding(!isAdding)}
              className={commonStyles.buttonPrimary}
            >
              {isAdding ? <FaTimes /> : <FaPlus />} {isAdding ? "Close" : "New"}
            </button>
            <button
              onClick={() => navigate("/inactive-workers")}
              className={commonStyles.buttonSecondary}
            >
              <FaUsersSlash /> Inactive
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={
                isEditing
                  ? commonStyles.buttonSuccess
                  : commonStyles.buttonSecondary
              }
            >
              {isEditing ? <FaCheck /> : <FaEdit />}{" "}
              {isEditing ? "Done" : "Edit"}
            </button>
          </div>
        </div>

        {isAdding && (
          <div className={styles.createPersonForm}>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter person name..."
              className={styles.inputField}
              disabled={addLoading}
            />
            <button
              onClick={handleCreatePerson}
              className={commonStyles.buttonPrimary}
              disabled={addLoading}
            >
              {addLoading ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        <div className={styles.content}>
          {isLoading ? (
            <div style={{ padding: "20px" }}>
              <SkeletonLoader count={6} />
            </div>
          ) : activePeople.length > 0 ? (
            <PeopleList
              people={activePeople}
              isEditing={isEditing}
              onToggleStatus={handleToggleStatus}
              onUpdatePersonName={handleUpdatePersonName}
              onUpdatePersonPhone={handleUpdatePersonPhone}
            />
          ) : (
            <EmptyState message="No active workers found. Add one to get started!">
              <button
                onClick={() => setIsAdding(true)}
                className={commonStyles.buttonSuccess}
              >
                <FaPlus /> Add First Worker
              </button>
            </EmptyState>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeopleSection;
