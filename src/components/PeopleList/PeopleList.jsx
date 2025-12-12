// makmd/floor/floor-ec2a015c38c9b806424861b2badc2086be27f9c6/src/components/PeopleList/PeopleList.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./PeopleList.module.css";

const PeopleList = ({
  people,
  isEditing,
  onToggleStatus,
  onUpdatePersonName,
  onUpdatePersonPhone, // Приймаємо нову функцію
}) => {
  const navigate = useNavigate();
  const [editedNames, setEditedNames] = useState({});
  const [editedPhones, setEditedPhones] = useState({}); // Стан для телефонів

  useEffect(() => {
    const namesMap = {};
    const phonesMap = {};
    people.forEach((person) => {
      namesMap[person.id] = person.name;
      phonesMap[person.id] = person.phone || "";
    });
    setEditedNames(namesMap);
    setEditedPhones(phonesMap);
  }, [people]);

  const handleNameChange = (id, value) => {
    setEditedNames((prev) => ({ ...prev, [id]: value }));
  };

  const handlePhoneChange = (id, value) => {
    setEditedPhones((prev) => ({ ...prev, [id]: value }));
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

  // Нова функція для збереження телефону
  const handlePhoneSave = (id) => {
    const originalPerson = people.find((p) => p.id === id);
    if (originalPerson && originalPerson.phone !== editedPhones[id].trim()) {
      onUpdatePersonPhone(id, editedPhones[id].trim());
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
                <>
                  <input
                    type="text"
                    value={editedNames[person.id] || ""}
                    className={styles.editInput}
                    onChange={(e) =>
                      handleNameChange(person.id, e.target.value)
                    }
                    onBlur={() => handleNameSave(person.id)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Name"
                  />
                  <input
                    type="tel"
                    value={editedPhones[person.id] || ""}
                    className={styles.editInput}
                    onChange={(e) =>
                      handlePhoneChange(person.id, e.target.value)
                    }
                    onBlur={() => handlePhoneSave(person.id)}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Phone number"
                  />
                </>
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
