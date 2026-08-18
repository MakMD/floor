// src/Pages/WorkerPortal.jsx
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";
import PhotoUploader from "../components/PhotoUploader/PhotoUploader";
import {
  FaClipboardList,
  FaUser,
  FaFileInvoiceDollar,
  FaUpload,
  FaFileAlt,
} from "react-icons/fa";
import styles from "./WorkerPortal.module.css";

const WorkerPortal = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("work");
  const [loading, setLoading] = useState(false);

  // Поля для звіту про роботу
  const [workData, setWorkData] = useState({
    workOrderId: "",
    squareFeet: "",
    notes: "",
    photosBefore: [],
    photosAfter: [],
  });

  // Поля для документів
  const [docTitle, setDocTitle] = useState("");
  const [docUrl, setDocUrl] = useState("");
  const [myDocuments, setMyDocuments] = useState([]);

  // Завантаження списку документів працівника
  useEffect(() => {
    if (user && activeTab === "profile") {
      fetchDocuments();
    }
  }, [user, activeTab]);

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from("worker_documents")
      .select("*")
      .eq("worker_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) {
      setMyDocuments(data || []);
    }
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    if (!workData.workOrderId) {
      toast.error("Вкажіть адресу або ID об'єкта");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("daily_reports").insert([
        {
          worker_id: user.id,
          work_order_id: workData.workOrderId,
          square_feet: workData.squareFeet
            ? parseFloat(workData.squareFeet)
            : 0,
          notes: workData.notes,
          photos_before: workData.photosBefore,
          photos_after: workData.photosAfter,
        },
      ]);

      if (error) throw error;
      toast.success("Звіт успішно надіслано!");
      setWorkData({
        workOrderId: "",
        squareFeet: "",
        notes: "",
        photosBefore: [],
        photosAfter: [],
      });
    } catch (error) {
      console.error("Error submitting report:", error.message);
      toast.error("Помилка відправки звіту");
    } finally {
      setLoading(false);
    }
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    if (!docTitle || !docUrl) {
      toast.error("Введіть назву документа та завантажте файл");
      return;
    }

    setLoading(true);
    try {
      // 1. Додаємо документ у таблицю worker_documents
      const { error: docError } = await supabase
        .from("worker_documents")
        .insert([
          {
            worker_id: user.id,
            title: docTitle,
            file_url: docUrl,
            status: "pending",
          },
        ]);
      if (docError) throw docError;

      // 2. Створюємо сповіщення для адміна
      const { error: notifError } = await supabase
        .from("notifications")
        .insert([
          {
            worker_id: user.id,
            title: "Новий документ",
            message: `Працівник завантажив новий документ: "${docTitle}"`,
            is_read: false,
          },
        ]);
      if (notifError) throw notifError;

      toast.success("Документ успішно надіслано адміністратору!");
      setDocTitle("");
      setDocUrl("");
      fetchDocuments();
    } catch (error) {
      console.error("Error uploading document:", error.message);
      toast.error("Помилка завантаження документа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Вкладка: Робота */}
      {activeTab === "work" && (
        <div className={styles.card}>
          <h2 className={styles.title}>Новий звіт про роботу</h2>
          <form onSubmit={handleWorkSubmit} className={styles.form}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Адреса / ID об'єкта</label>
              <input
                type="text"
                value={workData.workOrderId}
                onChange={(e) =>
                  setWorkData({ ...workData, workOrderId: e.target.value })
                }
                placeholder="Наприклад: 123 Main St"
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Площа (Square Feet)</label>
              <input
                type="number"
                step="0.01"
                value={workData.squareFeet}
                onChange={(e) =>
                  setWorkData({ ...workData, squareFeet: e.target.value })
                }
                placeholder="0.00"
                className={styles.input}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Нотатки</label>
              <textarea
                value={workData.notes}
                onChange={(e) =>
                  setWorkData({ ...workData, notes: e.target.value })
                }
                placeholder="Коментар до роботи..."
                rows="3"
                className={styles.textarea}
              />
            </div>

            <PhotoUploader
              label="Фото ДО роботи"
              onUploadComplete={(urls) =>
                setWorkData({ ...workData, photosBefore: urls })
              }
            />

            <PhotoUploader
              label="Фото ПІСЛЯ роботи"
              onUploadComplete={(urls) =>
                setWorkData({ ...workData, photosAfter: urls })
              }
            />

            <button
              type="submit"
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Відправка..." : "Надіслати звіт"}
            </button>
          </form>
        </div>
      )}

      {/* Вкладка: Особисті дані та документи */}
      {activeTab === "profile" && (
        <div className={styles.card}>
          <h2 className={styles.title}>Особисті документи</h2>
          <p className={styles.description} style={{ marginBottom: "20px" }}>
            Завантажте необхідні документи (WCB, страховка тощо) для перевірки
            адміністратором.
          </p>

          <form
            onSubmit={handleDocSubmit}
            className={styles.form}
            style={{ marginBottom: "30px" }}
          >
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Назва документа</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Наприклад: WCB Clearance 2026"
                className={styles.input}
              />
            </div>

            {/* Використовуємо PhotoUploader, але можна завантажувати і документи (зображення/скани) */}
            <PhotoUploader
              label="Файл документа (фото / сканування)"
              onUploadComplete={(urls) => setDocUrl(urls[0] || "")}
            />

            <button
              type="submit"
              disabled={loading || !docUrl}
              className={styles.submitButton}
            >
              {loading ? "Збереження..." : "Надіслати документ адміну"}
            </button>
          </form>

          <h3
            style={{
              fontSize: "1.1rem",
              marginBottom: "12px",
              color: "var(--color-text-primary)",
            }}
          >
            Мої завантажені документи
          </h3>
          {myDocuments.length === 0 ? (
            <p className={styles.description}>
              Ще немає завантажених документів.
            </p>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              {myDocuments.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 14px",
                    backgroundColor: "var(--color-background)",
                    borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <FaFileAlt color="var(--color-primary)" />
                    <div>
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "0.95rem",
                          color: "var(--color-text-primary)",
                        }}
                      >
                        {doc.title}
                      </div>
                      <div
                        style={{
                          fontSize: "0.8rem",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Статус: {doc.status}
                      </div>
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "var(--color-primary)",
                      fontSize: "0.9rem",
                      fontWeight: "500",
                      textDecoration: "none",
                    }}
                  >
                    Переглянути
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Вкладка: Інвойси */}
      {activeTab === "invoices" && (
        <div className={styles.card}>
          <h2 className={styles.title}>Мої Інвойси</h2>
          <p className={styles.description}>
            Історія нарахувань затверджених годин та площі.
          </p>
        </div>
      )}

      {/* Нижня панель навігації */}
      <div className={styles.bottomBar}>
        <button
          onClick={() => setActiveTab("work")}
          className={`${styles.navButton} ${activeTab === "work" ? styles.navButtonActive : ""}`}
        >
          <FaClipboardList size={20} />
          <span>Робота</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`${styles.navButton} ${activeTab === "profile" ? styles.navButtonActive : ""}`}
        >
          <FaUser size={20} />
          <span>Профіль</span>
        </button>

        <button
          onClick={() => setActiveTab("invoices")}
          className={`${styles.navButton} ${activeTab === "invoices" ? styles.navButtonActive : ""}`}
        >
          <FaFileInvoiceDollar size={20} />
          <span>Інвойси</span>
        </button>
      </div>
    </div>
  );
};

export default WorkerPortal;
