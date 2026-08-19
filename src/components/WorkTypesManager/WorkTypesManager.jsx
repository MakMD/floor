import { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import styles from "./WorkTypesManager.module.css";
import { FaPlus, FaTrash, FaSave } from "react-icons/fa";
import { useAdminLists } from "../../hooks/useAdminLists";
import {
  addWorkTypeAndInvoice,
  updateWorkTypeAndInvoice,
  deleteWorkTypeAndInvoice,
} from "../../services/workTypeService";

const WorkTypesManager = ({ addressId, addressData }) => {
  const [workTypes, setWorkTypes] = useState([]);
  const [people, setPeople] = useState([]);
  const { workTypeTemplates, loading: listsLoading } = useAdminLists();
  const [loading, setLoading] = useState(true);
  const [newWorkType, setNewWorkType] = useState({
    work_type_template_id: "",
    person_id: "",
    payment_amount: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [workTypesRes, peopleRes] = await Promise.all([
          supabase
            .from("work_types")
            .select("*, people(name), work_type_templates(name)")
            .eq("address_id", addressId)
            .order("created_at"),
          supabase
            .from("people")
            .select("id, name")
            .eq("status", "active")
            .order("name"),
        ]);

        if (workTypesRes.error) throw workTypesRes.error;
        if (peopleRes.error) throw peopleRes.error;

        setWorkTypes(workTypesRes.data);
        setPeople(peopleRes.data);
      } catch (error) {
        toast.error("Failed to load work types.");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addressId]);

  // Тимчасово заморожена функція відправки повідомлень, щоб уникнути помилки 500
  const sendNotification = async (personId) => {
    if (!personId || !addressData?.address || !addressData?.date) {
      return;
    }

    const notificationPayload = {
      personId: personId,
      address: addressData.address,
      date: addressData.date,
    };

    console.log("DEBUG: Notification would be sent here:", notificationPayload);
    toast.success("Дані збережено (Сповіщення тимчасово вимкнено)");

    // TODO: Розкоментувати, коли Edge Function буде повністю налаштована в Supabase
    /*
    try {
      const { data, error } = await supabase.functions.invoke(
        "send-whatsapp-notification",
        { body: notificationPayload }
      );
      if (error) throw error;
    } catch (error) {
      console.error("DEBUG: Error invoking Edge Function:", error);
      toast.error(`Notification failed: ${error.message}`);
    }
    */
  };

  const handleInputChange = (e, id) => {
    const { name, value } = e.target;
    setWorkTypes(
      workTypes.map((wt) => (wt.id === id ? { ...wt, [name]: value } : wt)),
    );
  };

  const handleNewInputChange = (e) => {
    const { name, value } = e.target;
    setNewWorkType((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddWorkType = async () => {
    // Валідація: Обов'язково має бути вибраний тип роботи
    if (!newWorkType.work_type_template_id) {
      toast.error("Please select a Work Type first.");
      return;
    }

    // Санітизація даних перед відправкою (заміна "" на null)
    const payload = {
      address_id: addressId,
      work_type_template_id: newWorkType.work_type_template_id,
      person_id: newWorkType.person_id || null, // Якщо пусто - передаємо null
      payment_amount: newWorkType.payment_amount
        ? parseFloat(newWorkType.payment_amount)
        : 0,
    };

    const addedWorkType = await addWorkTypeAndInvoice(payload);

    if (addedWorkType) {
      setWorkTypes([...workTypes, addedWorkType]);

      if (addedWorkType.person_id) {
        await sendNotification(addedWorkType.person_id);
      }

      setNewWorkType({
        work_type_template_id: "",
        person_id: "",
        payment_amount: "",
      });
    }
  };

  const handleUpdateWorkType = async (id) => {
    const workTypeToUpdate = workTypes.find((wt) => wt.id === id);

    // Отримуємо старе значення person_id з бази, щоб перевірити, чи воно змінилось
    const { data: originalWorkType } = await supabase
      .from("work_types")
      .select("person_id")
      .eq("id", id)
      .single();

    const oldPersonId = originalWorkType?.person_id;

    // Санітизація даних
    const payload = {
      ...workTypeToUpdate,
      person_id: workTypeToUpdate.person_id || null,
      work_type_template_id: workTypeToUpdate.work_type_template_id || null,
      payment_amount: workTypeToUpdate.payment_amount
        ? parseFloat(workTypeToUpdate.payment_amount)
        : 0,
    };

    await updateWorkTypeAndInvoice(payload);
    toast.success("Work type updated");

    // Відправляємо сповіщення, якщо працівника змінили або призначили вперше
    if (payload.person_id && payload.person_id !== oldPersonId) {
      await sendNotification(payload.person_id);
    }
  };

  const handleDeleteWorkType = async (id) => {
    await deleteWorkTypeAndInvoice(id);
    setWorkTypes(workTypes.filter((wt) => wt.id !== id));
  };

  if (loading || listsLoading) return <p>Loading work types...</p>;

  return (
    <div className={styles.container}>
      <div className={styles.workTypeList}>
        {workTypes.map((wt) => (
          <div key={wt.id} className={styles.workTypeItem}>
            <select
              name="work_type_template_id"
              value={wt.work_type_template_id || ""}
              onChange={(e) => handleInputChange(e, wt.id)}
            >
              {workTypeTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <select
              name="person_id"
              value={wt.person_id || ""}
              onChange={(e) => handleInputChange(e, wt.id)}
            >
              <option value="">Unassigned</option>
              {people.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              name="payment_amount"
              placeholder="0.00"
              value={wt.payment_amount || ""}
              onChange={(e) => handleInputChange(e, wt.id)}
              className={styles.inputAmount}
            />
            <div className={styles.actions}>
              <button
                onClick={() => handleUpdateWorkType(wt.id)}
                className={styles.saveButton}
                title="Save changes"
              >
                <FaSave />
              </button>
              <button
                onClick={() => handleDeleteWorkType(wt.id)}
                className={styles.deleteButton}
                title="Delete"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Форма додавання нового запису */}
      <div className={styles.addWorkTypeForm}>
        <select
          name="work_type_template_id"
          value={newWorkType.work_type_template_id}
          onChange={handleNewInputChange}
        >
          <option value="">Select Work Type</option>
          {workTypeTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <select
          name="person_id"
          value={newWorkType.person_id}
          onChange={handleNewInputChange}
        >
          <option value="">Assign Worker</option>
          {people.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="payment_amount"
          placeholder="Amount"
          value={newWorkType.payment_amount}
          onChange={handleNewInputChange}
          className={styles.inputAmount}
        />
        <button onClick={handleAddWorkType} className={styles.addButton}>
          <FaPlus /> Add
        </button>
      </div>
    </div>
  );
};

export default WorkTypesManager;
