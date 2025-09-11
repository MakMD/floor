// src/components/PeopleList/PeopleList.jsx

import { useNavigate } from "react-router-dom";
import styles from "./PeopleList.module.css";

const PeopleList = ({ people, isEditing, onToggleStatus }) => {
  const navigate = useNavigate();

  const handlePersonClick = (personId) => {
    // Забороняємо навігацію в режимі редагування
    if (isEditing) return;
    navigate(`/person/${personId}`);
  };

  return (
    <div className={styles.peopleListContainer}>
      <ul className={styles.peopleList}>
        {people.length > 0 ? (
          people.map((person) => (
            <li
              key={person.id}
              className={`${styles.personItem} ${
                isEditing ? styles.editing : ""
              }`}
              onClick={() => handlePersonClick(person.id)}
            >
              <h3>{person.name}</h3>
              {isEditing && (
                <button
                  className={styles.toggleStatusButton}
                  onClick={(e) => {
                    e.stopPropagation(); // Зупиняємо спливання, щоб не спрацював onClick на li
                    onToggleStatus(person.id, person.status);
                  }}
                >
                  {person.status === "active"
                    ? "Move to Inactive"
                    : "Move to Active"}
                </button>
              )}
            </li>
          ))
        ) : (
          <li>No people available in this list</li>
        )}
      </ul>
    </div>
  );
};

export default PeopleList;
