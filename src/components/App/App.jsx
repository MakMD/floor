import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AllTablesList from "../AllTablesList/AllTablesList";
import TablePage from "../../Pages/TablePage";

const App = () => {
  return (
    <Router>
      <div>
        <h1>Invoice Manager</h1>
        <Routes>
          <Route path="/" element={<AllTablesList />} />
          <Route path="/table/:tableName" element={<TablePage />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
