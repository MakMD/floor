import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import { FaPlus, FaFilePdf, FaTrash, FaSpinner } from "react-icons/fa";
import Modal from "../Modal/Modal";
import commonStyles from "../../styles/common.module.css";
import styles from "./WorkOrdersManager.module.css";
import toast from "react-hot-toast";
import { useAdminLists } from "../../hooks/useAdminLists";
import { usePeople } from "../../hooks/usePeople";

const WorkOrdersManager = ({ addressId }) => {
  // Стани компонента
  const [workOrders, setWorkOrders] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Дані з бази для випадаючих списків
  const { products } = useAdminLists();
  const { people } = usePeople();

  // Стан форми
  const initialFormState = {
    area: "",
    product_id: "",
    sq_ft: "",
    worker_id: "",
    people_count: "",
    date_completed: "",
  };
  const [form, setForm] = useState(initialFormState);

  // Завантаження списку Ворк Ордерів
  const loadWorkOrders = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("work_orders")
      .select("*, products(name), people(name)")
      .eq("address_id", addressId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Помилка завантаження WO:", error);
      toast.error("Failed to load work orders.");
    } else {
      setWorkOrders(data || []);
    }
    setIsLoading(false);
  }, [addressId]);

  useEffect(() => {
    if (addressId) {
      loadWorkOrders();
    }
  }, [addressId, loadWorkOrders]);

  // Обробка вводу у формі
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ЗБЕРЕЖЕННЯ (Переписано для максимальної надійності)
  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Строге форматування даних перед відправкою
      const payload = {
        address_id: parseInt(addressId, 10),
        area: form.area.trim() !== "" ? form.area.trim() : null,
        product_id: form.product_id ? parseInt(form.product_id, 10) : null,
        sq_ft: form.sq_ft ? parseFloat(form.sq_ft) : null,
        worker_id: form.worker_id ? parseInt(form.worker_id, 10) : null,
        people_count: form.people_count
          ? parseInt(form.people_count, 10)
          : null,
        date_completed: form.date_completed !== "" ? form.date_completed : null,
      };

      // Відправка в базу даних
      const { data, error } = await supabase
        .from("work_orders")
        .insert([payload])
        .select(); // Додано .select(), щоб відразу отримати результат

      // Перевірка на помилку бази
      if (error) {
        console.error("Помилка бази даних Supabase:", error);
        toast.error(`DB Error: ${error.message}`);
        setIsSaving(false);
        return; // Зупиняємо виконання
      }

      // Якщо успішно
      toast.success("Work Order successfully created!");
      setForm(initialFormState); // Очищаємо форму
      setIsModalOpen(false); // Закриваємо модалку
      loadWorkOrders(); // Оновлюємо список
    } catch (err) {
      console.error("Критична помилка коду:", err);
      toast.error("Critical error. Check console.");
    } finally {
      setIsSaving(false); // Знімаємо стан завантаження в будь-якому випадку
    }
  };

  // ВИДАЛЕННЯ
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Work Order?"))
      return;

    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) {
      toast.error("Error deleting Work Order.");
      console.error(error);
    } else {
      toast.success("Work Order deleted.");
      loadWorkOrders();
    }
  };

  // Drag-and-Drop плейсхолдер
  const handleDragStart = (e, wo) => {
    e.dataTransfer.setData("text/plain", `Work Order ID: ${wo.id}`);
  };

  return (
    <div className={styles.managerContainer}>
      {/* Шапка з кнопкою додавання */}
      <div className={styles.header}>
        <button
          className={commonStyles.buttonPrimary}
          onClick={() => setIsModalOpen(true)}
        >
          <FaPlus /> Add Work Order
        </button>
      </div>

      {/* Список збережених Ворк Ордерів */}
      {isLoading ? (
        <p>Loading work orders...</p>
      ) : workOrders.length > 0 ? (
        <ul className={styles.woList}>
          {workOrders.map((wo) => (
            <li
              key={wo.id}
              className={styles.woItem}
              draggable="true"
              onDragStart={(e) => handleDragStart(e, wo)}
              title="Drag me!"
            >
              <div className={styles.woInfo}>
                <span className={styles.woTitle}>
                  <FaFilePdf style={{ color: "#d32f2f", marginRight: "8px" }} />
                  {wo.area || "Unnamed Area"}
                </span>
                <span className={styles.woMeta}>
                  Product: {wo.products?.name || "N/A"} | Sq Ft: {wo.sq_ft || 0}{" "}
                  | Installer: {wo.people?.name || "None"}
                </span>
              </div>
              <button
                className={commonStyles.buttonIcon}
                onClick={() => handleDelete(wo.id)}
              >
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "var(--color-text-secondary)" }}>
          No work orders created yet.
        </p>
      )}

      {/* Модальне вікно з формою */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isSaving && setIsModalOpen(false)}
        title="New Work Order"
      >
        <div className={styles.formGrid}>
          <div className={styles.inputGroup}>
            <label>Area (e.g. Whole Main Floor)</label>
            <input
              type="text"
              name="area"
              value={form.area}
              onChange={handleChange}
              placeholder="Enter area..."
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Product</label>
            <select
              name="product_id"
              value={form.product_id}
              onChange={handleChange}
            >
              <option value="">-- Select Product --</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Square Feet</label>
            <input
              type="number"
              name="sq_ft"
              value={form.sq_ft}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Installer Signature (Optional)</label>
            <select
              name="worker_id"
              value={form.worker_id}
              onChange={handleChange}
            >
              <option value="">-- Select Installer --</option>
              {people?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>People on Site</label>
            <input
              type="number"
              name="people_count"
              value={form.people_count}
              onChange={handleChange}
              placeholder="0"
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Date Completed (Optional)</label>
            <input
              type="date"
              name="date_completed"
              value={form.date_completed}
              onChange={handleChange}
            />
          </div>

          <button
            className={commonStyles.buttonSuccess}
            onClick={handleSave}
            disabled={isSaving}
            style={{
              marginTop: "16px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {isSaving ? (
              <>
                <FaSpinner className="spin" /> Saving...
              </>
            ) : (
              "Save Work Order"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkOrdersManager;
