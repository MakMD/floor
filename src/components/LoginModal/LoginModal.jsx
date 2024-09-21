import { useState } from "react";
import axios from "axios";
import styles from "./LoginModal.module.css"; // Імпорт стилів

const LoginModal = ({ onLoginSuccess }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const response = await axios.get(
        "https://66ee7a0d3ed5bb4d0bf107d1.mockapi.io/Password"
      );

      const storedPassword = response.data[0].passwords; // Отримуємо пароль з правильного ключа
      console.log(response.data[0].passwords);
      if (password === storedPassword) {
        onLoginSuccess(); // Якщо пароль правильний
      } else {
        setError("Incorrect password"); // Якщо пароль неправильний
      }
    } catch (error) {
      setError("Error checking password");
      console.error("Error logging in:", error);
    }
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>Enter Password</h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
        />
        <button onClick={handleLogin}>Login</button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </div>
  );
};

export default LoginModal;
