import { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  FaRegAddressBook,
  FaSignOutAlt,
  FaUsers,
  FaWrench,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { supabase } from "../../supabaseClient";

import LoginPage from "../../Pages/LoginPage";
// ДОДАНО: імпортуємо наш компонент захисту
import ProtectedRoute from "../ProtectedRoute/ProtectedRoute";
import ThemeToggleButton from "../ThemeToggleButton/ThemeToggleButton";
import logo from "../../../public/Flooring.Boss.svg";
import styles from "./App.module.css";

// Dynamic imports
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

// ЦЕЙ КОМПОНЕНТ ПОКАЗУЄТЬСЯ ТІЛЬКИ АВТОРИЗОВАНИМ КОРИСТУВАЧАМ
const AuthenticatedLayout = () => {
  const [theme, setTheme] = useState("dark");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login"); // Після виходу перекидаємо на логін
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <NavLink to="/" className={`${styles.logoLink} ${styles.desktopOnly}`}>
          <img src={logo} alt="App Logo" className={styles.logo} />
        </NavLink>

        <button
          className={styles.hamburgerButton}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <FaBars />
        </button>

        {isMobileMenuOpen && (
          <div className={styles.overlay} onClick={closeMobileMenu}></div>
        )}

        <nav
          className={`${styles.nav} ${isMobileMenuOpen ? styles.navMobileOpen : ""}`}
        >
          <div className={styles.mobileMenuHeader}>
            <NavLink
              to="/"
              className={styles.logoLink}
              onClick={closeMobileMenu}
            >
              <img src={logo} alt="App Logo" className={styles.logo} />
            </NavLink>
            <button className={styles.closeButton} onClick={closeMobileMenu}>
              <FaTimes />
            </button>
          </div>

          <NavLink
            to="/addresses"
            className={({ isActive }) =>
              isActive
                ? `${styles.navLink} ${styles.activeLink}`
                : styles.navLink
            }
            onClick={closeMobileMenu}
          >
            <FaRegAddressBook /> Projects
          </NavLink>

          <NavLink
            to="/people"
            className={({ isActive }) =>
              isActive
                ? `${styles.navLink} ${styles.activeLink}`
                : styles.navLink
            }
            onClick={closeMobileMenu}
          >
            <FaUsers /> People
          </NavLink>

          <NavLink
            to="/admin"
            className={({ isActive }) =>
              isActive
                ? `${styles.navLink} ${styles.activeLink}`
                : styles.navLink
            }
            onClick={closeMobileMenu}
          >
            <FaWrench /> Admin
          </NavLink>

          <div className={styles.navControls}>
            <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
            <button
              onClick={() => {
                handleLogout();
                closeMobileMenu();
              }}
              className={styles.logoutButton}
            >
              <FaSignOutAlt /> Log Out
            </button>
          </div>
        </nav>
      </header>

      <main className={styles.mainContent}>
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "40px" }}>
              Loading...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/addresses" replace />} />
            <Route path="/people" element={<PeopleSection />} />
            <Route path="/addresses" element={<AddressListPage />} />
            <Route
              path="/address/:addressId"
              element={<AddressDetailsPage />}
            />
            <Route path="/person/:personId" element={<PersonPage />} />
            <Route
              path="/person/:personId/tables/:tableId"
              element={<PersonTableDetailsPage />}
            />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/inactive-workers" element={<InactiveWorkersPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/companies" element={<CompanyListPage />} />
            <Route
              path="/inactive-companies"
              element={<InactiveCompaniesPage />}
            />
            <Route path="/company/:companyId" element={<CompanyTablesPage />} />
            <Route
              path="/company/:companyId/table/:tableId"
              element={<TableDetailsPage />}
            />
            <Route path="/calendar" element={<CalendarPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
};

// ГОЛОВНИЙ КОМПОНЕНТ ДОДАТКУ
const App = () => (
  <Router>
    <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    <Routes>
      {/* Відкритий маршрут для логіну */}
      <Route path="/login" element={<LoginPage />} />

      {/* Захищені маршрути (все інше) */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Router>
);

export default App;
