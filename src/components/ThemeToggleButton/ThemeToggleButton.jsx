// src/components/ThemeToggleButton/ThemeToggleButton.jsx
import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";
import styles from "./ThemeToggleButton.module.css";

const ThemeToggleButton = ({ theme, toggleTheme }) => {
  return (
    <button
      onClick={toggleTheme}
      className={styles.toggleButton}
      title="Toggle theme"
    >
      {theme === "light" ? <FaMoon /> : <FaSun />}
    </button>
  );
};

export default ThemeToggleButton;
