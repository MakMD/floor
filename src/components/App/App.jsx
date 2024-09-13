import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import axios from "axios";
import AllTablesList from "../AllTablesList/AllTablesList"; // Список таблиць
import TablePage from "../../Pages/TablePage"; // Сторінка окремої таблиці
import PeopleList from "../PeopleList/PeopleList"; // Список людей
import CreatePersonForm from "../CreatePersonForm/CreatePersonForm"; // Форма для створення нової людини
import PersonPage from "../../Pages/PersonPage"; // Сторінка людини

const App = () => {
  const [people, setPeople] = useState([]);

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
          {/* Головна сторінка, яка показує і список таблиць, і список людей */}
          <Route
            path="/"
            element={
              <div>
                {/* Список таблиць */}
                <AllTablesList />
                {/* Список людей */}
                <PeopleList people={people} />
                {/* Форма для додавання нової людини */}
                <CreatePersonForm />
              </div>
            }
          />

          {/* Сторінка для конкретної людини */}
          <Route path="/person/:personId" element={<PersonPage />} />

          {/* Сторінка для конкретної таблиці */}
          <Route path="/table/:tableName" element={<TablePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
