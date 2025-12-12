import { useNavigate } from "react-router-dom";
import styles from "./AddressSection.module.css";

const AddressSection = () => {
  const navigate = useNavigate();

  return (
    <div
      className={styles.sectionContainer}
      onClick={() => navigate("/addresses")}
    >
      <h2 className={styles.title}>Address Notes</h2>
      <p className={styles.description}>
        Manage addresses and pre-measuіrement notes like square footage.
      </p>
      <span className={styles.link}>Go to Section →</span>
    </div>
  );
};

export default AddressSection;
