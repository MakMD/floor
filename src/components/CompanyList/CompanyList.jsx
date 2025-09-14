// src/components/CompanyList/CompanyList.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./CompanyList.module.css";

const CompanyList = ({
  companies,
  isEditing,
  onUpdateCompanyName,
  onToggleCompanyStatus,
}) => {
  const navigate = useNavigate();
  const [editedNames, setEditedNames] = useState({});

  useEffect(() => {
    const namesMap = companies.reduce((acc, company) => {
      acc[company.id] = company.name;
      return acc;
    }, {});
    setEditedNames(namesMap);
  }, [companies]);

  const handleNameChange = (id, value) => {
    setEditedNames((prev) => ({ ...prev, [id]: value }));
  };

  const handleNameSave = (id) => {
    const originalCompany = companies.find((c) => c.id === id);
    if (
      originalCompany &&
      originalCompany.name !== editedNames[id].trim() &&
      editedNames[id].trim() !== ""
    ) {
      onUpdateCompanyName(id, editedNames[id].trim());
    } else {
      setEditedNames((prev) => ({ ...prev, [id]: originalCompany.name }));
    }
  };

  const handleCompanyClick = (companyName) => {
    if (isEditing) return;
    navigate(`/company/${companyName}`);
  };

  return (
    <div className={styles.companyListContainer}>
      <ul className={styles.companyGrid}>
        {companies.map((company) => {
          const tableCount = company.invoiceTables?.length || 0;
          return (
            <li
              key={company.id}
              className={`${styles.companyItem} ${
                isEditing ? styles.editing : ""
              }`}
              onClick={() => handleCompanyClick(company.name)}
            >
              <div className={styles.companyInfo}>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedNames[company.id] || ""}
                    className={styles.editNameInput}
                    onChange={(e) =>
                      handleNameChange(company.id, e.target.value)
                    }
                    onBlur={() => handleNameSave(company.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className={styles.companyName}>{company.name}</span>
                )}
                <span className={styles.tableCount}>Tables: {tableCount}</span>
              </div>

              {isEditing && (
                <button
                  className={styles.toggleStatusButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCompanyStatus(company.id, company.status);
                  }}
                >
                  {company.status === "active" ? "To Inactive" : "To Active"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default CompanyList;
