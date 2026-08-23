// src/Pages/BuildersListPage.jsx
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import {
  FaTrash,
  FaEdit,
  FaPlus,
  FaCheck,
  FaTimes,
  FaBuilding,
  FaCamera,
  FaInfoCircle,
} from "react-icons/fa";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import commonStyles from "../styles/common.module.css";
import styles from "./BuildersListPage.module.css";
import toast from "react-hot-toast";

const BuildersListPage = () => {
  const [builders, setBuilders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Стейти модалок
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [previewBuilder, setPreviewBuilder] = useState(null); // Модалка прев'ю

  const [formData, setFormData] = useState({
    name: "",
    instructions: "",
    instruction_image_url: null,
  });

  const [isUploading, setIsUploading] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const fileInputRef = useRef(null);

  const fetchBuilders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("builders")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setBuilders(data || []);
    } catch (error) {
      console.error("Помилка завантаження білдерів:", error);
      toast.error("Не вдалося завантажити список білдерів.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuilders();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", instructions: "", instruction_image_url: null });
    setIsModalOpen(true);
  };

  const openEditModal = (e, builder) => {
    e.stopPropagation(); // Запобігаємо відкриттю прев'ю
    setEditingId(builder.id);
    setFormData({
      name: builder.name || "",
      instructions: builder.instructions || "",
      instruction_image_url: builder.instruction_image_url || null,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({ name: "", instructions: "", instruction_image_url: null });
    setEditingId(null);
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Завантаження фото...");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("builder_instruction")
        .upload(fileName, file);

      if (uploadError) throw new Error(uploadError.message);

      const { data: publicUrlData } = supabase.storage
        .from("builder_instruction")
        .getPublicUrl(fileName);

      setFormData((prev) => ({
        ...prev,
        instruction_image_url: publicUrlData.publicUrl,
      }));

      toast.success("Фото успішно завантажено!", { id: toastId });
    } catch (error) {
      console.error("Помилка завантаження фото:", error);
      toast.error(`Помилка: ${error.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, instruction_image_url: null }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Назва білдера є обов'язковою.");
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        instructions: formData.instructions.trim() || null,
        instruction_image_url: formData.instruction_image_url,
      };

      if (editingId) {
        const { error } = await supabase
          .from("builders")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
        toast.success("Білдера успішно оновлено!");
      } else {
        const { error } = await supabase.from("builders").insert([payload]);
        if (error) throw error;
        toast.success("Нового білдера додано!");
      }

      closeModal();
      fetchBuilders();
    } catch (error) {
      console.error("Помилка збереження білдера:", error);
      toast.error("Не вдалося зберегти білдера.");
    }
  };

  const handleDelete = async (e, id, name) => {
    e.stopPropagation(); // Запобігаємо відкриттю прев'ю
    if (!window.confirm(`Ви впевнені, що хочете видалити білдера "${name}"?`))
      return;

    try {
      const { error } = await supabase.from("builders").delete().eq("id", id);
      if (error) throw error;
      toast.success("Білдера видалено!");
      fetchBuilders();
    } catch (error) {
      console.error("Помилка видалення:", error);
      toast.error(
        "Помилка видалення. Можливо, до цього білдера вже прив'язані об'єкти.",
      );
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.pageTitle}>Білдери</h1>
        <button
          onClick={openAddModal}
          className={`${commonStyles.buttonPrimary} ${styles.addBtn}`}
        >
          <FaPlus /> <span className={styles.addBtnText}>Додати</span>
        </button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div style={{ padding: "20px" }}>
            <SkeletonLoader count={5} />
          </div>
        ) : builders.length > 0 ? (
          <div className={styles.listContainer}>
            {builders.map((builder) => (
              <div
                key={builder.id}
                className={styles.listItem}
                onClick={() => setPreviewBuilder(builder)} // Відкриваємо прев'ю по кліку на рядок
              >
                <div className={styles.itemMain}>
                  <div className={styles.builderNameRow}>
                    <FaBuilding className={styles.builderIcon} />
                    <span className={styles.builderName}>{builder.name}</span>
                  </div>

                  {builder.instructions || builder.instruction_image_url ? (
                    <span
                      className={`${styles.statusBadge} ${styles.hasInstructions}`}
                    >
                      Є інструкції
                    </span>
                  ) : (
                    <span
                      className={`${styles.statusBadge} ${styles.noInstructions}`}
                    >
                      Немає
                    </span>
                  )}
                </div>

                <div className={styles.actionsCell}>
                  <button
                    onClick={(e) => openEditModal(e, builder)}
                    className={`${styles.actionBtn} ${styles.editBtn}`}
                    title="Редагувати"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, builder.id, builder.name)}
                    className={`${styles.actionBtn} ${styles.deleteBtn}`}
                    title="Видалити"
                  >
                    <FaTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState message="Білдерів ще не додано." />
        )}
      </div>

      {/* МОДАЛКА РЕДАГУВАННЯ / ДОДАВАННЯ */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingId ? "Редагувати білдера" : "Новий білдер"}</h2>
              <button onClick={closeModal} className={styles.closeButton}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <div className={styles.inputWrapper}>
                  <label>Назва білдера *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Наприклад: Pacesetter Homes"
                    className={styles.inputField}
                  />
                </div>

                <div className={styles.inputWrapper}>
                  <label>
                    <FaBuilding
                      style={{
                        color: "var(--color-primary)",
                        marginRight: "6px",
                      }}
                    />
                    Текстові інструкції (опціонально)
                  </label>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--color-text-secondary)",
                      marginBottom: "8px",
                    }}
                  >
                    Цей текст автоматично з'являтиметься в мобільному кабінеті
                    працівника для всіх об'єктів цього білдера.
                  </p>
                  <textarea
                    value={formData.instructions}
                    onChange={(e) =>
                      setFormData({ ...formData, instructions: e.target.value })
                    }
                    placeholder="Де брати ключі, куди викидати сміття, правила паркування..."
                    className={styles.textareaField}
                  />
                </div>

                <div className={styles.inputWrapper}>
                  <label>
                    <FaCamera
                      style={{
                        color: "var(--color-primary)",
                        marginRight: "6px",
                      }}
                    />
                    Фото-інструкція (опціонально)
                  </label>
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--color-text-secondary)",
                      marginBottom: "8px",
                    }}
                  >
                    Додайте фото (наприклад, розташування сміттєвого контейнера
                    чи lockbox).
                  </p>

                  <div className={styles.uploadSection}>
                    {formData.instruction_image_url ? (
                      <div className={styles.imagePreviewContainer}>
                        <img
                          src={formData.instruction_image_url}
                          alt="Instruction preview"
                          className={styles.instructionImage}
                          onClick={() =>
                            setLightboxImage(formData.instruction_image_url)
                          }
                        />
                        <button
                          type="button"
                          className={styles.removeImageBtn}
                          onClick={handleRemoveImage}
                          title="Видалити фото"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={styles.uploadButton}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        <FaCamera />{" "}
                        {isUploading ? "Завантаження..." : "Завантажити фото"}
                      </button>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      style={{ display: "none" }}
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={closeModal}
                  className={commonStyles.buttonSecondary}
                  disabled={isUploading}
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  className={commonStyles.buttonPrimary}
                  disabled={isUploading}
                >
                  Зберегти
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* МОДАЛКА ПОПЕРЕДНЬОГО ПЕРЕГЛЯДУ (PREVIEW ДЛЯ АДМІНА) */}
      {previewBuilder && (
        <div
          className={styles.modalOverlay}
          onClick={() => setPreviewBuilder(null)}
        >
          <div
            className={`${styles.modalContent} ${styles.previewContent}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Попередній перегляд (Worker)</h2>
              <button
                onClick={() => setPreviewBuilder(null)}
                className={styles.closeButton}
              >
                <FaTimes />
              </button>
            </div>

            <div className={styles.previewBody}>
              {previewBuilder.instructions ||
              previewBuilder.instruction_image_url ? (
                <div className={styles.previewCard}>
                  <div className={styles.previewTitle}>
                    <FaInfoCircle /> Інструкція від забудовника (
                    {previewBuilder.name})
                  </div>

                  {previewBuilder.instructions && (
                    <div className={styles.previewText}>
                      {previewBuilder.instructions}
                    </div>
                  )}

                  {previewBuilder.instruction_image_url && (
                    <div
                      className={styles.imagePreviewContainer}
                      style={{ marginTop: "10px" }}
                    >
                      <img
                        src={previewBuilder.instruction_image_url}
                        alt="Instruction"
                        className={styles.instructionImage}
                        onClick={() =>
                          setLightboxImage(previewBuilder.instruction_image_url)
                        }
                      />
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState
                  message={`Для білдера "${previewBuilder.name}" немає спеціальних інструкцій.`}
                />
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setPreviewBuilder(null)}
                className={commonStyles.buttonPrimary}
              >
                Зрозуміло
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ЛАЙТБОКС */}
      {lightboxImage && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setLightboxImage(null)}
        >
          <button
            className={styles.lightboxCloseBtn}
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
          >
            <FaTimes />
          </button>
          <img
            src={lightboxImage}
            alt="Full screen"
            className={styles.lightboxImage}
            onClick={(e) => e.stopPropagation()} // Забороняємо закриття при кліку на саме фото
          />
        </div>
      )}
    </div>
  );
};

export default BuildersListPage;
