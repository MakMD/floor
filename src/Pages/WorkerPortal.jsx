import { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import toast from "react-hot-toast";
import PhotoUploader from "../components/PhotoUploader/PhotoUploader";
import {
  FaClipboardList,
  FaUser,
  FaFileInvoiceDollar,
  FaBell,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTools,
} from "react-icons/fa";
import styles from "./WorkerPortal.module.css";

const WorkerPortal = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("work");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [myProjects, setMyProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  // Додано поле workerStatus у форму звіту
  const [formData, setFormData] = useState({
    workerStatus: "Ready",
    notes: "",
    photosBefore: [],
    photosAfter: [],
  });

  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    status: "pending",
  });

  const [documents, setDocuments] = useState([]);

  const ensureProfileExists = useCallback(async () => {
    if (!user) return;
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const newProfile = {
          id: user.id,
          first_name: user.user_metadata?.first_name || "Працівник",
          last_name: user.user_metadata?.last_name || "",
          role: "worker",
        };
        const { error: insertError } = await supabase
          .from("profiles")
          .insert([newProfile]);
        if (insertError) throw insertError;
        data = newProfile;
      }
      setProfile(data);
    } catch (error) {
      console.error("Помилка ініціалізації профілю:", error.message);
      toast.error("Не вдалося завантажити дані профілю.");
    } finally {
      setIsInitialized(true);
    }
  }, [user]);

  useEffect(() => {
    if (user && role === "worker" && !isInitialized) {
      ensureProfileExists();
    }
  }, [user, role, isInitialized, ensureProfileExists]);

  useEffect(() => {
    if (isInitialized) {
      if (activeTab === "work") fetchMyProjects();
      if (activeTab === "profile") fetchWorkerDocuments();
    }
  }, [activeTab, isInitialized]);

  const fetchMyProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Знаходимо внутрішній ID працівника
      const { data: personRecords, error: personError } = await supabase
        .from("people")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (personError) throw personError;

      if (!personRecords || personRecords.length === 0) {
        setMyProjects([]);
        setLoading(false);
        return;
      }

      const workerId = personRecords[0].id;
      let allAddressIds = [];

      // 2. Збираємо ID об'єктів з таблиці work_types
      const { data: wtData, error: wtError } = await supabase
        .from("work_types")
        .select("address_id")
        .eq("person_id", workerId);

      if (!wtError && wtData) {
        allAddressIds = [
          ...allAddressIds,
          ...wtData.map((wt) => wt.address_id),
        ];
      }

      // 3. Збираємо ID об'єктів з прямих призначень у таблиці addresses
      const { data: addrData, error: addrError } = await supabase
        .from("addresses")
        .select("id")
        .eq("worker_id", workerId);

      if (!addrError && addrData) {
        allAddressIds = [...allAddressIds, ...addrData.map((a) => a.id)];
      }

      const uniqueAddressIds = [...new Set(allAddressIds.filter(Boolean))];

      if (uniqueAddressIds.length === 0) {
        setMyProjects([]);
        setLoading(false);
        return;
      }

      const { data: projects, error: projError } = await supabase
        .from("addresses")
        .select("*, builders(name)")
        .in("id", uniqueAddressIds)
        .order("date", { ascending: true });

      if (projError) throw projError;
      setMyProjects(projects || []);
    } catch (error) {
      console.error("Помилка завантаження об'єктів:", error.message);
      toast.error("Не вдалося завантажити список об'єктів.");
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkerDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from("worker_documents")
        .select("*")
        .eq("worker_id", user.id);
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Помилка завантаження документів:", error.message);
    }
  };

  const handleDocumentUploadComplete = async (urls) => {
    if (!urls || urls.length === 0) return;
    try {
      setLoading(true);
      const newDocs = urls.map((url) => ({
        worker_id: user.id,
        file_url: url,
      }));
      const { error } = await supabase.from("worker_documents").insert(newDocs);
      if (error) throw error;
      toast.success("Документи успішно завантажено!");
      fetchWorkerDocuments();
    } catch (error) {
      toast.error("Помилка збереження: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    setLoading(true);
    try {
      // Додаємо статус обраний працівником у текст нотаток, щоб адмін його бачив
      const finalNotes = `[Статус від працівника: ${formData.workerStatus}]\n${formData.notes ? formData.notes : "Без додаткових коментарів."}`;

      const { error } = await supabase.from("daily_reports").insert([
        {
          worker_id: user.id,
          address_id: selectedProject.id,
          notes: finalNotes,
          photos_before: formData.photosBefore,
          photos_after: formData.photosAfter,
          report_date: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success("Звіт успішно надіслано на перевірку!");
      setSelectedProject(null);
      setFormData({
        workerStatus: "Ready",
        notes: "",
        photosBefore: [],
        photosAfter: [],
      });
    } catch (error) {
      toast.error("Помилка відправки: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !role) {
    return (
      <div className={styles.loadingScreen}>Отримання прав доступу...</div>
    );
  }

  if (role === "admin") {
    return <Navigate to="/addresses" replace />;
  }

  if (!isInitialized) {
    return (
      <div className={styles.loadingScreen}>Завантаження даних кабінету...</div>
    );
  }

  return (
    <div className={styles.portalWrapper}>
      <div className={styles.portalContainer}>
        <div className={styles.contentArea}>
          {activeTab === "work" && (
            <div className={styles.workTab}>
              {!selectedProject ? (
                <>
                  <h2 className={styles.pageTitle}>Мої об'єкти</h2>
                  {loading ? (
                    <p className={styles.infoText}>Завантаження...</p>
                  ) : myProjects.length === 0 ? (
                    <p className={styles.infoText}>
                      Наразі у вас немає призначених об'єктів.
                    </p>
                  ) : (
                    <div className={styles.projectList}>
                      {myProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className={styles.projectCard}
                          onClick={() => setSelectedProject(proj)}
                        >
                          <div className={styles.cardHeader}>
                            <span className={styles.cardNumber}>
                              WO #{proj.work_order_number || "N/A"}
                            </span>
                            <span
                              className={`${styles.statusBadge} ${styles[proj.status?.replace(/\s+/g, "")] || ""}`}
                            >
                              {proj.status || "Assigned"}
                            </span>
                          </div>
                          <div className={styles.cardAddress}>
                            <FaMapMarkerAlt className={styles.iconPin} />
                            <span>{proj.address}</span>
                          </div>
                          <div className={styles.cardFooter}>
                            <span className={styles.builderName}>
                              <FaTools className={styles.iconSmall} />{" "}
                              {proj.builders?.name || "Unknown"}
                            </span>
                            {proj.date && (
                              <span className={styles.dateText}>
                                <FaCalendarAlt className={styles.iconSmall} />{" "}
                                {proj.date}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.projectDetail}>
                  <button
                    onClick={() => setSelectedProject(null)}
                    className={styles.backButton}
                  >
                    <FaArrowLeft /> Назад до списку
                  </button>

                  <div className={styles.detailHeader}>
                    <h2 className={styles.detailTitle}>
                      {selectedProject.address}
                    </h2>
                    <p className={styles.detailSubtitle}>
                      WO #{selectedProject.work_order_number}
                    </p>
                  </div>

                  {/* Форма відправки звіту тепер містить вибір статусу */}
                  <form
                    onSubmit={handleWorkSubmit}
                    className={styles.reportForm}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.sectionLabel}>
                        Ваш статус роботи
                      </label>
                      <select
                        className={styles.statusSelect}
                        value={formData.workerStatus}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            workerStatus: e.target.value,
                          })
                        }
                      >
                        <option value="Ready">Ready (Готово)</option>
                        <option value="In Process">
                          In Process (В процесі)
                        </option>
                        <option value="Not Finished">
                          Not Finished (Не завершено)
                        </option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.sectionLabel}>
                        Нотатки (опціонально)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Опишіть виконану роботу або проблеми..."
                        className={styles.textarea}
                        rows="3"
                      />
                    </div>

                    <div className={styles.photoUploaders}>
                      <PhotoUploader
                        label="Фото ДО (опціонально)"
                        bucketName="worker-photos"
                        onUploadComplete={(urls) =>
                          setFormData({ ...formData, photosBefore: urls })
                        }
                      />
                      <PhotoUploader
                        label="Фото ПІСЛЯ (обов'язково)"
                        bucketName="worker-photos"
                        onUploadComplete={(urls) =>
                          setFormData({ ...formData, photosAfter: urls })
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading || formData.photosAfter.length === 0}
                      className={styles.submitReportBtn}
                    >
                      {loading ? "Відправка..." : "Зберегти звіт та фото"}
                    </button>
                    {formData.photosAfter.length === 0 && (
                      <p className={styles.warningText}>
                        * Додайте хоча б одне фото результату
                      </p>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className={styles.profileTab}>
              <h2 className={styles.pageTitle}>Мій профіль</h2>
              <div className={styles.profileInfo}>
                <p>
                  <strong>Ім'я:</strong> {profile.first_name}{" "}
                  {profile.last_name}
                </p>
                <p>
                  <strong>Статус:</strong>{" "}
                  {profile.status === "approved"
                    ? "Затверджено"
                    : "На перевірці"}
                </p>
              </div>
              <hr className={styles.divider} />
              <h3 className={styles.subTitle}>Мої документи</h3>
              <PhotoUploader
                label="Завантажити документ (ID, Сертифікати)"
                bucketName="worker-documents"
                onUploadComplete={handleDocumentUploadComplete}
              />
              {documents.length > 0 && (
                <ul className={styles.documentList}>
                  {documents.map((doc, index) => (
                    <li key={doc.id || index}>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Переглянути документ #{index + 1}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {activeTab === "invoices" && (
            <div className={styles.placeholderTab}>
              <FaFileInvoiceDollar
                size={40}
                className={styles.placeholderIcon}
              />
              <h2>Виплати</h2>
              <p>Розділ у розробці.</p>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className={styles.placeholderTab}>
              <FaBell size={40} className={styles.placeholderIcon} />
              <h2>Сповіщення</h2>
              <p>Немає нових повідомлень.</p>
            </div>
          )}
        </div>

        <div className={styles.bottomNav}>
          <button
            className={`${styles.navItem} ${activeTab === "work" ? styles.activeNav : ""}`}
            onClick={() => {
              setActiveTab("work");
              setSelectedProject(null);
            }}
          >
            <FaClipboardList size={20} />
            <span>Робота</span>
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "profile" ? styles.activeNav : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <FaUser size={20} />
            <span>Профіль</span>
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "invoices" ? styles.activeNav : ""}`}
            onClick={() => setActiveTab("invoices")}
          >
            <FaFileInvoiceDollar size={20} />
            <span>Виплати</span>
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "notifications" ? styles.activeNav : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <FaBell size={20} />
            <span>Сповіщення</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerPortal;
