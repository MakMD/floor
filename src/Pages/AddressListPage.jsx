// src/Pages/AddressListPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import { FaArrowLeft, FaPlus, FaEdit, FaCheck, FaTrash } from "react-icons/fa";
import styles from "./AddressListPage.module.css";
import toast from "react-hot-toast";

const AddressListPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [filteredAddresses, setFilteredAddresses] = useState([]);
  const [newAddress, setNewAddress] = useState("");
  const [newSquareFeet, setNewSquareFeet] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddresses, setEditedAddresses] = useState({});
  const navigate = useNavigate();

  const fetchAddresses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .order("address", { ascending: true });
    if (error) {
      console.error("Error fetching addresses:", error);
      toast.error("Error fetching addresses.");
    } else {
      setAddresses(data);
      setFilteredAddresses(data);
      const namesMap = data.reduce((acc, item) => {
        acc[item.id] = item.address;
        return acc;
      }, {});
      setEditedAddresses(namesMap);
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
    if (newAddress.trim() === "") {
      toast.error("Address cannot be empty.");
      return;
    }
    const { data, error } = await supabase
      .from("addresses")
      .insert([
        {
          address: newAddress.trim(),
          square_feet: newSquareFeet ? parseInt(newSquareFeet, 10) : null,
          notes: [],
        },
      ])
      .select();
    if (error) {
      console.error("Error adding address:", error);
      toast.error(`Error adding address: ${error.message}`);
    } else {
      setAddresses((prev) => [data[0], ...prev]);
      setNewAddress("");
      setNewSquareFeet("");
      toast.success("Address added successfully!");
    }
  };

  const handleUpdateAddressName = async (id, newName) => {
    if (newName.trim() === "") {
      toast.error("Address name cannot be empty.");
      setEditedAddresses((prev) => ({
        ...prev,
        [id]: addresses.find((a) => a.id === id).address,
      }));
      return;
    }
    const { error } = await supabase
      .from("addresses")
      .update({ address: newName.trim() })
      .eq("id", id);
    if (error) {
      console.error("Error updating address name:", error);
      toast.error("Failed to update address name.");
    } else {
      await fetchAddresses();
      toast.success("Address name updated successfully!");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) {
      console.error("Error deleting address:", error);
      toast.error("Failed to delete address.");
    } else {
      await fetchAddresses();
      toast.success("Address deleted successfully!");
    }
  };

  const handleNameChange = (id, value) => {
    setEditedAddresses((prev) => ({ ...prev, [id]: value }));
  };

  const handleNameSave = (id) => {
    handleUpdateAddressName(id, editedAddresses[id]);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate("/")}>
          <FaArrowLeft /> Back to Main
        </button>
        <h1 className={styles.pageTitle}>Address Notes</h1>
        <div className={styles.controls}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`${styles.editButton} ${
              isEditing ? styles.doneButton : ""
            }`}
          >
            {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <div className={styles.toolbar}>
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
          <input
            type="number"
            placeholder="Sq. ft."
            value={newSquareFeet}
            onChange={(e) => setNewSquareFeet(e.target.value)}
            className={styles.addInput}
          />
          <button onClick={handleAddAddress} className={styles.addButton}>
            <FaPlus /> Add Address
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
              className={`${styles.addressItem} ${
                isEditing ? styles.editing : ""
              }`}
              onClick={() => !isEditing && navigate(`/address/${item.id}`)}
            >
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={editedAddresses[item.id] || ""}
                    onChange={(e) => handleNameChange(item.id, e.target.value)}
                    onBlur={() => handleNameSave(item.id)}
                    onClick={(e) => e.stopPropagation()}
                    className={styles.editInput}
                  />
                  <button
                    className={styles.deleteButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteAddress(item.id);
                    }}
                  >
                    <FaTrash />
                  </button>
                </>
              ) : (
                <span>
                  {item.address}{" "}
                  {item.square_feet ? `(${item.square_feet} sq.ft.)` : ""}
                </span>
              )}
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
