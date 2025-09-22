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
} from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import LoginModal from "../LoginModal/LoginModal";
import logo from "../../../public/Flooring.Boss.svg";
import styles from "./App.module.css";

// ДИНАМІЧНІ ІМПОРТИ: Замінюємо статичні імпорти на динамічні
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

const AppContent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
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
                to="/companies"
                className={({ isActive }) =>
                  isActive
                    ? `${styles.navLink} ${styles.activeLink}`
                    : styles.navLink
                }
              >
                <FaRegBuilding /> Companies
              </NavLink>
              <button onClick={handleLogout} className={styles.logoutButton}>
                <FaSignOutAlt /> Log Out
              </button>
            </>
          )}
        </nav>
      </header>

      {isLoggedIn && (
        <main className={styles.mainContent}>
          {/* SUSPENSE: Обгортаємо маршрути в Suspense з індикатором завантаження */}
          <Suspense
            fallback={
              <div style={{ textAlign: "center", padding: "40px" }}>
                Loading...
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<PeopleSection />} />
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
