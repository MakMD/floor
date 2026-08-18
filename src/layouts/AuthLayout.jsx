import { Navigate, Outlet } from "react-router-dom";
import { Suspense } from "react";
import { useAuth } from "../contexts/AuthContext";
import Header from "../components/Header/Header";

const AuthLayout = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", marginTop: "20vh" }}
      >
        Loading session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      <Header />
      <main style={{ padding: "0 40px" }}>
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "40px" }}>
              Loading...
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default AuthLayout;
