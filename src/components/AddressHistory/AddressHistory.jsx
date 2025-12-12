import React from "react";
import styles from "./AddressHistory.module.css";

const AddressHistory = ({
  allPeople,
  currentAddress,
  currentPersonId,
  onPersonClick,
}) => {
  // === ТИМЧАСОВО ВИМКНЕНО ===
  // Ми повертаємо null відразу, тому компонент "зникає" з екрану,
  // і важка логіка пошуку (filter/some) нижче не виконується.
  return null;

  /* // === ОРИГІНАЛЬНИЙ КОД (ЗБЕРЕЖЕНО) ===
  // Щоб увімкнути компонент назад, видаліть "return null;" зверху 
  // і розкоментуйте цей блок коду.

  if (!currentAddress.trim()) {
    return (
      <div className={styles.historyContainer}>
        <h3 className={styles.title}>Address History</h3>
        <p className={styles.placeholder}>
          Start typing an address to see who else worked here.
        </p>
      </div>
    );
  }

  const relevantPeople = allPeople.filter((person) => {
    if (person.id === currentPersonId) return false;

    // ОНОВЛЕНО: Змінено 'tables' на 'invoice_tables'
    return person.invoice_tables?.some((table) =>
      table.invoices?.some(
        (invoice) =>
          invoice.address &&
          invoice.address.toLowerCase().includes(currentAddress.toLowerCase())
      )
    );
  });

  return (
    <div className={styles.historyContainer}>
      <h3 className={styles.title}>Who else worked here?</h3>
      {relevantPeople.length > 0 ? (
        <ul className={styles.peopleList}>
          {relevantPeople.map((person) => (
            <li
              key={person.id}
              className={styles.personItem}
              onClick={() => onPersonClick(person)}
            >
              {person.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.placeholder}>
          No other workers found at this address.
        </p>
      )}
    </div>
  );
  */
};

export default AddressHistory;
