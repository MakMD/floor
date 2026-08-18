// src/Pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";

const RegisterPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            role: "worker", // Тригер бази даних призначить цю роль
          },
        },
      });

      if (error) throw error;

      toast.success("Реєстрація успішна! Тепер ви можете увійти.");
      navigate("/login");
    } catch (error) {
      console.error("Помилка реєстрації:", error.message);
      toast.error("Помилка: " + error.message);
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
            Реєстрація працівника
          </h2>
          <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
            Створіть свій обліковий запис
          </p>
        </div>

        <form
          onSubmit={handleRegister}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <input
              type="text"
              required
              placeholder="Ім'я"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              style={{
                width: "50%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
              }}
            />
            <input
              type="text"
              required
              placeholder="Прізвище"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              style={{
                width: "50%",
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
              }}
            />
          </div>

          <input
            type="email"
            required
            placeholder="Email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
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
            placeholder="Пароль (мінімум 6 символів)"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            minLength="6"
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
            {loading ? "Створення..." : "Зареєструватися"}
          </button>
        </form>

        <div
          style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem" }}
        >
          <span style={{ color: "var(--color-text-secondary)" }}>
            Вже маєте акаунт?{" "}
          </span>
          <Link
            to="/login"
            style={{
              color: "var(--color-primary)",
              textDecoration: "none",
              fontWeight: "bold",
            }}
          >
            Увійти
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
