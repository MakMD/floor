// src/Pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Якщо користувач вже авторизований, одразу перенаправляємо його на головну сторінку
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Очищаємо номер від зайвих символів
      const cleanPhone = phone.replace(/\D/g, "");

      if (cleanPhone.length < 4) {
        throw new Error("Невірний формат номера телефону.");
      }

      // Формуємо email для Supabase
      const emailToSubmit = `${cleanPhone}@flooringboss.app`;

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToSubmit,
        password,
      });

      if (error) throw error;

      toast.success("Успішний вхід!");
      navigate("/");
    } catch (error) {
      console.error("Помилка входу:", error.message);
      toast.error("Неправильний номер телефону або пароль.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "var(--color-background)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "40px",
          backgroundColor: "var(--color-surface)",
          borderRadius: "12px",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <h2
            style={{ margin: "0 0 10px 0", color: "var(--color-text-primary)" }}
          >
            Flooring Boss
          </h2>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Увійдіть у свій акаунт
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <input
            type="text"
            required
            placeholder="Номер телефону (напр. 1587...)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-primary)",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            required
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "1px solid var(--color-border)",
              backgroundColor: "var(--color-background)",
              color: "var(--color-text-primary)",
              boxSizing: "border-box",
            }}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "14px",
              backgroundColor: "var(--color-primary)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontWeight: "bold",
              fontSize: "1rem",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Завантаження..." : "Увійти"}
          </button>
        </form>

        {/* Посилання на реєстрацію нового працівника */}
        <div
          style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem" }}
        >
          <span style={{ color: "var(--color-text-secondary)" }}>
            Немає акаунта?{" "}
          </span>
          <Link
            to="/register"
            style={{
              color: "var(--color-primary)",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Створити
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
