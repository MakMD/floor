// src/components/App/App.jsx
import { lazy } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { ThemeProvider } from "../../contexts/ThemeContext";
import { AuthProvider, useAuth } from "../../contexts/AuthContext";
import AuthLayout from "../../layouts/AuthLayout";
import AdminRoute from "../ProtectedRoute/AdminRoute";
import LoginPage from "../../Pages/LoginPage";
import RegisterPage from "../../Pages/RegisterPage";
// Ліниве завантаження сторінок
const DashboardPage = lazy(() => import("../../Pages/DashboardPage"));
const PeopleSection = lazy(() => import("../PeopleSection/PeopleSection"));
const PersonPage = lazy(() => import("../../Pages/PersonPage"));
const CompanyListPage = lazy(() => import("../../Pages/CompanyListPage"));
const CompanyTablesPage = lazy(() => import("../../Pages/CompanyTablesPage"));
const TableDetailsPage = lazy(() => import("../../Pages/TableDetailsPage"));
const PersonTableDetailsPage = lazy(
  () => import("../../Pages/PersonTableDetailsPage"),
);
const InactiveWorkersPage = lazy(
  () => import("../../Pages/InactiveWorkersPage"),
);
const InactiveCompaniesPage = lazy(
  () => import("../../Pages/InactiveCompaniesPage"),
);
const AddressListPage = lazy(() => import("../../Pages/AddressListPage"));
const AddressDetailsPage = lazy(() => import("../../Pages/AddressDetailsPage"));
const AdminPage = lazy(() => import("../../Pages/AdminPage"));
const CalendarPage = lazy(() => import("../../Pages/CalendarPage"));

// Заглушка для майбутнього кабінету працівника
// const WorkerPortal = () => (
//   <div style={{ padding: "40px" }}>
//     <h1>Worker Portal</h1>
//     <p>Under construction...</p>
//   </div>
// );
const WorkerPortal = lazy(() => import("../../Pages/WorkerPortal"));
// Розумний редирект для головної сторінки
const IndexRedirect = () => {
  const { userRole, loading } = useAuth();

  if (loading) return null; // Чекаємо повного завантаження ролі

  // Якщо адмін - йдемо на проекти, якщо працівник - у портал
  if (userRole === "admin") {
    return <Navigate to="/addresses" replace />;
  }

  return <Navigate to="/worker-portal" replace />;
};

const router = createBrowserRouter(
  [
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/register", // ДОДАНО
      element: <RegisterPage />,
    },
    {
      path: "/",
      element: <AuthLayout />, // AuthLayout перевіряє наявність сесії
      children: [
        {
          path: "/",
          element: <IndexRedirect />,
        },
        // МАРШРУТ ДЛЯ ПРАЦІВНИКІВ
        {
          path: "worker-portal",
          element: <WorkerPortal />,
        },
        // МАРШРУТИ ДЛЯ АДМІНІСТРАТОРІВ (захищені через AdminRoute)
        {
          path: "addresses",
          element: (
            <AdminRoute>
              <AddressListPage />
            </AdminRoute>
          ),
        },
        {
          path: "address/:addressId",
          element: (
            <AdminRoute>
              <AddressDetailsPage />
            </AdminRoute>
          ),
        },
        {
          path: "people",
          element: (
            <AdminRoute>
              <PeopleSection />
            </AdminRoute>
          ),
        },
        {
          path: "person/:personId",
          element: (
            <AdminRoute>
              <PersonPage />
            </AdminRoute>
          ),
        },
        {
          path: "person/:personId/tables/:tableId",
          element: (
            <AdminRoute>
              <PersonTableDetailsPage />
            </AdminRoute>
          ),
        },
        {
          path: "admin",
          element: (
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          ),
        },
        {
          path: "inactive-workers",
          element: (
            <AdminRoute>
              <InactiveWorkersPage />
            </AdminRoute>
          ),
        },
        {
          path: "dashboard",
          element: (
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          ),
        },
        {
          path: "companies",
          element: (
            <AdminRoute>
              <CompanyListPage />
            </AdminRoute>
          ),
        },
        {
          path: "inactive-companies",
          element: (
            <AdminRoute>
              <InactiveCompaniesPage />
            </AdminRoute>
          ),
        },
        {
          path: "company/:companyId",
          element: (
            <AdminRoute>
              <CompanyTablesPage />
            </AdminRoute>
          ),
        },
        {
          path: "company/:companyId/table/:tableId",
          element: (
            <AdminRoute>
              <TableDetailsPage />
            </AdminRoute>
          ),
        },
        {
          path: "calendar",
          element: (
            <AdminRoute>
              <CalendarPage />
            </AdminRoute>
          ),
        },
      ],
    },
  ],
  {
    // Налаштування для усунення жовтих попереджень React Router у консолі
    future: {
      v7_relativeSplatPath: true,
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
