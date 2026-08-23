import { useState } from "react";
import { supabase } from "../../supabaseClient";
import Modal from "../Modal/Modal";
import styles from "./LoginModal.module.css";
import { FaSignInAlt } from "react-icons/fa";
import logo from "../../../public/Flooring.Boss.svg";

const LoginModal = ({ onLoginSuccess }) => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");

    if (!phone || !password) {
      setError("Please enter both phone number and password.");
      setLoading(false);
      return;
    }

    // Очищаємо номер телефону від будь-яких символів, крім цифр
    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 4) {
      setError("Invalid phone number format.");
      setLoading(false);
      return;
    }

    // Створюємо фіктивний email для Supabase Auth
    const emailToSubmit = `${cleanPhone}@flooringboss.app`;

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: emailToSubmit,
      password: password,
    });

    if (authError) {
      console.error("Login Error:", authError.message);
      setError("Incorrect login or password. Please try again.");
    } else if (data.session) {
      // Успішний логін
      onLoginSuccess(data.user);
    }

    setLoading(false);
  };

  return (
    <Modal onClose={() => {}}>
      <div className={styles.loginContainer}>
        <div className={styles.header}>
          <img src={logo} alt="Flooring Boss Logo" className={styles.logo} />
          <h2 className={styles.title}>Worker Login</h2>
          <p className={styles.subtitle}>
            Enter your mobile number and password
          </p>
        </div>

        <div className={styles.form}>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Mobile Number (e.g. 1587...)"
            className={styles.inputField}
            onKeyPress={(e) => e.key === "Enter" && handleLogin()}
            disabled={loading}
          />
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
