import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
// import AllTablesList from "../AllTablesList/AllTablesList"; // Список таблиць
// import TablePage from "../../Pages/TablePage"; // Сторінка окремої таблиці
import PeopleList from "../PeopleList/PeopleList"; // Список людей
import CreatePersonForm from "../CreatePersonForm/CreatePersonForm"; // Форма для створення нової людини
import PersonPage from "../../Pages/PersonPage"; // Сторінка людини
import CompanyList from "../CompanyList/CompanyList"; // Новий список компаній
import CompanyTablesPage from "../../Pages/CompanyTablesPage"; // Список таблиць компанії
import TableDetailsPage from "../../Pages/TableDetailsPage"; // Сторінка деталей таблиці
import PersonTablesPage from "../../Pages/PersonTablesPage";

const App = () => {
  const [people, setPeople] = useState([]);
  const [companies] = useState([
    { name: "google" },
    { name: "apple" },
    { name: "samsung" },
    { name: "cwp" },
    { name: "samsung" },
    { name: "norseman" },
  ]);

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

  return (
    <Router>
      <div>
        <h1>Invoice Manager</h1>

        <Routes>
          {/* Головна сторінка */}
          <Route
            path="/"
            element={
              <div>
                {/* Список компаній */}
                <CompanyList companies={companies} />

                {/* Список таблиць */}
                {/* <AllTablesList /> */}

                {/* Список людей */}
                <PeopleList people={people} />

                {/* Форма для додавання нової людини */}
                <CreatePersonForm />
              </div>
            }
          />

          {/* Сторінка для конкретної компанії */}
          <Route path="/company/:companyName" element={<CompanyTablesPage />} />

          {/* Сторінка для конкретної таблиці */}
          <Route
            path="/company/:companyName/table/:tableId"
            element={<TableDetailsPage />}
          />

          {/* Сторінка для конкретної людини */}
          <Route path="/person/:personId" element={<PersonPage />} />
          <Route
            path="/person/:personId/tables"
            element={<PersonTablesPage />}
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
