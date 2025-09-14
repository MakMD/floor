// src/components/PeopleList/PeopleList.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PeopleList.module.css";

const PeopleList = ({
  people,
  isEditing,
  onToggleStatus,
  onUpdatePersonName,
}) => {
  const navigate = useNavigate();
  const [editedNames, setEditedNames] = useState({});

  useEffect(() => {
    const namesMap = people.reduce((acc, person) => {
      acc[person.id] = person.name;
      return acc;
    }, {});
    setEditedNames(namesMap);
  }, [people]);

  const handleNameChange = (id, value) => {
    setEditedNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleNameSave = (id) => {
    const originalPerson = people.find((p) => p.id === id);
    if (
      originalPerson &&
      originalPerson.name !== editedNames[id].trim() &&
      editedNames[id].trim() !== ""
    ) {
      onUpdatePersonName(id, editedNames[id].trim());
    } else {
      setEditedNames((prev) => ({ ...prev, [id]: originalPerson.name }));
    }
  };

  const handlePersonClick = (personId) => {
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
              {isEditing ? (
                <input
                  type="text"
                  value={editedNames[person.id] || ""}
                  className={styles.editNameInput}
                  onChange={(e) => handleNameChange(person.id, e.target.value)}
                  onBlur={() => handleNameSave(person.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <h3>{person.name}</h3>
              )}

              {isEditing && (
                <button
                  className={styles.toggleStatusButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleStatus(person.id, person.status);
                  }}
                >
                  {person.status === "active" ? "To Inactive" : "To Active"}
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
