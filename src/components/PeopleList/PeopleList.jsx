import { useNavigate } from "react-router-dom";
import styles from "./PeopleList.module.css"; // Імпорт стилів

const PeopleList = ({ people }) => {
  const navigate = useNavigate();

  const handlePersonClick = (personId) => {
    navigate(`/person/${personId}`); // Переходимо до сторінки людини
  };

  return (
    <div className={styles.peopleListContainer}>
      <h2>People List</h2>
      <ul className={styles.peopleList}>
        {people.length > 0 ? (
          people.map((person) => (
            <li
              key={person.id}
              className={styles.personItem}
              onClick={() => handlePersonClick(person.id)}
            >
              <h3>{person.name}</h3> {/* Відображаємо тільки ім'я */}
            </li>
          ))
        ) : (
          <li>No people available</li>
        )}
      </ul>
    </div>
  );
};

export default PeopleList;
