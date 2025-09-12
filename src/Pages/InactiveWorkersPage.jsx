// src/Pages/InactiveWorkersPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import PeopleList from "../components/PeopleList/PeopleList";
import styles from "./InactiveWorkersPage.module.css";

const InactiveWorkersPage = () => {
  const [inactivePeople, setInactivePeople] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const fetchInactivePeople = async () => {
    try {
      const response = await axios.get(
        "https://66e3d74dd2405277ed1201b1.mockapi.io/people"
      );
      const allPeople = response.data.map((person) => ({
        ...person,
        status: person.status || "active",
      }));
      setInactivePeople(allPeople.filter((p) => p.status === "inactive"));
    } catch (error) {
      console.error("Error fetching inactive people:", error);
    }
  };

  useEffect(() => {
    fetchInactivePeople();
  }, []);

  const handleToggleStatus = async (personId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    try {
      await axios.put(
        `https://66e3d74dd2405277ed1201b1.mockapi.io/people/${personId}`,
        { status: newStatus }
      );
      // Оновлюємо список, щоб прибрати щойно активованого працівника
      fetchInactivePeople();
    } catch (error) {
      console.error("Error updating person status:", error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          Back to Main
        </button>
        <h1 className={styles.pageTitle}>Inactive Workers</h1>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={styles.editButton}
        >
          {isEditing ? "Done" : "Edit"}
        </button>
      </div>
      <PeopleList
        people={inactivePeople}
        isEditing={isEditing}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
};

export default InactiveWorkersPage;
