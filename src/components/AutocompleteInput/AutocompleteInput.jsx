// src/components/AutocompleteInput/AutocompleteInput.jsx

import { useState, useEffect } from "react";
import styles from "./AutocompleteInput.module.css";

const AutocompleteInput = ({
  suggestions,
  value,
  onChange,
  name,
  placeholder,
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Цей рядок тепер має з'явитися в консолі
  useEffect(() => {
    console.log("Suggestions received by AutocompleteInput:", suggestions);
  }, [suggestions]);

  const handleChange = (e) => {
    const userInput = e.target.value;
    onChange(e); // Завжди викликаємо onChange для батьківського компонента

    if (userInput && suggestions.length > 0) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().indexOf(userInput.toLowerCase()) > -1
      );

      filtered.sort((a, b) => {
        const aStartsWith = a.toLowerCase().startsWith(userInput.toLowerCase());
        const bStartsWith = b.toLowerCase().startsWith(userInput.toLowerCase());
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        return 0;
      });

      setFilteredSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleClick = (suggestion) => {
    const event = {
      target: { name, value: suggestion },
    };
    onChange(event);
    setShowSuggestions(false);
  };

  const suggestionsListComponent = (
    <ul className={styles.suggestionsList}>
      {filteredSuggestions.map((suggestion) => (
        <li key={suggestion} onClick={() => handleClick(suggestion)}>
          {suggestion}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.autocompleteContainer}>
      <input
        type="text"
        name={name}
        value={value}
        onChange={handleChange}
        onFocus={handleChange} // Додано для показу підказок при фокусі, якщо вже щось введено
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Ховаємо список при втраті фокусу
        placeholder={placeholder}
        className={styles.inputField}
        autoComplete="off"
      />
      {showSuggestions &&
        value &&
        filteredSuggestions.length > 0 &&
        suggestionsListComponent}
    </div>
  );
};

export default AutocompleteInput;
