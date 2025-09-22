// src/components/AdminListManager/AdminListManager.jsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import styles from "./AdminListManager.module.css";
import { FaPlus, FaTrash } from "react-icons/fa";

const AdminListManager = ({ tableName, itemName }) => {
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from(tableName)
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      toast.error(`Failed to fetch ${itemName}s.`);
      console.error(error);
    } else {
      setItems(data);
    }
    setLoading(false);
  }, [tableName, itemName]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleAddItem = async () => {
    if (newItemName.trim() === "") {
      toast.error("Name cannot be empty.");
      return;
    }
    const { error } = await supabase
      .from(tableName)
      .insert({ name: newItemName.trim() });

    if (error) {
      toast.error(`Failed to add ${itemName}: ${error.message}`);
    } else {
      toast.success(
        `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} added!`
      );
      setNewItemName("");
      fetchItems();
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm(`Are you sure you want to delete this ${itemName}?`))
      return;

    const { error } = await supabase.from(tableName).delete().eq("id", id);

    if (error) {
      toast.error(`Failed to delete ${itemName}: ${error.message}`);
    } else {
      toast.success(
        `${itemName.charAt(0).toUpperCase() + itemName.slice(1)} deleted.`
      );
      fetchItems();
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder={`New ${itemName} name...`}
          className={styles.inputField}
        />
        <button onClick={handleAddItem} className={styles.addButton}>
          <FaPlus />
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => (
            <li key={item.id} className={styles.listItem}>
              <span>{item.name}</span>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className={styles.deleteButton}
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AdminListManager;
