// src/components/LoginModal/LoginModal.jsx

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import Modal from "../Modal/Modal"; // ІМПОРТ
import styles from "./LoginModal.module.css";
import { FaSignInAlt } from "react-icons/fa";

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
    <Modal title="Login" onClose={() => {}}>
      <div className={styles.form}>
        <p className={styles.subtitle}>
          Please enter your password to continue.
        </p>
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
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </Modal>
  );
};

export default LoginModal;
