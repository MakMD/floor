import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import PeopleList from "../PeopleList/PeopleList";
import CreatePersonForm from "../CreatePersonForm/CreatePersonForm";
import PersonPage from "../../Pages/PersonPage";
import CompanyList from "../CompanyList/CompanyList";
import CompanyTablesPage from "../../Pages/CompanyTablesPage";
import TableDetailsPage from "../../Pages/TableDetailsPage";
import PersonTablesPage from "../../Pages/PersonTablesPage";
import PersonTableDetailsPage from "../../Pages/PersonTableDetailsPage";
import LoginModal from "../LoginModal/LoginModal";
import logo from "../../../public/Flooring.Boss.svg";
import BackupButton from "../BackupButton/BackupButton";
import styles from "./App.module.css";

const AppContent = () => {
  const [people, setPeople] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  // Додано нову компанію до загального списку ресурсів
  const companyResources = [
    "TouchtoneCanadaLTD",
    "SarefaHomesLTD",
    "BelvistaHomesLTD",
    "NestHomesLTD",
    "CenrurylandHomesLTD",
    "TradesProSupplyDepotLTD",
    "NewEraFloorGalleryLTD",
    "LinhanDevelopments", // Додано нову компанію
  ];

  const location = useLocation();

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get(
          "https://66e3d74dd2405277ed1201b1.mockapi.io/people"
        );
        setPeople(response.data);
        setFilteredPeople(response.data);
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

    fetchPeople();
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filteredPeople = people.filter((person) =>
        person.tables?.some((table) =>
          table.invoices.some((invoice) =>
            invoice.address?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );
      setFilteredPeople(filteredPeople);

      const filteredCompanies = companies.filter((company) =>
        company.tables?.some((table) =>
          table.invoices.some((invoice) =>
            invoice.address?.toLowerCase().includes(searchTerm.toLowerCase())
          )
        )
      );
      setFilteredCompanies(filteredCompanies);
    } else {
      setFilteredPeople(people);
      setFilteredCompanies(companies);
    }
  }, [searchTerm, people, companies]);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <div className={styles.appContainer}>
      {!isLoggedIn && <LoginModal onLoginSuccess={handleLoginSuccess} />}
      {isLoggedIn && <BackupButton />}
      <header className={styles.header}>
        <a href="https://flooringboss.ca/index">
          <img src={logo} alt="App Logo" className={styles.logo} />
        </a>
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
                <PeopleList people={filteredPeople} />
                <CreatePersonForm
                  onPersonCreated={(newPerson) =>
                    setPeople((prev) => [...prev, newPerson])
                  }
                />
              </div>
            }
          />
          {/* Загальний маршрут для всіх компаній */}
          <Route path="/company/:companyName" element={<CompanyTablesPage />} />
          <Route
            path="/company/:companyName/table/:tableId"
            element={<TableDetailsPage />}
          />
          {/* Маршрути для персональних сторінок */}
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
