// src/components/MaterialsManager/MaterialsManager.jsx

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import { useAdminLists } from "../../hooks/useAdminLists";
import { FaPlus, FaTrash } from "react-icons/fa";
import styles from "./MaterialsManager.module.css";

const MaterialsManager = ({ addressId }) => {
  const [attachedMaterials, setAttachedMaterials] = useState([]);
  const [newMaterial, setNewMaterial] = useState({
    material_id: "",
    quantity: 1,
  });
  const [loading, setLoading] = useState(true);
  const { materials: allMaterials, loading: materialsLoading } =
    useAdminLists();

  const fetchAttachedMaterials = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("address_materials")
      .select("id, quantity, materials(name)")
      .eq("address_id", addressId);

    if (error) {
      toast.error("Failed to load attached materials.");
      console.error(error);
    } else {
      setAttachedMaterials(data);
    }
    setLoading(false);
  }, [addressId]);

  useEffect(() => {
    fetchAttachedMaterials();
  }, [fetchAttachedMaterials]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddMaterial = async () => {
    if (!newMaterial.material_id || !newMaterial.quantity) {
      toast.error("Please select a material and specify a quantity.");
      return;
    }

    const { data, error } = await supabase
      .from("address_materials")
      .insert({
        address_id: addressId,
        material_id: newMaterial.material_id,
        quantity: newMaterial.quantity,
      })
      .select("id, quantity, materials(name)")
      .single();

    if (error) {
      toast.error(error.message || "Failed to add material.");
    } else {
      setAttachedMaterials((prev) => [...prev, data]);
      setNewMaterial({ material_id: "", quantity: 1 });
      toast.success("Material added!");
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Are you sure you want to delete this material?"))
      return;

    const { error } = await supabase
      .from("address_materials")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete material.");
    } else {
      setAttachedMaterials((prev) => prev.filter((m) => m.id !== id));
      toast.success("Material deleted.");
    }
  };

  if (loading || materialsLoading) {
    return <p>Loading materials...</p>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.addForm}>
        <select
          name="material_id"
          value={newMaterial.material_id}
          onChange={handleInputChange}
          className={styles.selectField}
        >
          <option value="">Select a material</option>
          {allMaterials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="quantity"
          value={newMaterial.quantity}
          onChange={handleInputChange}
          className={styles.quantityInput}
          min="1"
        />
        <button onClick={handleAddMaterial} className={styles.addButton}>
          <FaPlus />
        </button>
      </div>

      {attachedMaterials.length > 0 ? (
        <ul className={styles.materialList}>
          {attachedMaterials.map((item) => (
            <li key={item.id} className={styles.materialItem}>
              <span>{item.materials.name}</span>
              <div className={styles.quantityControls}>
                <span>Qty: {item.quantity}</span>
                <button
                  onClick={() => handleDeleteMaterial(item.id)}
                  className={styles.deleteButton}
                >
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.noItemsMessage}>No materials added yet.</p>
      )}
    </div>
  );
};

export default MaterialsManager;
