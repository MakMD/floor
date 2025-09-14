// src/components/CompanySection/CompanySection.jsx

import { useNavigate } from "react-router-dom";
import styles from "../AddressSection/AddressSection.module.css"; // Ми можемо перевикористати ці стилі!

const CompanySection = () => {
  const navigate = useNavigate();

  return (
    <div
      className={styles.sectionContainer}
      onClick={() => navigate("/companies")}
    >
      <h2 className={styles.title}>Companies</h2>
      <p className={styles.description}>
        Manage company profiles and their invoice tables.
      </p>
      <span className={styles.link}>Go to Section →</span>
    </div>
  );
};

export default CompanySection;
