// src/components/LoginModal/LoginModal.jsx

import { useState } from "react";
import { supabase } from "../../supabaseClient"; // <-- ІМПОРТУЄМО SUPABASE
import styles from "./LoginModal.module.css";

const LoginModal = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    // Робимо запит до таблиці 'password'
    const { data, error: fetchError } = await supabase
      .from("password")
      .select("value")
      .eq("id", 1) // Ми знаємо, що пароль - це перший і єдиний запис
      .single();

    if (fetchError) {
      setError("Error checking password. Please try again.");
      console.error("Error logging in:", fetchError);
      setLoading(false);
      return;
    }

    const storedPassword = data.value;

    if (password === storedPassword) {
      onLoginSuccess(); // Пароль правильний
    } else {
      setError("Incorrect password"); // Пароль неправильний
    }

    setLoading(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Enter Password</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          className={styles.inputField}
          onKeyPress={(e) => e.key === "Enter" && handleLogin()} // Додано для входу по Enter
          disabled={loading}
        />
        <button
          onClick={handleLogin}
          className={styles.loginButton}
          disabled={loading}
        >
          {loading ? "Checking..." : "Login"}
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginModal;
