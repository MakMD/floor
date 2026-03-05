import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { FaSpinner } from "react-icons/fa";

const ProtectedRoute = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Перевіряємо поточну сесію при першому завантаженні
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Підписуємося на зміни авторизації (вхід/вихід)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Очищення підписки при розмонтуванні компонента
    return () => subscription.unsubscribe();
  }, []);

  // Показуємо індикатор завантаження, поки перевіряється токен
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <FaSpinner className="spin" size={40} color="var(--color-primary)" />
      </div>
    );
  }

  // Якщо сесії немає (користувач не залогінений), примусово перекидаємо на /login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Якщо авторизація успішна, рендеримо дочірні компоненти (додаток)
  return children;
};

export default ProtectedRoute;
