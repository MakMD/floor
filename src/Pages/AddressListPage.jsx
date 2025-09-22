// src/Pages/AddressListPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAddresses } from "../hooks/useAddresses"; // ІМПОРТ
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import { FaArrowLeft, FaPlus, FaEdit, FaCheck, FaTrash } from "react-icons/fa";
import styles from "./AddressListPage.module.css";
import toast from "react-hot-toast";

const AddressListPage = () => {
  const { addresses, loading, refetch } = useAddresses(); // ВИКОРИСТАННЯ
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddresses, setEditedAddresses] = useState({});
  const navigate = useNavigate();

  const [newAddressData, setNewAddressData] = useState({
    date: "",
    address: "",
    square_feet: "",
  });

  useEffect(() => {
    const namesMap = addresses.reduce((acc, item) => {
      acc[item.id] = item.address;
      return acc;
    }, {});
    setEditedAddresses(namesMap);
  }, [addresses]);

  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddressData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddAddress = async () => {
    if (
      newAddressData.address.trim() === "" ||
      newAddressData.date.trim() === ""
    ) {
      toast.error("Address and Date cannot be empty.");
      return;
    }

    const newAddressObject = {
      address: newAddressData.address.trim(),
      date: newAddressData.date,
      square_feet: newAddressData.square_feet
        ? parseInt(newAddressData.square_feet, 10)
        : null,
      notes: [],
      files: [],
      builders: [],
      material_notes: [],
    };

    const { error } = await supabase
      .from("addresses")
      .insert([newAddressObject]);
    if (error) {
      toast.error(`Error adding address: ${error.message}`);
    } else {
      setNewAddressData({ date: "", address: "", square_feet: "" });
      toast.success("Address added successfully!");
      refetch();
    }
  };

  const handleUpdateAddressName = async (id, newName) => {
    if (newName.trim() === "") {
      toast.error("Address name cannot be empty.");
      return;
    }
    const { error } = await supabase
      .from("addresses")
      .update({ address: newName.trim() })
      .eq("id", id);
    if (error) toast.error("Failed to update address name.");
    else {
      toast.success("Address name updated successfully!");
      refetch();
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) toast.error("Failed to delete address.");
    else {
      toast.success("Address deleted successfully!");
      refetch();
    }
  };

  const filteredAddresses = addresses.filter((item) =>
    item.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <div className={styles.searchSection}>
          <input
            type="text"
            placeholder="Search address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.addForm}>
          <input
            type="date"
            name="date"
            value={newAddressData.date}
            onChange={handleNewAddressChange}
            className={styles.addInput}
          />
          <input
            type="text"
            name="address"
            placeholder="Address"
            value={newAddressData.address}
            onChange={handleNewAddressChange}
            className={styles.addInput}
          />
          <input
            type="number"
            name="square_feet"
            placeholder="Square Feet"
            value={newAddressData.square_feet}
            onChange={handleNewAddressChange}
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
                    onChange={(e) =>
                      setEditedAddresses((p) => ({
                        ...p,
                        [item.id]: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      handleUpdateAddressName(item.id, editedAddresses[item.id])
                    }
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
                  <strong>{item.address}</strong>
                  <br />
                  {item.date && <span>Date: {item.date}</span>}
                  {item.builders && item.builders.length > 0 && (
                    <span> | Builder: {item.builders[0]}</span>
                  )}
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
