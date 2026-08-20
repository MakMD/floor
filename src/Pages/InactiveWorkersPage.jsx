import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { usePeople } from "../hooks/usePeople";
import PeopleList from "../components/PeopleList/PeopleList";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import { FaArrowLeft, FaEdit, FaCheck } from "react-icons/fa";
import styles from "./InactiveWorkersPage.module.css";
import commonStyles from "../styles/common.module.css";

const InactiveWorkersPage = () => {
  const { people, loading, refetch } = usePeople();
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

  const handleUpdatePersonPhone = async (personId, newPhone) => {
    const { error } = await supabase
      .from("people")
      .update({ phone: newPhone.trim() })
      .eq("id", personId);
    if (error) console.error("Error updating person phone:", error);
    else await refetch();
  };

  const inactivePeople = people.filter((p) => p.status === "inactive");

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileLayout}>
        <div className={styles.header}>
          <button
            className={commonStyles.buttonSecondary}
            onClick={() => navigate(-1)} // Виправлено: тепер повертає назад
            style={{ border: "none" }}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className={styles.pageTitle}>Inactive Workers</h1>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={
              isEditing
                ? commonStyles.buttonSuccess
                : commonStyles.buttonSecondary
            }
          >
            {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Done" : "Edit"}
          </button>
        </div>

        <div className={styles.content}>
          {loading ? (
            <div style={{ padding: "20px" }}>
              <SkeletonLoader count={4} />
            </div>
          ) : inactivePeople.length > 0 ? (
            <PeopleList
              people={inactivePeople}
              isEditing={isEditing}
              onToggleStatus={handleToggleStatus}
              onUpdatePersonName={handleUpdatePersonName}
              onUpdatePersonPhone={handleUpdatePersonPhone}
            />
          ) : (
            <EmptyState message="There are no inactive workers." />
          )}
        </div>
      </div>
    </div>
  );
};

export default InactiveWorkersPage;
