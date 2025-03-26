import { useNavigate } from "react-router-dom";
import styles from "./CompanyList.module.css"; // Підключаємо стилі

const CompanyList = ({ companies }) => {
  const navigate = useNavigate();

  const handleCompanyClick = (companyName) => {
    navigate(`/company/${companyName}`); // Переходимо на сторін
  };

  return (
    <div className={styles.companyList}>
      <h2>Companies</h2>
      <ul>
        {companies.map((company, index) => (
          <li
            key={index}
            className={styles.companyItem}
            onClick={() => handleCompanyClick(company.name)}
          >
            {company.name.toUpperCase()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CompanyList;
