// src/components/App/App.jsx

import { useState, useEffect } from "react";
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
import PeopleSection from "../PeopleSection/PeopleSection";
import PersonPage from "../../Pages/PersonPage";
import CompanyTablesPage from "../../Pages/CompanyTablesPage";
import TableDetailsPage from "../../Pages/TableDetailsPage";
import PersonTableDetailsPage from "../../Pages/PersonTableDetailsPage";
import LoginModal from "../LoginModal/LoginModal";
import logo from "../../../public/Flooring.Boss.svg";
import InactiveWorkersPage from "../../Pages/InactiveWorkersPage";
import InactiveCompaniesPage from "../../Pages/InactiveCompaniesPage";
import CompanyListPage from "../../Pages/CompanyListPage";
import AddressListPage from "../../Pages/AddressListPage";
import AddressDetailsPage from "../../Pages/AddressDetailsPage";
import styles from "./App.module.css";

const AppContent = () => {
  const [people, setPeople] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Перевіряємо сесію при завантаженні
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (data.session) {
        setIsLoggedIn(true);
        fetchPeople();
      } else {
        setIsLoggedIn(false);
      }
    };
    checkSession();
  }, []);

  const fetchPeople = async () => {
    const { data, error } = await supabase.from("people").select("*");
    if (error) {
      console.error("Error fetching people:", error);
      setPeople([]);
    } else {
      const peopleWithStatus = data.map((person) => ({
        ...person,
        status: person.status || "active",
      }));
      setPeople(peopleWithStatus);
    }
  };

  const handlePersonCreated = (newPerson) => {
    setPeople((prev) => [...prev, newPerson]);
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    fetchPeople();
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      setIsLoggedIn(false);
      setPeople(null);
    }
  };

  const activePeople = people
    ? people.filter((p) => p.status === "active")
    : [];

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
          <Routes>
            <Route
              path="/"
              element={
                <PeopleSection
                  people={activePeople}
                  isLoading={people === null}
                  onPeopleUpdate={fetchPeople}
                  onPersonCreated={handlePersonCreated}
                />
              }
            />
            <Route path="/companies" element={<CompanyListPage />} />
            <Route path="/addresses" element={<AddressListPage />} />
            <Route
              path="/address/:addressId"
              element={<AddressDetailsPage />}
            />
            <Route path="/inactive-workers" element={<InactiveWorkersPage />} />
            <Route
              path="/inactive-companies"
              element={<InactiveCompaniesPage />}
            />
            <Route
              path="/company/:companyName"
              element={<CompanyTablesPage />}
            />
            <Route
              path="/company/:companyName/table/:tableId"
              element={<TableDetailsPage />}
            />
            <Route path="/person/:personId" element={<PersonPage />} />
            <Route
              path="/person/:personId/tables/:tableId"
              element={<PersonTableDetailsPage />}
            />
          </Routes>
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
