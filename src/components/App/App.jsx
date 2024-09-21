import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import PeopleList from "../PeopleList/PeopleList"; // Список людей
import CreatePersonForm from "../CreatePersonForm/CreatePersonForm"; // Форма для створення нової людини
import PersonPage from "../../Pages/PersonPage"; // Сторінка людини
import CompanyList from "../CompanyList/CompanyList"; // Новий список компаній
import CompanyTablesPage from "../../Pages/CompanyTablesPage"; // Список таблиць компанії
import TableDetailsPage from "../../Pages/TableDetailsPage"; // Сторінка деталей таблиці
import PersonTablesPage from "../../Pages/PersonTablesPage"; // Список таблиць для людини
import PersonTableDetailsPage from "../../Pages/PersonTableDetailsPage"; // Сторінка деталей таблиці людини
import LoginModal from "../LoginModal/LoginModal"; // Модальне вікно для логіну
import logo from "../../../public/Flooring.Boss.svg"; // Лого

const App = () => {
  const [people, setPeople] = useState([]);
  const [companies] = useState([
    { name: "google" },
    { name: "apple" },
    { name: "samsung" },
    { name: "cwp" },
    { name: "amazon" },
    { name: "norseman" },
  ]);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Стан логіну
  // const [password, setPassword] = useState(""); // Для пароля

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
    setIsLoggedIn(true); // Змінюємо стан на логін
  };

  return (
    <Router>
      <div>
        {/* Показуємо модальне вікно, якщо не увійшли */}
        {!isLoggedIn && <LoginModal onLoginSuccess={handleLoginSuccess} />}

        {/* Іконка на верху сторінки */}
        <header style={{ textAlign: "center", padding: "10px" }}>
          <a href="https://flooringboss.ca/index">
            <img
              src={logo}
              alt="App Logo"
              style={{ width: "300px", height: "auto" }}
            />
          </a>
        </header>

        {/* Головна сторінка */}
        {isLoggedIn && (
          <Routes>
            <Route
              path="/"
              element={
                <div>
                  {/* Список компаній */}
                  <CompanyList companies={companies} />

                  {/* Список людей */}
                  <PeopleList people={people} />

                  {/* Форма для додавання нової людини */}
                  <CreatePersonForm
                    onPersonCreated={(newPerson) =>
                      setPeople((prev) => [...prev, newPerson])
                    }
                  />
                </div>
              }
            />

            {/* Сторінка для конкретної компанії */}
            <Route
              path="/company/:companyName"
              element={<CompanyTablesPage />}
            />

            {/* Сторінка для конкретної таблиці компанії */}
            <Route
              path="/company/:companyName/table/:tableId"
              element={<TableDetailsPage />}
            />

            {/* Сторінка для конкретної людини */}
            <Route path="/person/:personId" element={<PersonPage />} />
            {/* Сторінка для таблиць людини */}
            <Route
              path="/person/:personId/tables"
              element={<PersonTablesPage />}
            />

            {/* Сторінка для деталей таблиці людини */}
            <Route
              path="/person/:personId/tables/:tableId"
              element={<PersonTableDetailsPage />}
            />
          </Routes>
        )}
      </div>
    </Router>
  );
};

export default App;
