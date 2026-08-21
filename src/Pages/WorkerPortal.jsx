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
  FaSearch,
  FaCheckDouble,
} from "react-icons/fa";
import { MdOutlineChevronRight } from "react-icons/md";
import styles from "./WorkerPortal.module.css";

const WorkerPortal = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("work");
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [myProjects, setMyProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [workFilter, setWorkFilter] = useState("active");

  const [myTables, setMyTables] = useState([]);
  const [loadingTables, setLoadingTables] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableInvoices, setTableInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Стейт для сповіщень
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

  // Завантаження сповіщень
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  }, [user]);

  useEffect(() => {
    if (isInitialized) {
      fetchNotifications();
      if (activeTab === "work") fetchMyProjects();
      if (activeTab === "profile") fetchWorkerDocuments();
      if (activeTab === "invoices" && !selectedTable) fetchMyTables();
    }
  }, [activeTab, isInitialized, selectedTable, fetchNotifications]);

  const markNotificationAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);
    fetchNotifications();
    toast.success("Всі сповіщення прочитані");
  };

  const fetchMyProjects = async () => {
    if (!user) return;
    setLoading(true);
    try {
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

  const fetchMyTables = async () => {
    if (!user) return;
    setLoadingTables(true);
    try {
      const { data: personRecords, error: personError } = await supabase
        .from("people")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (personError) throw personError;
      if (!personRecords || personRecords.length === 0) {
        setMyTables([]);
        setLoadingTables(false);
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
      toast.error("Не вдалося завантажити папки виплат.");
    } finally {
      setLoadingTables(false);
    }
  };

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
      toast.error("Не вдалося завантажити інвойси.");
    } finally {
      setLoadingInvoices(false);
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

  const getPageTitle = () => {
    switch (activeTab) {
      case "work":
        return selectedProject ? "Деталі об'єкта" : "Мої об'єкти";
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

  const filteredProjects = myProjects.filter((p) => {
    const matchesSearch =
      (p.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.work_order_number || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesTab =
      workFilter === "active" ? p.status !== "Ready" : p.status === "Ready";
    return matchesSearch && matchesTab;
  });

  const activeCount = myProjects.filter((p) => p.status !== "Ready").length;
  const completedCount = myProjects.filter((p) => p.status === "Ready").length;

  const folderTotal = tableInvoices.reduce((sum, inv) => {
    const val = parseFloat(inv.total_income || inv.total || 0);
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

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
              {!selectedProject ? (
                <>
                  <div className={styles.topControls}>
                    <div className={styles.searchContainer}>
                      <FaSearch className={styles.searchIcon} />
                      <input
                        type="text"
                        placeholder="Пошук за адресою або WO..."
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
                  ) : filteredProjects.length === 0 ? (
                    <p className={styles.infoText}>
                      Немає об'єктів у цій категорії.
                    </p>
                  ) : (
                    <div className={styles.projectList}>
                      {filteredProjects.map((proj) => (
                        <div
                          key={proj.id}
                          className={styles.projectCard}
                          onClick={() => setSelectedProject(proj)}
                        >
                          <div className={styles.cardTitle}>
                            WO #{proj.work_order_number || "N/A"} -{" "}
                            {proj.builders?.name || "Unknown Builder"}
                          </div>
                          <div className={styles.cardAddress}>
                            <FaMapMarkerAlt className={styles.pinIcon} />
                            <span>{proj.address}</span>
                          </div>
                          <div className={styles.cardBottomRow}>
                            <span
                              className={`${styles.statusBadge} ${styles[proj.status?.replace(/\s+/g, "")] || ""}`}
                            >
                              {proj.status || "Assigned"}
                            </span>
                          </div>
                          <MdOutlineChevronRight
                            className={styles.chevronIcon}
                          />
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
                        const invCount = table.invoices?.length || 0;
                        const addressesText =
                          table.invoices
                            ?.map((i) => i.address)
                            .filter(Boolean)
                            .join(" • ") || "Немає об'єктів";
                        const totalSum =
                          table.invoices?.reduce(
                            (sum, inv) =>
                              sum +
                              parseFloat(inv.total_income || inv.total || 0),
                            0,
                          ) || 0;

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
                                <span style={{ fontSize: "1.4rem" }}>📁</span>
                                <span className={styles.folderName}>
                                  {table.name}
                                </span>
                              </div>
                              <div className={styles.folderAddresses}>
                                <FaMapMarkerAlt
                                  style={{
                                    color: "#b02a48",
                                    display: "inline",
                                    marginRight: "4px",
                                  }}
                                />
                                {addressesText}
                              </div>
                              <div className={styles.folderTotalPreview}>
                                Об'єктів: {invCount} &nbsp;|&nbsp; Всього: $
                                {totalSum.toFixed(2)}
                              </div>
                            </div>
                            <MdOutlineChevronRight
                              className={styles.chevronIcon}
                              style={{ position: "static", transform: "none" }}
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

                          {inv.GSTCollected || inv.totalWithGst ? (
                            <div className={styles.invoiceGstRow}>
                              <span>
                                GST: $
                                {parseFloat(inv.GSTCollected || 0).toFixed(2)}
                              </span>
                              <span style={{ fontWeight: 600 }}>
                                Total + GST: $
                                {parseFloat(inv.totalWithGst || 0).toFixed(2)}
                              </span>
                            </div>
                          ) : null}
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
