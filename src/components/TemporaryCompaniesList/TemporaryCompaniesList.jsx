// src/components/TemporaryCompaniesList/TemporaryCompaniesList.jsx

import { useState, useEffect } from "react";
import axios from "axios";
import AddCompanyForm from "../AddCompanyForm/AddCompanyForm";

const TemporaryCompaniesList = () => {
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await axios.get(
          "https://66ac12f3f009b9d5c7310a1a.mockapi.io/TemporaryCompanies"
        );
        setCompanies(response.data);
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  // Функція для додавання нової компанії
  const handleCompanyAdded = (newCompany) => {
    setCompanies((prevCompanies) => [...prevCompanies, newCompany]);
  };

  return (
    <div>
      <h2>Temporary Companies</h2>
      <AddCompanyForm onCompanyAdded={handleCompanyAdded} />
      <ul>
        {companies.map((company) => (
          <li key={company.id}>
            <h3>{company.name}</h3>
            <p>{company.details}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TemporaryCompaniesList;
