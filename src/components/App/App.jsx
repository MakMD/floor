import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom"; // useLocation правильно в Router
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
import NewCompanyTablesPage from "../NewCompanyTablePage/NewCompanyTablePage";
import NewCompanyTableDetails from "../NewCompanyTablePage/NewCompanyTableDetails";
import BackupButton from "../BackupButton/BackupButton";

const AppContent = () => {
  const [people, setPeople] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchTerm, setSearchTerm] = useState(""); // Стан для пошуку
  const [filteredPeople, setFilteredPeople] = useState([]);
  const [filteredCompanies, setFilteredCompanies] = useState([]);

  const companyResources = [
    "google",
    "apple",
    "samsung",
    "cwp",
    "amazon",
    "newCompany",
    "example",
  ];

  const location = useLocation(); // useLocation правильно використано всередині компонента

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get(
          "https://66e3d74dd2405277ed1201b1.mockapi.io/people"
        );
        setPeople(response.data);
        setFilteredPeople(response.data); // Ініціалізація фільтрованих людей
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

  // Фільтрація компаній та людей за пошуковим запитом
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
    <div>
      {!isLoggedIn && <LoginModal onLoginSuccess={handleLoginSuccess} />}
      {isLoggedIn && <BackupButton />}
      <header
        className="header"
        style={{ textAlign: "center", padding: "10px" }}
      >
        <a href="https://flooringboss.ca/index">
          <img
            src={logo}
            alt="App Logo"
            style={{ width: "300px", height: "auto" }}
          />
        </a>
      </header>

      {/* Поле для пошуку тільки на головній сторінці */}
      {isLoggedIn && location.pathname === "/" && (
        <div style={{ textAlign: "center", margin: "20px" }}>
          <input
            type="text"
            placeholder="Search by address"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px", width: "300px" }}
          />
        </div>
      )}

      {isLoggedIn && (
        <Routes>
          <Route
            path="/"
            element={
              <div>
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
          <Route path="/company/:companyName" element={<CompanyTablesPage />} />
          <Route
            path="/company/newcompany"
            element={<NewCompanyTablesPage />}
          />
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
          <Route
            path="/company/newcompany/table/:tableId"
            element={<NewCompanyTableDetails />}
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
