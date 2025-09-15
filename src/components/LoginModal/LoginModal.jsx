// src/components/LoginModal/LoginModal.jsx

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "./LoginModal.module.css";
import { FaSignInAlt } from "react-icons/fa"; // Імпортуємо іконку

const LoginModal = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("password")
      .select("value")
      .eq("id", 1)
      .single();

    if (fetchError) {
      setError("Error checking password. Please try again.");
      console.error("Error logging in:", fetchError);
      setLoading(false);
      return;
    }

    const storedPassword = data.value;

    if (password === storedPassword) {
      onLoginSuccess();
    } else {
      setError("Incorrect password");
    }

    setLoading(false);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.title}>Login</h2>
          <p className={styles.subtitle}>
            Please enter your password to continue.
          </p>
        </div>
        <div className={styles.form}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={styles.inputField}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />
          <button
            onClick={handleLogin}
            className={styles.loginButton}
            disabled={loading}
          >
            {loading ? (
              "Logging in..."
            ) : (
              <>
                <FaSignInAlt /> Log In
              </>
            )}
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginModal;
