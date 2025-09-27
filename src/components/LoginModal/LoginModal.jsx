// makmd/floor/floor-ec2a015c38c9b806424861b2badc2086be27f9c6/src/components/LoginModal/LoginModal.jsx

import { useState } from "react";
import { supabase } from "../../supabaseClient";
import Modal from "../Modal/Modal";
import styles from "./LoginModal.module.css";
import { FaSignInAlt } from "react-icons/fa";
import logo from "../../../public/Flooring.Boss.svg"; // ІМПОРТ ЛОГОТИПУ

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
    // Прибираємо title, щоб використати кастомний заголовок
    <Modal onClose={() => {}}>
      {/* ОНОВЛЕНИЙ БЛОК */}
      <div className={styles.loginContainer}>
        <div className={styles.header}>
          <img src={logo} alt="Flooring Boss Logo" className={styles.logo} />
          <h2 className={styles.title}>Welcome Back</h2>
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
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </Modal>
  );
};

export default LoginModal;
