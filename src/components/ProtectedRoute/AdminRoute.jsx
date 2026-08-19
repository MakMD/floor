import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const AdminRoute = ({ children }) => {
  const { user, role, loading } = useAuth();

  // 1. НАЙГОЛОВНІШЕ: Охоронець має ЧЕКАТИ, поки повністю завантажиться сесія та роль
  if (loading || role === undefined || role === null) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          backgroundColor: "var(--color-background)",
          color: "var(--color-text-primary)",
        }}
      >
        Перевірка прав доступу...
      </div>
    );
  }

  // 2. Якщо користувач взагалі не авторизований
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. Якщо роль завантажилась, але це не адміністратор
  if (role !== "admin") {
    return <Navigate to="/worker-portal" replace />;
  }

  // 4. Якщо перевірка пройдена — залишаємо користувача на тій сторінці, яку він оновлював
  return children;
};

export default AdminRoute;
