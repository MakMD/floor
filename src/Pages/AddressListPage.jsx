// src/Pages/AddressListPage.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAddresses } from "../hooks/useAddresses";
import { useAdminLists } from "../hooks/useAdminLists";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import { FaArrowLeft, FaPlus, FaEdit, FaCheck, FaTrash } from "react-icons/fa";
import styles from "./AddressListPage.module.css";
import toast from "react-hot-toast";

const StatusIndicator = ({ status }) => {
  const statusClass =
    {
      "In Process": styles.statusInProgress,
      Ready: styles.statusReady,
      "Not Finished": styles.statusNotFinished,
    }[status] || "";

  return (
    <div className={`${styles.statusIndicator} ${statusClass}`}>
      <span>{status || "No Status"}</span>
    </div>
  );
};

const AddressListPage = () => {
  const { addresses, loading: addressesLoading, refetch } = useAddresses();
  const { builders, stores, loading: listsLoading } = useAdminLists();

  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddresses, setEditedAddresses] = useState({});
  const navigate = useNavigate();

  const [newAddressData, setNewAddressData] = useState({
    store_id: "",
    builder_id: "",
    address: "",
    date: "",
    total_amount: "",
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
    const { address, date, total_amount, store_id, builder_id } =
      newAddressData;
    if (!address.trim() || !date) {
      toast.error("Address and Date are required fields.");
      return;
    }

    const newAddressObject = {
      address: address.trim(),
      date: date,
      total_amount: total_amount ? parseFloat(total_amount) : null,
      store_id: store_id ? parseInt(store_id) : null,
      builder_id: builder_id ? parseInt(builder_id) : null,
      status: "In Process",
    };

    const { error } = await supabase
      .from("addresses")
      .insert([newAddressObject]);
    if (error) {
      toast.error(`Error adding address: ${error.message}`);
    } else {
      setNewAddressData({
        store_id: "",
        builder_id: "",
        address: "",
        date: "",
        total_amount: "",
      });
      toast.success("Address added successfully!");
      refetch();
    }
  };

  const handleUpdateAddressName = async (id, newName) => {
    if (!newName || newName.trim() === "") {
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
      toast.error("Failed to update address name.");
    } else {
      toast.success("Address name updated successfully!");
      refetch();
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete address.");
    } else {
      toast.success("Address deleted successfully!");
      refetch();
    }
  };

  const handleNameChange = (id, value) => {
    setEditedAddresses((prev) => ({ ...prev, [id]: value }));
  };

  const filteredAddresses = addresses.filter((item) =>
    (item.address || "").toLowerCase().includes(searchTerm.toLowerCase())
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

      {/* ОНОВЛЕНО: JSX структура форми змінена для відповідності макету */}
      <div className={styles.addFormSection}>
        <h3>Create New Project</h3>
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="store_id">Store</label>
              <select
                id="store_id"
                name="store_id"
                value={newAddressData.store_id}
                onChange={handleNewAddressChange}
                disabled={listsLoading}
              >
                <option value="">Select a store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="builder_id">Builder</label>
              <select
                id="builder_id"
                name="builder_id"
                value={newAddressData.builder_id}
                onChange={handleNewAddressChange}
                disabled={listsLoading}
              >
                <option value="">Select a builder</option>
                {builders.map((builder) => (
                  <option key={builder.id} value={builder.id}>
                    {builder.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.inputGroup}>
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                name="address"
                placeholder="Job site address"
                value={newAddressData.address}
                onChange={handleNewAddressChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                type="date"
                name="date"
                value={newAddressData.date}
                onChange={handleNewAddressChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="total_amount">Total Amount</label>
              <input
                id="total_amount"
                type="number"
                name="total_amount"
                placeholder="0.00"
                value={newAddressData.total_amount}
                onChange={handleNewAddressChange}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>&nbsp;</label>
              <button onClick={handleAddAddress} className={styles.addButton}>
                <FaPlus /> Add Project
              </button>
            </div>
          </div>
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
      </div>

      {addressesLoading ? (
        <div className={styles.addressList}>
          <SkeletonLoader count={5} />
        </div>
      ) : addresses.length > 0 ? (
        <ul className={styles.addressList}>
          {filteredAddresses.map((item, index) => {
            const statusBorderClass =
              {
                "In Process": styles.inProcessBorder,
                Ready: styles.readyBorder,
                "Not Finished": styles.notFinishedBorder,
              }[item.status] || "";

            return (
              <li
                key={item.id}
                className={`${styles.addressItem} ${
                  isEditing ? styles.editing : ""
                } ${statusBorderClass}`}
                onClick={() => !isEditing && navigate(`/address/${item.id}`)}
              >
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editedAddresses[item.id] || ""}
                      onChange={(e) =>
                        handleNameChange(item.id, e.target.value)
                      }
                      onBlur={() =>
                        handleUpdateAddressName(
                          item.id,
                          editedAddresses[item.id]
                        )
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
                  <>
                    <div className={styles.itemContent}>
                      <span className={styles.itemNumber}>{index + 1}.</span>
                      <div className={styles.itemDetails}>
                        <span className={styles.addressName}>
                          {item.address}
                        </span>
                        <div className={styles.itemMeta}>
                          {item.builders?.name && (
                            <span>Builder: {item.builders.name}</span>
                          )}
                          {item.stores?.name && (
                            <span>Store: {item.stores.name}</span>
                          )}
                          {item.date && <span>Date: {item.date}</span>}
                        </div>
                      </div>
                    </div>
                    <StatusIndicator status={item.status} />
                  </>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState message="No addresses found. Add one to get started!" />
      )}
    </div>
  );
};

export default AddressListPage;
