// src/components/ProtectedRoute/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { ROLES } from "../../utils/constants";

const AdminRoute = ({ children }) => {
  const { userRole, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        Loading permissions...
      </div>
    );
  }

  // Якщо користувач не адмін, відправляємо його у кабінет працівника
  if (userRole !== ROLES.ADMIN) {
    return <Navigate to="/worker-portal" replace />;
  }

  return children;
};

export default AdminRoute;
