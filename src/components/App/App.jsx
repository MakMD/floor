import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import NewCompanyTablesPage from "../NewCompanyTablePage/NewCompanyTablePage"; // Додаємо нову компанію
import NewCompanyTableDetails from "../NewCompanyTablePage/NewCompanyTableDetails";

const App = () => {
  const [people, setPeople] = useState([]);
  const [companies] = useState([
    { name: "google" },
    { name: "apple" },
    { name: "samsung" },
    { name: "cwp" },
    { name: "amazon" },
    { name: "norseman" },
    { name: "newCompany" }, // Додаємо нову компанію
  ]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get(
          "https://66e3d74dd2405277ed1201b1.mockapi.io/people"
        );
        setPeople(response.data);
      } catch (error) {
        console.error("Error fetching people:", error);
      }
    };
    fetchPeople();
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <Router>
      <div>
        {!isLoggedIn && <LoginModal onLoginSuccess={handleLoginSuccess} />}

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

        {isLoggedIn && (
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  <CompanyList companies={companies} />
                  <PeopleList people={people} />
                  <CreatePersonForm
                    onPersonCreated={(newPerson) =>
                      setPeople((prev) => [...prev, newPerson])
                    }
                  />
                </div>
              }
            />

            <Route
              path="/company/:companyName"
              element={<CompanyTablesPage />}
            />

            {/* Новий маршрут для нової компанії */}
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

            {/* Новий маршрут для деталей таблиці нової компанії */}
            <Route
              path="/company/newcompany/table/:tableId"
              element={<NewCompanyTableDetails />}
            />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;
