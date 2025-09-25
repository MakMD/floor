// src/components/App/App.jsx

import { useState, useEffect, lazy, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import {
  FaRegAddressBook,
  FaRegBuilding,
  FaSignOutAlt,
  FaUsers,
  FaWrench,
  FaCalendarAlt,
  FaHome,
} from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import LoginModal from "../LoginModal/LoginModal";
import ThemeToggleButton from "../ThemeToggleButton/ThemeToggleButton"; // ІМПОРТ
import logo from "../../../public/Flooring.Boss.svg";
import styles from "./App.module.css";

// Dynamic imports
const DashboardPage = lazy(() => import("../../Pages/DashboardPage"));
const PeopleSection = lazy(() => import("../PeopleSection/PeopleSection"));
const PersonPage = lazy(() => import("../../Pages/PersonPage"));
const CompanyListPage = lazy(() => import("../../Pages/CompanyListPage"));
const CompanyTablesPage = lazy(() => import("../../Pages/CompanyTablesPage"));
const TableDetailsPage = lazy(() => import("../../Pages/TableDetailsPage"));
const PersonTableDetailsPage = lazy(() =>
  import("../../Pages/PersonTableDetailsPage")
);
const InactiveWorkersPage = lazy(() =>
  import("../../Pages/InactiveWorkersPage")
);
const InactiveCompaniesPage = lazy(() =>
  import("../../Pages/InactiveCompaniesPage")
);
const AddressListPage = lazy(() => import("../../Pages/AddressListPage"));
const AddressDetailsPage = lazy(() => import("../../Pages/AddressDetailsPage"));
const AdminPage = lazy(() => import("../../Pages/AdminPage"));
const CalendarPage = lazy(() => import("../../Pages/CalendarPage"));

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState("light"); // СТАН ДЛЯ ТЕМИ

  // Функція для перемикання теми
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // Ефект для застосування атрибута до html
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setIsLoggedIn(!!data.session);
    };
    checkSession();
  }, []);

  const handleLoginSuccess = () => setIsLoggedIn(true);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
  };

  return (
    <div className={styles.appContainer}>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      {!isLoggedIn && <LoginModal onLoginSuccess={handleLoginSuccess} />}

      <header className={styles.header}>
        <NavLink to="/" className={styles.logoLink}>
          <img src={logo} alt="App Logo" className={styles.logo} />
        </NavLink>
        <nav className={styles.nav}>
          {isLoggedIn && (
            <>
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.activeLink}`
                    : styles.navLink
                }
              >
                <FaHome /> Dashboard
              </NavLink>
              <NavLink
                to="/people"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.activeLink}`
                    : styles.navLink
                }
              >
                <FaUsers /> People
              </NavLink>
              <NavLink
                to="/addresses"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.activeLink}`
                    : styles.navLink
                }
              >
                <FaRegAddressBook /> Address Notes
              </NavLink>
              <NavLink
                to="/calendar"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.activeLink}`
                    : styles.navLink
                }
              >
                <FaCalendarAlt /> Calendar
              </NavLink>
              <NavLink
                to="/companies"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.activeLink}`
                    : styles.navLink
                }
              >
                <FaRegBuilding /> Companies
              </NavLink>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.activeLink}`
                    : styles.navLink
                }
              >
                <FaWrench /> Admin
              </NavLink>
              {/* КНОПКА ПЕРЕМИКАННЯ ТЕМИ */}
              <ThemeToggleButton theme={theme} toggleTheme={toggleTheme} />
              <button onClick={handleLogout} className={styles.logoutButton}>
                <FaSignOutAlt /> Log Out
              </button>
            </>
          )}
        </nav>
      </header>

      {isLoggedIn && (
        <main className={styles.mainContent}>
          <Suspense
            fallback={
              <div style={{ textAlign: "center", padding: "40px" }}>
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/people" element={<PeopleSection />} />
              <Route path="/companies" element={<CompanyListPage />} />
              <Route path="/addresses" element={<AddressListPage />} />
              <Route
                path="/address/:addressId"
                element={<AddressDetailsPage />}
              />
              <Route
                path="/inactive-workers"
                element={<InactiveWorkersPage />}
              />
              <Route
                path="/inactive-companies"
                element={<InactiveCompaniesPage />}
              />
              <Route
                path="/company/:companyId"
                element={<CompanyTablesPage />}
              />
              <Route
                path="/company/:companyId/table/:tableId"
                element={<TableDetailsPage />}
              />
              <Route path="/person/:personId" element={<PersonPage />} />
              <Route
                path="/person/:personId/tables/:tableId"
                element={<PersonTableDetailsPage />}
              />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
            </Routes>
          </Suspense>
        </main>
      )}
    </div>
  );
};

const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
