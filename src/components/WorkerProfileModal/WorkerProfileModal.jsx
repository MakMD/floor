import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../supabaseClient";
import toast from "react-hot-toast";
import { FaTimes, FaFilePdf, FaFileAlt } from "react-icons/fa";
import styles from "./WorkerProfileModal.module.css";

const WorkerProfileModal = ({ personId, personName, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    has_gst: false,
    has_wcb: false,
    has_holdback: false,
  });
  const [documents, setDocuments] = useState([]);

  // Стан для перегляду фотографій на весь екран
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    // 1. Отримуємо налаштування робітника
    const { data: personData, error: personError } = await supabase
      .from("people")
      .select("user_id, has_gst, has_wcb, has_holdback")
      .eq("id", personId)
      .single();

    if (personError) {
      toast.error("Помилка завантаження профілю.");
      setLoading(false);
      return;
    }

    setSettings({
      has_gst: personData.has_gst || false,
      has_wcb: personData.has_wcb || false,
      has_holdback: personData.has_holdback || false,
    });

    // 2. Отримуємо документи (через user_id)
    if (personData.user_id) {
      const { data: docs } = await supabase
        .from("worker_documents")
        .select("*")
        .eq("worker_id", personData.user_id);
      setDocuments(docs || []);
    }
    setLoading(false);
  }, [personId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSetting = async (field) => {
    const newValue = !settings[field];
    setSettings((prev) => ({ ...prev, [field]: newValue }));

    const { error } = await supabase
      .from("people")
      .update({ [field]: newValue })
      .eq("id", personId);

    if (error) {
      toast.error("Помилка збереження налаштувань.");
      setSettings((prev) => ({ ...prev, [field]: !newValue })); // відкат
    } else {
      toast.success("Налаштування оновлено!");
    }
  };

  const isImage = (url) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) != null;
  };

  const isPdf = (url) => {
    return url.match(/\.(pdf)$/i) != null;
  };

  // Обробник кліку на документ
  const handleDocumentClick = (e, url) => {
    if (isImage(url)) {
      e.preventDefault(); // Забороняємо відкриття в новій вкладці
      setSelectedImage(url); // Відкриваємо наше модальне вікно (Lightbox)
    }
    // Якщо це не фото (наприклад, PDF), дозволяємо браузеру стандартно відкрити файл у новій вкладці
  };

  return (
    <>
      <div className={styles.modalOverlay} onClick={onClose}>
        <div
          className={styles.modalContent}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <h2>{personName} - Profile & Settings</h2>
            <button className={styles.closeButton} onClick={onClose}>
              <FaTimes />
            </button>
          </div>

          <div className={styles.modalBody}>
            {loading ? (
              <p>Завантаження...</p>
            ) : (
              <>
                {/* НАЛАШТУВАННЯ */}
                <div>
                  <h3 className={styles.sectionTitle}>
                    Financial Deductions & Additions
                  </h3>
                  <div className={styles.settingsGrid}>
                    <label className={styles.settingCard}>
                      <input
                        type="checkbox"
                        checked={settings.has_gst}
                        onChange={() => toggleSetting("has_gst")}
                      />
                      <span className={styles.settingLabel}>Has GST (+5%)</span>
                    </label>

                    <label className={styles.settingCard}>
                      <input
                        type="checkbox"
                        checked={settings.has_wcb}
                        onChange={() => toggleSetting("has_wcb")}
                      />
                      <span className={styles.settingLabel}>
                        Pays WCB (-3%)
                      </span>
                    </label>

                    <label className={styles.settingCard}>
                      <input
                        type="checkbox"
                        checked={settings.has_holdback}
                        onChange={() => toggleSetting("has_holdback")}
                      />
                      <span className={styles.settingLabel}>
                        Back Hold (-5%)
                      </span>
                    </label>
                  </div>
                </div>

                {/* ДОКУМЕНТИ */}
                <div>
                  <h3 className={styles.sectionTitle}>Uploaded Documents</h3>
                  {documents.length > 0 ? (
                    <div className={styles.documentsGrid}>
                      {documents.map((doc, idx) => (
                        <a
                          key={doc.id}
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.docCard}
                          onClick={(e) => handleDocumentClick(e, doc.file_url)}
                        >
                          <div className={styles.docPreview}>
                            {isImage(doc.file_url) ? (
                              <img src={doc.file_url} alt="Document preview" />
                            ) : isPdf(doc.file_url) ? (
                              <FaFilePdf
                                className={styles.docIcon}
                                style={{ color: "#d32f2f" }}
                              />
                            ) : (
                              <FaFileAlt className={styles.docIcon} />
                            )}
                          </div>
                          <div className={styles.docInfo}>
                            Document #{idx + 1}
                          </div>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className={styles.emptyText}>
                      Цей працівник ще не завантажив жодного документа.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LIGHTBOX ДЛЯ ПЕРЕГЛЯДУ ФОТОГРАФІЙ */}
      {selectedImage && (
        <div
          className={styles.lightboxOverlay}
          onClick={() => setSelectedImage(null)}
        >
          <button
            className={styles.lightboxClose}
            onClick={() => setSelectedImage(null)}
          >
            <FaTimes />
          </button>
          <img
            src={selectedImage}
            alt="Expanded document view"
            className={styles.lightboxImage}
            onClick={(e) =>
              e.stopPropagation()
            } /* Щоб клік по самому фото не закривав вікно */
          />
        </div>
      )}
    </>
  );
};

export default WorkerProfileModal;
