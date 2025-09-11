// src/components/PeopleSection/PeopleSection.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PeopleList from "../PeopleList/PeopleList";
import styles from "./PeopleSection.module.css";

const PeopleSection = ({ people, onPeopleUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const handleToggleStatus = async (personId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { status: newStatus }
      );
      onPeopleUpdate();
    } catch (error) {
      console.error("Error updating person status:", error);
    }
  };

  return (
    <div className={styles.peopleSectionContainer}>
      <div className={styles.titleContainer}>
        <h2 className={styles.sectionTitle}>People</h2>
        <div className={styles.controls}>
          <button
            onClick={() => navigate("/inactive-workers")}
            className={styles.inactiveLink}
          >
            Inactive Workers
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={styles.editButton}
          >
            {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>
      <PeopleList
        people={people} // Тепер сюди передаються тільки активні працівники з App.jsx
        isEditing={isEditing}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default PeopleSection;
