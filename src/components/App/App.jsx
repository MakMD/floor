// src/components/App/App.jsx

import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import axios from "axios";
import PeopleSection from "../PeopleSection/PeopleSection";
import CreatePersonForm from "../CreatePersonForm/CreatePersonForm";
import PersonPage from "../../Pages/PersonPage";
import CompanyList from "../CompanyList/CompanyList";
import CompanyTablesPage from "../../Pages/CompanyTablesPage";
import TableDetailsPage from "../../Pages/TableDetailsPage";
import PersonTablesPage from "../../Pages/PersonTablesPage";
import PersonTableDetailsPage from "../../Pages/PersonTableDetailsPage";
import LoginModal from "../LoginModal/LoginModal";
import logo from "../../../public/Flooring.Boss.svg";
import TemporaryCompaniesList from "../TemporaryCompaniesList/TemporaryCompaniesList";
// Імпортуємо нову сторінку
import InactiveWorkersPage from "../../Pages/InactiveWorkersPage";
import styles from "./App.module.css";

const AppContent = () => {
  const [people, setPeople] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  const companyResources = [
    "TouchtoneCanadaLTD",
    "SarefaHomesLTD",
    "BelvistaHomesLTD",
    "NestHomesLTD",
    "CenrurylandHomesLTD",
    "TradesProSupplyDepotLTD",
    "NewEraFloorGalleryLTD",
    "LinhanDevelopments",
    "TemporaryCompanies",
  ];

  const location = useLocation();

  const fetchPeople = async () => {
    try {
      const response = await axios.get(
        "https://66e3d74dd2405277ed1201b1.mockapi.io/people"
      );
      const peopleWithStatus = response.data.map((person) => ({
        ...person,
        status: person.status || "active",
      }));
      setPeople(peopleWithStatus);
    } catch (error) {
      console.error("Error fetching people:", error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const companyPromises = companyResources.map(async (company) => {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${company}`
        );
        return {
          name: company,
          tables: response.data[0]?.invoiceTables || [],
        };
      });
      const companiesData = await Promise.all(companyPromises);
      setCompanies(companiesData);
      setFilteredCompanies(companiesData);
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  useEffect(() => {
    fetchPeople();
    fetchCompanies();
  }, []);

  const activePeople = people.filter((person) => person.status === "active");

  const filteredActivePeople = activePeople.filter((person) => {
    if (!searchTerm) return true;
    return person.tables?.some((table) =>
      table.invoices.some((invoice) =>
        invoice.address?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  });

  useEffect(() => {
    if (searchTerm) {
      const filtered = companies.filter((company) =>
        company.tables?.some((table) =>
          table.invoices.some((invoice) =>
            invoice.address?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );
      setFilteredCompanies(filtered);
    } else {
      setFilteredCompanies(companies);
    }
  }, [searchTerm, companies]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className={styles.appContainer}>
      {!isLoggedIn && <LoginModal onLoginSuccess={handleLoginSuccess} />}
      <header className={styles.header}>
        <Link to="/">
          <img src={logo} alt="App Logo" className={styles.logo} />
        </Link>
      </header>

      {isLoggedIn && location.pathname === "/" && (
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      )}

      {isLoggedIn && (
        <Routes>
          <Route
            path="/"
            element={
              <div className={styles.pageContent}>
                <CompanyList companies={filteredCompanies} />
                <PeopleSection
                  people={filteredActivePeople}
                  onPeopleUpdate={fetchPeople}
                />
                <CreatePersonForm
                  onPersonCreated={(newPerson) => {
                    setPeople((prev) => [
                      ...prev,
                      { ...newPerson, status: "active" },
                    ]);
                  }}
                />
              </div>
            }
          />
          {/* Додаємо новий маршрут */}
          <Route path="/inactive-workers" element={<InactiveWorkersPage />} />

          <Route
            path="/temporary-companies"
            element={<TemporaryCompaniesList />}
          />
          <Route path="/company/:companyName" element={<CompanyTablesPage />} />
          <Route
            path="/company/:companyName/table/:tableId"
            element={<TableDetailsPage />}
          />
          <Route path="/person/:personId" element={<PersonPage />} />
          <Route
            path="/person/:personId/tables"
            element={<PersonTablesPage />}
          />
          <Route
            path="/person/:personId/tables/:tableId"
            element={<PersonTableDetailsPage />}
          />
        </Routes>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
