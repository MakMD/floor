// src/Pages/WorkerPortal.jsx
import { useState, useEffect, useCallback, useMemo } from "react";
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
  FaSearch,
  FaCheckDouble,
  FaCopy,
  FaChevronDown,
  FaChevronUp,
  FaWrench,
  FaInfoCircle,
} from "react-icons/fa";
import { MdOutlineChevronRight } from "react-icons/md";
import styles from "./WorkerPortal.module.css";

const WorkerPortal = () => {
  const { user, role, loading: authLoading } = useAuth();
  const userId = user?.id;

  const [activeTab, setActiveTab] = useState("work");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [myTasks, setMyTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [workFilter, setWorkFilter] = useState("active");

  const [expandedGroups, setExpandedGroups] = useState({
    today: true,
    tomorrow: true,
    upcoming: true,
    past: false,
  });

  const [myTables, setMyTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableInvoices, setTableInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    if (!userId) return;
    try {
      let { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const newProfile = {
          id: userId,
          first_name: "Працівник",
          last_name: "",
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
  }, [userId]);

  useEffect(() => {
    if (userId && role === "worker" && !isInitialized) {
      ensureProfileExists();
    }
  }, [userId, role, isInitialized, ensureProfileExists]);

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [userId]);

  const fetchMyTasks = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: personRecords, error: personError } = await supabase
        .from("people")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (personError) throw personError;

      if (!personRecords || personRecords.length === 0) {
        setMyTasks([]);
        return;
      }

      const workerId = personRecords[0].id;

      const { data: tasks, error: tasksError } = await supabase
        .from("work_types")
        .select(
          `
          id,
          person_id,
          payment_amount,
          notes,
          work_type_templates (name),
          addresses!inner (
            id,
            address,
            date,
            status,
            is_deleted,
            ai_translation,
            work_order_number
          )
        `,
        )
        .eq("person_id", workerId)
        .eq("addresses.is_deleted", false);

      if (tasksError) {
        console.error("Помилка Supabase:", tasksError);
        throw tasksError;
      }

      const formattedTasks = tasks.map((task) => ({
        id: task.id,
        address_id: task.addresses.id,
        address: task.addresses.address,
        date: task.addresses.date,
        work_order_number: task.addresses.work_order_number,
        task_name: task.work_type_templates?.name || "Невідома робота",
        payment_amount: task.payment_amount,
        notes: task.notes,
        ai_translation: task.addresses.ai_translation,
        status: task.status || "Assigned",
      }));

      formattedTasks.sort((a, b) => new Date(a.date) - new Date(b.date));

      setMyTasks(formattedTasks);
    } catch (error) {
      console.error("Помилка завантаження завдань:", error.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchMyTables = useCallback(async () => {
    if (!userId) return;
    setLoadingTables(true);
    try {
      const { data: personRecords, error: personError } = await supabase
        .from("people")
        .select("id")
        .eq("user_id", userId)
        .limit(1);

      if (personError) throw personError;
      if (!personRecords || personRecords.length === 0) {
        setMyTables([]);
        return;
      }

      const workerId = personRecords[0].id;

      const { data, error } = await supabase
        .from("invoice_tables")
        .select(`*, invoices (address, total_income, total)`)
        .eq("person_id", workerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMyTables(data || []);
    } catch (error) {
      console.error("Помилка завантаження папок:", error.message);
    } finally {
      setLoadingTables(false);
    }
  }, [userId]);

  const fetchWorkerDocuments = useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("worker_documents")
        .select("*")
        .eq("worker_id", userId);
      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Помилка завантаження документів:", error.message);
    }
  }, [userId]);

  useEffect(() => {
    if (isInitialized) fetchNotifications();
  }, [isInitialized, fetchNotifications]);

  useEffect(() => {
    if (isInitialized && activeTab === "work") fetchMyTasks();
  }, [activeTab, isInitialized, fetchMyTasks]);

  useEffect(() => {
    if (isInitialized && activeTab === "profile") fetchWorkerDocuments();
  }, [activeTab, isInitialized, fetchWorkerDocuments]);

  useEffect(() => {
    if (isInitialized && activeTab === "invoices" && !selectedTable)
      fetchMyTables();
  }, [activeTab, isInitialized, selectedTable, fetchMyTables]);

  const fetchInvoicesForTable = async (tableId) => {
    setLoadingInvoices(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("invoice_table_id", tableId)
        .order("date", { ascending: true });

      if (error) throw error;
      setTableInvoices(data || []);
    } catch (error) {
      console.error("Помилка завантаження інвойсів:", error.message);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const markNotificationAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
    fetchNotifications();
    toast.success("Всі сповіщення прочитані");
  };

  const handleDocumentUploadComplete = async (urls) => {
    if (!urls || urls.length === 0) return;
    try {
      setLoading(true);
      const newDocs = urls.map((url) => ({ worker_id: userId, file_url: url }));
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

  const handleCopyAddress = (address) => {
    if (!address) return;
    navigator.clipboard
      .writeText(address)
      .then(() => toast.success("Адресу скопійовано!"))
      .catch(() => toast.error("Помилка копіювання адреси"));
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setLoading(true);
    try {
      const finalNotes = `[Завдання: ${selectedTask.task_name}]\n[Статус від працівника: ${formData.workerStatus}]\n${formData.notes ? formData.notes : "Без додаткових коментарів."}`;

      const { error: reportError } = await supabase
        .from("daily_reports")
        .insert([
          {
            worker_id: userId,
            address_id: selectedTask.address_id,
            work_type_id: selectedTask.id,
            notes: finalNotes,
            photos_before: formData.photosBefore,
            photos_after: formData.photosAfter,
            report_date: new Date().toISOString(),
          },
        ]);

      if (reportError) throw reportError;

      toast.success("Звіт успішно надіслано на перевірку!");
      setSelectedTask(null);
      setFormData({
        workerStatus: "Ready",
        notes: "",
        photosBefore: [],
        photosAfter: [],
      });
      fetchMyTasks();
    } catch (error) {
      toast.error("Помилка відправки: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --- ОЧИЩЕНА ФУНКЦІЯ: Тільки інструкція до конкретної роботи ---
  const extractRelevantInstruction = (fullText, taskName) => {
    if (!fullText) return null;

    // Прибираємо секцію з примітками менеджера, якщо вона є в кінці
    let textToParse = fullText;
    const managerNoteToken = "⚠️ Примітки від менеджера:";
    if (fullText.includes(managerNoteToken)) {
      const idx = fullText.indexOf(managerNoteToken);
      textToParse = fullText.substring(0, idx);
    }

    // Розбиваємо текст на блоки по "📍 Зона:"
    const blocks = textToParse.split("📍 Зона:").filter(Boolean);

    // Шукаємо блок, який містить ім'я нашого завдання
    for (const block of blocks) {
      const cleanBlock = ("📍 Зона:" + block).trim();
      if (cleanBlock.toLowerCase().includes(taskName.toLowerCase())) {
        return cleanBlock; // Повертаємо виключно інструкцію до цієї роботи
      }
    }

    // Якщо точного збігу за назвою не знайдено, повертаємо весь текст (як fallback)
    return textToParse.trim();
  };

  const getPageTitle = () => {
    switch (activeTab) {
      case "work":
        return selectedTask ? "Деталі завдання" : "Мої завдання";
      case "profile":
        return "Мій профіль";
      case "invoices":
        return selectedTable ? selectedTable.name : "Папки виплат";
      case "notifications":
        return "Сповіщення";
      default:
        return "Flooring Boss";
    }
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const filteredTasks = myTasks.filter((t) => {
    const matchesSearch =
      (t.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.task_name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab =
      workFilter === "active" ? t.status !== "Ready" : t.status === "Ready";
    return matchesSearch && matchesTab;
  });

  const groupedActiveTasks = useMemo(() => {
    const todayList = [];
    const tomorrowList = [];
    const upcomingList = [];
    const pastList = [];

    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

    filteredTasks.forEach((task) => {
      if (!task.date) {
        upcomingList.push(task);
        return;
      }

      if (task.date === todayStr) {
        todayList.push(task);
      } else if (task.date === tomorrowStr) {
        tomorrowList.push(task);
      } else if (task.date > todayStr) {
        upcomingList.push(task);
      } else {
        pastList.push(task);
      }
    });

    return {
      today: todayList,
      tomorrow: tomorrowList,
      upcoming: upcomingList,
      past: pastList,
    };
  }, [filteredTasks]);

  const activeCount = myTasks.filter((t) => t.status !== "Ready").length;
  const completedCount = myTasks.filter((t) => t.status === "Ready").length;

  const folderTotal = tableInvoices.reduce((sum, inv) => {
    const val = parseFloat(inv.total_income || inv.total || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  const renderTaskCard = (task) => (
    <div
      key={task.id}
      className={styles.projectCard}
      onClick={() => setSelectedTask(task)}
    >
      <div
        className={styles.cardTitle}
        style={{
          color: "var(--color-primary)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <FaWrench /> Завдання: {task.task_name}
      </div>
      <div className={styles.cardAddress} style={{ marginTop: "4px" }}>
        <FaMapMarkerAlt className={styles.pinIcon} />
        <span>{task.address}</span>
      </div>

      <div
        style={{
          fontSize: "0.85rem",
          color: "#666",
          marginBottom: "8px",
          marginTop: "4px",
        }}
      >
        📅 Дата об'єкта: {task.date || "Не вказано"}
      </div>

      <div className={styles.cardBottomRow}>
        <span
          className={`${styles.statusBadge} ${styles[task.status?.replace(/\s+/g, "")] || ""}`}
        >
          {task.status}
        </span>
      </div>
      <MdOutlineChevronRight className={styles.chevronIcon} />
    </div>
  );

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
        <div className={styles.topHeader}>
          <h1 className={styles.pageTitle}>{getPageTitle()}</h1>
        </div>

        <div className={styles.contentArea}>
          {activeTab === "work" && (
            <div className={styles.workTab}>
              {!selectedTask ? (
                <>
                  <div className={styles.topControls}>
                    <div className={styles.searchContainer}>
                      <FaSearch className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Пошук за адресою або назвою роботи..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                      />
                    </div>
                    <div className={styles.filterTabs}>
                      <button
                        className={`${styles.filterTab} ${workFilter === "active" ? styles.activeFilterTab : ""}`}
                        onClick={() => setWorkFilter("active")}
                      >
                        В роботі ({activeCount})
                      </button>
                      <button
                        className={`${styles.filterTab} ${workFilter === "completed" ? styles.activeFilterTab : ""}`}
                        onClick={() => setWorkFilter("completed")}
                      >
                        Завершені ({completedCount})
                      </button>
                    </div>
                  </div>

                  {loading ? (
                    <p className={styles.infoText}>Завантаження...</p>
                  ) : filteredTasks.length === 0 ? (
                    <p className={styles.infoText}>
                      Немає завдань у цій категорії.
                    </p>
                  ) : (
                    <div className={styles.projectList}>
                      {workFilter === "active" ? (
                        <>
                          {groupedActiveTasks.today.length > 0 && (
                            <div className={styles.dateGroup}>
                              <div
                                className={`${styles.dateGroupHeader} ${styles.todayHeader}`}
                                onClick={() => toggleGroup("today")}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  🔥 Сьогодні ({groupedActiveTasks.today.length}
                                  )
                                </span>
                                {expandedGroups.today ? (
                                  <FaChevronUp size={14} />
                                ) : (
                                  <FaChevronDown size={14} />
                                )}
                              </div>
                              {expandedGroups.today && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    marginTop: "10px",
                                  }}
                                >
                                  {groupedActiveTasks.today.map((task) =>
                                    renderTaskCard(task),
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {groupedActiveTasks.tomorrow.length > 0 && (
                            <div className={styles.dateGroup}>
                              <div
                                className={`${styles.dateGroupHeader} ${styles.tomorrowHeader}`}
                                onClick={() => toggleGroup("tomorrow")}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  📅 Завтра (
                                  {groupedActiveTasks.tomorrow.length})
                                </span>
                                {expandedGroups.tomorrow ? (
                                  <FaChevronUp size={14} />
                                ) : (
                                  <FaChevronDown size={14} />
                                )}
                              </div>
                              {expandedGroups.tomorrow && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    marginTop: "10px",
                                  }}
                                >
                                  {groupedActiveTasks.tomorrow.map((task) =>
                                    renderTaskCard(task),
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {groupedActiveTasks.upcoming.length > 0 && (
                            <div className={styles.dateGroup}>
                              <div
                                className={styles.dateGroupHeader}
                                onClick={() => toggleGroup("upcoming")}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  ⏳ Найближчі (
                                  {groupedActiveTasks.upcoming.length})
                                </span>
                                {expandedGroups.upcoming ? (
                                  <FaChevronUp size={14} />
                                ) : (
                                  <FaChevronDown size={14} />
                                )}
                              </div>
                              {expandedGroups.upcoming && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    marginTop: "10px",
                                  }}
                                >
                                  {groupedActiveTasks.upcoming.map((task) =>
                                    renderTaskCard(task),
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {groupedActiveTasks.past.length > 0 && (
                            <div className={styles.dateGroup}>
                              <div
                                className={`${styles.dateGroupHeader} ${styles.pastHeader}`}
                                onClick={() => toggleGroup("past")}
                                style={{
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <span>
                                  ⚠️ Протерміновані / Минулі (
                                  {groupedActiveTasks.past.length})
                                </span>
                                {expandedGroups.past ? (
                                  <FaChevronUp size={14} />
                                ) : (
                                  <FaChevronDown size={14} />
                                )}
                              </div>
                              {expandedGroups.past && (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: "10px",
                                    marginTop: "10px",
                                  }}
                                >
                                  {groupedActiveTasks.past.map((task) =>
                                    renderTaskCard(task),
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        filteredTasks.map((task) => renderTaskCard(task))
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.projectDetail}>
                  <button
                    onClick={() => setSelectedTask(null)}
                    className={styles.backButton}
                  >
                    <FaArrowLeft /> Назад до списку
                  </button>

                  <div className={styles.detailHeader}>
                    <div className={styles.titleRow}>
                      <h2 className={styles.detailTitle}>
                        {selectedTask.address}
                      </h2>
                      <button
                        type="button"
                        className={styles.copyButton}
                        onClick={() => handleCopyAddress(selectedTask.address)}
                        title="Скопіювати адресу"
                      >
                        <FaCopy />
                      </button>
                    </div>
                  </div>

                  {selectedTask.ai_translation && (
                    <div
                      className={styles.instructionBlock}
                      style={{
                        backgroundColor: "#fef3c7",
                        borderColor: "#fde68a",
                      }}
                    >
                      <div
                        className={styles.instructionHeader}
                        style={{ color: "#d97706" }}
                      >
                        <FaInfoCircle className={styles.instructionIcon} />
                        <h3>Інструкція до завдання:</h3>
                      </div>
                      <div
                        style={{
                          padding: "10px",
                          backgroundColor: "#fff",
                          borderRadius: "8px",
                          border: "1px solid #fde68a",
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {extractRelevantInstruction(
                          selectedTask.ai_translation,
                          selectedTask.task_name,
                        )}
                      </div>
                    </div>
                  )}

                  <div className={styles.instructionBlock}>
                    <div className={styles.instructionHeader}>
                      <FaWrench className={styles.instructionIcon} />
                      <h3>Ваше завдання:</h3>
                    </div>
                    <div
                      style={{
                        padding: "10px",
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          fontSize: "1.1rem",
                          color: "var(--color-primary)",
                        }}
                      >
                        {selectedTask.task_name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.95rem",
                          color: "#555",
                          marginTop: "8px",
                        }}
                      >
                        Оплата за це завдання: $
                        {parseFloat(selectedTask.payment_amount || 0).toFixed(
                          2,
                        )}
                      </div>
                      {selectedTask.notes && (
                        <div
                          style={{
                            marginTop: "12px",
                            padding: "10px",
                            backgroundColor: "rgba(176, 42, 72, 0.05)",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            color: "#444",
                          }}
                        >
                          <strong>📝 Примітка до завдання:</strong>{" "}
                          {selectedTask.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <form
                    onSubmit={handleWorkSubmit}
                    className={styles.reportForm}
                  >
                    <div className={styles.formGroup}>
                      <label className={styles.sectionLabel}>
                        Статус цього завдання
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
                        <option value="Ready">Ready (Готово повністю)</option>
                        <option value="In Process">
                          In Process (В процесі виконання)
                        </option>
                        <option value="Not Finished">
                          Not Finished (Не завершено)
                        </option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.sectionLabel}>
                        Нотатки до звіту (опціонально)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        placeholder="Опишіть виконану роботу або проблеми..."
                        className={styles.textarea}
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
                        label="Фото ПІСЛЯ (рекомендується)"
                        bucketName="worker-photos"
                        onUploadComplete={(urls) =>
                          setFormData({ ...formData, photosAfter: urls })
                        }
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className={styles.submitReportBtn}
                    >
                      {loading ? "Відправка..." : "Зберегти звіт"}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {activeTab === "profile" && (
            <div className={styles.profileTab}>
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
            <div className={styles.invoicesTab}>
              {!selectedTable ? (
                <>
                  {loadingTables ? (
                    <p className={styles.infoText}>Завантаження папок...</p>
                  ) : myTables.length === 0 ? (
                    <div className={styles.placeholderTab}>
                      <FaFileInvoiceDollar
                        size={40}
                        className={styles.placeholderIcon}
                      />
                      <p>У вас поки немає папок з виплатами.</p>
                    </div>
                  ) : (
                    <div className={styles.projectList}>
                      {myTables.map((table) => {
                        const invoicesList = table.invoices || [];
                        const invCount = invoicesList.length;
                        const previewAddresses = invoicesList
                          .slice(0, 2)
                          .map((i) => i.address)
                          .filter(Boolean);
                        const remainingCount = invCount > 2 ? invCount - 2 : 0;
                        const totalSum = invoicesList.reduce(
                          (sum, inv) =>
                            sum +
                            parseFloat(inv.total_income || inv.total || 0),
                          0,
                        );

                        return (
                          <div
                            key={table.id}
                            className={styles.folderCard}
                            onClick={() => {
                              setSelectedTable(table);
                              fetchInvoicesForTable(table.id);
                            }}
                          >
                            <div className={styles.folderContent}>
                              <div className={styles.folderTitleRow}>
                                <span className={styles.folderIcon}>📅</span>
                                <span className={styles.folderName}>
                                  {table.name}
                                </span>
                              </div>
                              {invCount > 0 ? (
                                <div className={styles.folderAddressesPreview}>
                                  <ul className={styles.previewList}>
                                    {previewAddresses.map((addr, idx) => (
                                      <li key={idx}>
                                        <FaMapMarkerAlt
                                          className={styles.pinIconSmall}
                                        />{" "}
                                        {addr}
                                      </li>
                                    ))}
                                  </ul>
                                  {remainingCount > 0 && (
                                    <div className={styles.moreAddresses}>
                                      + ще {remainingCount} об'єкт
                                      {remainingCount === 1 ? "" : "ів"}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className={styles.noAddressesText}>
                                  Немає об'єктів
                                </div>
                              )}
                              <div className={styles.folderTotalPreview}>
                                <div className={styles.statBox}>
                                  <span className={styles.statLabel}>
                                    Об'єкти:
                                  </span>
                                  <span className={styles.statValue}>
                                    {invCount}
                                  </span>
                                </div>
                                <div className={styles.statBox}>
                                  <span className={styles.statLabel}>
                                    Сума:
                                  </span>
                                  <span className={styles.statValueSum}>
                                    ${totalSum.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <MdOutlineChevronRight
                              className={styles.chevronIcon}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.invoicesContainer}>
                  <button
                    onClick={() => setSelectedTable(null)}
                    className={styles.backButton}
                  >
                    <FaArrowLeft /> Назад до папок
                  </button>

                  <div className={styles.detailHeader}>
                    <h2 className={styles.detailTitle}>{selectedTable.name}</h2>
                    <p className={styles.detailSubtitle}>
                      Деталізація ваших виплат
                    </p>
                  </div>

                  {loadingInvoices ? (
                    <p className={styles.infoText}>Завантаження об'єктів...</p>
                  ) : tableInvoices.length === 0 ? (
                    <p className={styles.infoText}>Ця папка наразі порожня.</p>
                  ) : (
                    <div className={styles.invoiceList}>
                      {tableInvoices.map((inv) => (
                        <div key={inv.id} className={styles.invoiceCard}>
                          <div className={styles.invoiceMainRow}>
                            <span className={styles.invoiceAddress}>
                              {inv.address || "Адреса не вказана"}
                            </span>
                            <span className={styles.invoiceAmount}>
                              $
                              {parseFloat(
                                inv.total_income || inv.total || 0,
                              ).toFixed(2)}
                            </span>
                          </div>

                          <div className={styles.invoiceSubRow}>
                            {inv.date && (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <FaCalendarAlt style={{ opacity: 0.6 }} />{" "}
                                {inv.date}
                              </span>
                            )}
                            {inv["sf/stairs"] && inv.price && (
                              <span className={styles.invoiceDetailBadge}>
                                {inv["sf/stairs"]} × $
                                {parseFloat(inv.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}

                      <div className={styles.folderTotalCard}>
                        <span className={styles.folderTotalLabel}>
                          Всього за період:
                        </span>
                        <span className={styles.folderTotalAmount}>
                          ${folderTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className={styles.notificationsTab}>
              <div className={styles.notifHeaderWrapper}>
                <h2 style={{ margin: 0 }}>Сповіщення</h2>
                {notifications.length > 0 && (
                  <button onClick={markAllAsRead} className={styles.markAllBtn}>
                    <FaCheckDouble /> Прочитати все
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className={styles.placeholderTab}>
                  <FaBell size={40} className={styles.placeholderIcon} />
                  <p>Немає нових повідомлень.</p>
                </div>
              ) : (
                <div className={styles.notifList}>
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`${styles.notifCard} ${!n.is_read ? styles.notifUnread : ""}`}
                      onClick={() => {
                        if (!n.is_read) markNotificationAsRead(n.id);
                      }}
                    >
                      <div className={styles.notifTitleRow}>
                        <span className={styles.notifTitle}>{n.title}</span>
                        {!n.is_read && (
                          <span className={styles.unreadDot}></span>
                        )}
                      </div>
                      <p className={styles.notifMessage}>{n.message}</p>
                      <span className={styles.notifDate}>
                        {new Date(n.created_at).toLocaleString("uk-UA", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.bottomNav}>
          <button
            className={`${styles.navItem} ${activeTab === "work" ? styles.activeNav : ""}`}
            onClick={() => {
              setActiveTab("work");
              setSelectedTask(null);
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
            onClick={() => {
              setActiveTab("invoices");
              setSelectedTable(null);
            }}
          >
            <FaFileInvoiceDollar size={20} />
            <span>Виплати</span>
          </button>
          <button
            className={`${styles.navItem} ${activeTab === "notifications" ? styles.activeNav : ""}`}
            onClick={() => setActiveTab("notifications")}
            style={{ position: "relative" }}
          >
            <FaBell size={20} />
            <span>Сповіщення</span>
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkerPortal;
