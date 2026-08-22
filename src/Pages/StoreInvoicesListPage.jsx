import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { FaStore, FaArrowLeft } from "react-icons/fa";
import { MdOutlineChevronRight } from "react-icons/md";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import commonStyles from "../styles/common.module.css";
import styles from "./StoreInvoicesListPage.module.css";
import toast from "react-hot-toast";

const StoreInvoicesListPage = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("stores")
        .select("id, name")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to load stores.");
        console.error(error);
      } else {
        setStores(data || []);
      }
      setLoading(false);
    };

    fetchStores();
  }, []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileLayout}>
        <div className={styles.header}>
          <button
            className={commonStyles.buttonSecondary}
            onClick={() => navigate(-1)}
            style={{ border: "none" }}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className={styles.pageTitle}>Store Invoices</h1>
          <div style={{ width: "80px" }}></div> {/* Placeholder для балансу */}
        </div>

        <div className={styles.content}>
          {loading ? (
            <div style={{ padding: "20px" }}>
              <SkeletonLoader count={4} />
            </div>
          ) : stores.length > 0 ? (
            <div className={styles.cardsList}>
              {stores.map((store) => (
                <div
                  key={store.id}
                  className={styles.card}
                  onClick={() => navigate(`/store-invoices/${store.id}`)}
                >
                  <div className={styles.cardContent}>
                    <div className={styles.cardTitle}>
                      <FaStore className={styles.iconGold} />
                      {store.name}
                    </div>
                  </div>
                  <MdOutlineChevronRight className={styles.chevronIcon} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No stores available." />
          )}
        </div>
      </div>
    </div>
  );
};

export default StoreInvoicesListPage;
