// src/Pages/AddressListPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import styles from "./AddressListPage.module.css";

const AddressListPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAddresses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("address", { ascending: true });
    if (error) console.error("Error fetching addresses:", error);
    else {
      setAddresses(data);
      setFilteredAddresses(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useEffect(() => {
    const filtered = addresses.filter((item) =>
      item.address.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAddresses(filtered);
  }, [searchTerm, addresses]);

  const handleAddAddress = async () => {
    if (newAddress.trim() === "") return;
    const { data, error } = await supabase
      .from("addresses")
      .insert([{ address: newAddress.trim(), notes: [] }])
      .select();
    if (error) console.error("Error adding address:", error);
    else {
      setAddresses((prev) => [data[0], ...prev]);
      setNewAddress("");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <button className={styles.backButton} onClick={() => navigate("/")}>
        Back to Main
      </button>
      <h1 className={styles.pageTitle}>Address Notes</h1>

      <div className={styles.controls}>
        <input
          type="text"
          placeholder="Search address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <div className={styles.addForm}>
          <input
            type="text"
            placeholder="Enter new address"
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className={styles.addInput}
          />
          <button onClick={handleAddAddress} className={styles.addButton}>
            Add Address
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.addressList}>
          <SkeletonLoader count={5} />
        </div>
      ) : addresses.length > 0 ? (
        <ul className={styles.addressList}>
          {filteredAddresses.map((item) => (
            <li
              key={item.id}
              className={styles.addressItem}
              onClick={() => navigate(`/address/${item.id}`)}
            >
              {item.address}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="No addresses found. Add one to get started!" />
      )}
    </div>
  );
};

export default AddressListPage;
