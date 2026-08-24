// src/Pages/AddressDetailsPage.jsx
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { jsPDF } from "jspdf";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTrash,
  FaFileAlt,
  FaSpinner,
  FaTimes,
  FaFilePdf,
  FaDownload,
  FaCheckCircle,
  FaWrench,
  FaInfoCircle,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import styles from "./AddressDetailsPage.module.css";
import commonStyles from "../styles/common.module.css";
import toast from "react-hot-toast";
import FileUpload from "../components/FileUpload/FileUpload";
import { useAdminLists } from "../hooks/useAdminLists";
import { usePeople } from "../hooks/usePeople";
import WorkTypesManager from "../components/WorkTypesManager/WorkTypesManager";
import MaterialsManager from "../components/MaterialsManager/MaterialsManager";

const isImage = (url) => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0];
  return cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|bmp)$/i) != null;
};

const isPdf = (url) => {
  if (!url) return false;
  const cleanUrl = url.split("?")[0];
  return cleanUrl.match(/\.(pdf)$/i) != null;
};

const getStatusStyle = (status) => {
  if (status === "Ready")
    return { bg: "rgba(40, 167, 69, 0.15)", color: "#28a745" };
  if (status === "Not Finished")
    return { bg: "rgba(220, 53, 69, 0.15)", color: "#dc3545" };
  return { bg: "rgba(255, 193, 7, 0.15)", color: "#d39e00" };
};

const FileListItem = ({
  bucketName,
  fileIdentifier,
  onDelete,
  onImageClick,
}) => {
  const [signedUrl, setSignedUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUrl = async () => {
      setIsLoading(true);
      let path = fileIdentifier;
      try {
        const url = new URL(fileIdentifier);
        path = url.pathname.substring(
          url.pathname.indexOf(bucketName) + bucketName.length + 1,
        );
      } catch (e) {}

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, 3600);
      if (error) {
        toast.error(`Could not get URL for ${path.split("/").pop()}`);
      } else {
        setSignedUrl(data.signedUrl);
      }
      setIsLoading(false);
    };
    getUrl();
  }, [bucketName, fileIdentifier]);

  const handleLinkClick = (e) => {
    if (!signedUrl) {
      e.preventDefault();
      toast("Generating file link, please wait...");
      return;
    }

    if (isImage(signedUrl)) {
      e.preventDefault();
      onImageClick(signedUrl);
    }
  };

  const fileName = fileIdentifier.split("/").pop();

  return (
    <li className={styles.fileItem}>
      <a
        href={signedUrl || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.fileLink} ${isLoading ? styles.disabledLink : ""}`}
        onClick={handleLinkClick}
      >
        {isLoading ? <FaSpinner className={styles.spinner} /> : <FaFileAlt />}
        {fileName}
      </a>
      <button
        onClick={() => onDelete(fileIdentifier)}
        className={commonStyles.buttonIcon}
        disabled={isLoading}
      >
        <FaTrash />
      </button>
    </li>
  );
};

const AddressDetailsPage = () => {
  const { addressId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [addressData, setAddressData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const [newSqFtNote, setNewSqFtNote] = useState("");
  const [editedData, setEditedData] = useState({
    address: "",
    sq_ft_notes: [],
    total_amount: "",
    date: "",
    status: "",
    builder_id: "",
    store_id: "",
    ai_translation: "",
  });

  const [workOrders, setWorkOrders] = useState([]);
  const [reports, setReports] = useState([]);

  const [expandedReports, setExpandedReports] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  // Стейти для зуму та перетягування зображення
  const [zoomScale, setZoomScale] = useState(1);
  const [imgPosition, setImgPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [showWoForm, setShowWoForm] = useState(false);
  const [isSubmittingWo, setIsSubmittingWo] = useState(false);
  const [editingWoId, setEditingWoId] = useState(null);
  const [woData, setWoData] = useState({
    area: "",
    product_id: "",
    sq_ft: "",
    worker_id: "",
    people_count: "",
    date_completed: "",
  });

  const { builders, stores, products, loading: listsLoading } = useAdminLists();
  const { people, loading: peopleLoading } = usePeople();

  const BUCKET_NAME = "material-photos";

  const fetchData = useCallback(async () => {
    if (!addressId) return;

    const [addrRes, woRes, reportsRes] = await Promise.all([
      supabase
        .from("addresses")
        .select("*, builders(name), stores(name)")
        .eq("id", addressId)
        .single(),
      supabase
        .from("work_orders")
        .select("*, products(name), people(name)")
        .eq("address_id", addressId)
        .order("created_at", { ascending: false }),
      supabase
        .from("daily_reports")
        .select(
          `
          *,
          work_types (
            work_type_templates (name)
          )
        `,
        )
        .eq("address_id", addressId)
        .order("created_at", { ascending: false }),
    ]);

    if (addrRes.error) {
      toast.error("Could not load address data.");
      navigate("/addresses");
      return;
    }

    setAddressData(addrRes.data);
    setEditedData({
      address: addrRes.data.address || "",
      sq_ft_notes: addrRes.data.sq_ft_notes || [],
      total_amount: addrRes.data.total_amount || "",
      date: addrRes.data.date || "",
      status: addrRes.data.status || "In Process",
      builder_id: addrRes.data.builder_id || "",
      store_id: addrRes.data.store_id || "",
      ai_translation: addrRes.data.ai_translation || "",
    });

    if (!woRes.error) {
      setWorkOrders(woRes.data || []);
    }

    if (reportsRes.error) {
      console.error("Помилка завантаження звітів:", reportsRes.error);
    } else if (reportsRes.data && reportsRes.data.length > 0) {
      const workerIds = [
        ...new Set(reportsRes.data.map((r) => r.worker_id).filter(Boolean)),
      ];

      if (workerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", workerIds);

        const reportsWithProfiles = reportsRes.data.map((report) => {
          const profile = profilesData?.find((p) => p.id === report.worker_id);
          return {
            ...report,
            profiles: profile || null,
          };
        });

        setReports(reportsWithProfiles);

        const initialExpandedState = {};
        reportsRes.data.forEach((r) => {
          initialExpandedState[r.id] = false;
        });
        setExpandedReports(initialExpandedState);
      } else {
        setReports(reportsRes.data);
      }
    } else {
      setReports([]);
    }
  }, [addressId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Логіка масштабування та перетягування
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newScale =
      e.deltaY < 0 ? zoomScale * zoomFactor : zoomScale / zoomFactor;
    newScale = Math.max(1, Math.min(newScale, 5));
    setZoomScale(newScale);
    if (newScale === 1) {
      setImgPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (zoomScale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - imgPosition.x,
        y: e.clientY - imgPosition.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setImgPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const closeLightbox = () => {
    setSelectedImage(null);
    setZoomScale(1);
    setImgPosition({ x: 0, y: 0 });
  };

  const toggleReportExpansion = (reportId) => {
    setExpandedReports((prev) => ({
      ...prev,
      [reportId]: !prev[reportId],
    }));
  };

  const updateAddress = async (updates) => {
    const { data, error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", addressId)
      .select("*, builders(name), stores(name)")
      .single();
    if (error) {
      toast.error(error.message || "Failed to save changes.");
      return null;
    }
    setAddressData(data);
    return data;
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setEditedData((prev) => ({ ...prev, status: newStatus }));
    const updated = await updateAddress({ status: newStatus });
    if (updated) {
      toast.success(`Project status updated to ${newStatus}`);
    } else {
      setEditedData((prev) => ({ ...prev, status: addressData?.status }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveChanges = async () => {
    const updates = {
      address: editedData.address.trim(),
      total_amount: editedData.total_amount
        ? parseFloat(editedData.total_amount)
        : null,
      date: editedData.date || null,
      status: editedData.status,
      builder_id: editedData.builder_id || null,
      store_id: editedData.store_id || null,
      ai_translation: editedData.ai_translation,
    };
    const updated = await updateAddress(updates);
    if (updated) {
      setIsEditing(false);
      toast.success("Project Details saved!");
    }
  };

  const handleAddSqFtNote = async () => {
    if (newSqFtNote.trim() === "") return;
    const updatedNotes = [...editedData.sq_ft_notes, newSqFtNote.trim()];
    const updated = await updateAddress({ sq_ft_notes: updatedNotes });
    if (updated) {
      setEditedData((prev) => ({ ...prev, sq_ft_notes: updatedNotes }));
      setNewSqFtNote("");
      toast.success("Note added!");
    }
  };

  const handleDeleteSqFtNote = async (index) => {
    if (!window.confirm("Are you sure?")) return;
    const updatedNotes = editedData.sq_ft_notes.filter((_, i) => i !== index);
    const updated = await updateAddress({ sq_ft_notes: updatedNotes });
    if (updated) {
      setEditedData((prev) => ({ ...prev, sq_ft_notes: updatedNotes }));
      toast.success("Note deleted!");
    }
  };

  const handleFileUploaded = async (filePath) => {
    const updatedFiles = [...(addressData.files || []), filePath];
    const updated = await updateAddress({ files: updatedFiles });
    if (updated) toast.success("File uploaded successfully!");
  };

  const handleFileDelete = async (fileIdentifier) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    let path = fileIdentifier;
    try {
      const url = new URL(fileIdentifier);
      path = url.pathname.substring(
        url.pathname.indexOf(BUCKET_NAME) + BUCKET_NAME.length + 1,
      );
    } catch (e) {}
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
    if (error) {
      toast.error("Failed to delete file.");
      return;
    }
    const updatedFiles = addressData.files.filter(
      (id) => id !== fileIdentifier,
    );
    const updated = await updateAddress({ files: updatedFiles });
    if (updated) toast.success("File deleted successfully!");
  };

  const handleWoChange = (e) => {
    const { name, value } = e.target;
    setWoData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditWO = (e, wo) => {
    e.stopPropagation();
    setEditingWoId(wo.id);
    setWoData({
      area: wo.area || "",
      product_id: wo.product_id || "",
      sq_ft: wo.sq_ft || "",
      worker_id: wo.worker_id || "",
      people_count: wo.people_count || "",
      date_completed: wo.date_completed || "",
    });
    setShowWoForm(true);
  };

  const handleCancelWO = () => {
    setShowWoForm(false);
    setEditingWoId(null);
    setWoData({
      area: "",
      product_id: "",
      sq_ft: "",
      worker_id: "",
      people_count: "",
      date_completed: "",
    });
  };

  const handleSaveWO = async () => {
    setIsSubmittingWo(true);
    try {
      const payload = {
        address_id: parseInt(addressId),
        area: woData.area ? woData.area.trim() : null,
        product_id: woData.product_id ? parseInt(woData.product_id) : null,
        sq_ft: woData.sq_ft ? parseFloat(woData.sq_ft) : null,
        worker_id: woData.worker_id ? parseInt(woData.worker_id) : null,
        people_count: woData.people_count
          ? parseInt(woData.people_count)
          : null,
        date_completed: woData.date_completed || null,
      };

      let error;
      if (editingWoId) {
        const { error: updateError } = await supabase
          .from("work_orders")
          .update(payload)
          .eq("id", editingWoId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("work_orders")
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        toast.error(`Database Error: ${error.message}`);
      } else {
        toast.success(
          editingWoId ? "Work Order updated!" : "Work Order added!",
        );
        handleCancelWO();
        const { data } = await supabase
          .from("work_orders")
          .select("*, products(name), people(name)")
          .eq("address_id", addressId)
          .order("created_at", { ascending: false });
        if (data) setWorkOrders(data);
      }
    } catch (err) {
      toast.error("Something went wrong!");
    } finally {
      setIsSubmittingWo(false);
    }
  };

  const handleDeleteWO = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this Work Order?"))
      return;
    const { error } = await supabase.from("work_orders").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
    } else {
      toast.success("Work Order deleted");
      setWorkOrders((prev) => prev.filter((wo) => wo.id !== id));
    }
  };

  const generatePDF = (wo) => {
    const doc = new jsPDF();
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("FLOORING BOSS LTD.", 105, 25, { align: "center" });
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text("Edmonton, Alberta", 105, 33, { align: "center" });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("WORK ORDER", 105, 50, { align: "center" });

    const rows = [
      { label: "Client:", value: addressData.builders?.name || "N/A" },
      { label: "Project Address:", value: addressData.address || "N/A" },
      { label: "Order Date:", value: addressData.date || "N/A" },
      { label: "Product:", value: wo.products?.name || "N/A" },
      {
        label: "Total Sq Footage:",
        value: wo.sq_ft ? `${wo.sq_ft} sqft` : "N/A",
      },
    ];

    if (wo.area && wo.area.trim() !== "") {
      rows.push({ label: "Area:", value: wo.area });
    }

    let startY = 65;
    const leftMargin = 20;
    const col1Width = 50;
    const col2Width = 120;
    const rowHeight = 12;

    doc.setLineWidth(0.3);
    doc.rect(
      leftMargin,
      startY,
      col1Width + col2Width,
      rows.length * rowHeight,
    );

    rows.forEach((row, i) => {
      const currentY = startY + i * rowHeight;
      if (i > 0) {
        doc.line(
          leftMargin,
          currentY,
          leftMargin + col1Width + col2Width,
          currentY,
        );
      }
      doc.line(
        leftMargin + col1Width,
        currentY,
        leftMargin + col1Width,
        currentY + rowHeight,
      );
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(row.label, leftMargin + 5, currentY + 8);
      doc.setFont("helvetica", "normal");
      doc.text(row.value.toString(), leftMargin + col1Width + 5, currentY + 8);
    });

    let footerY = startY + rows.length * rowHeight + 30;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Installer Signature:", 20, footerY);
    doc.setFont("helvetica", "normal");
    const installerName = wo.people?.name
      ? wo.people.name
      : "_________________________________";
    doc.text(installerName, 65, footerY);
    footerY += 15;
    doc.setFont("helvetica", "bold");
    doc.text("Date Completed:", 20, footerY);
    doc.setFont("helvetica", "normal");
    const dateCompleted = wo.date_completed
      ? wo.date_completed
      : "_________________________________";
    doc.text(dateCompleted, 65, footerY);

    return doc;
  };

  const handleDownloadPDF = (e, wo) => {
    e.stopPropagation();
    const doc = generatePDF(wo);
    doc.save(`WorkOrder_${wo.area || "Doc"}.pdf`);
  };

  const handleDragStart = (e, wo) => {
    const doc = generatePDF(wo);
    const dataUri = doc.output("datauristring");
    const fileName = `WorkOrder_${wo.area ? wo.area.replace(/\s+/g, "_") : "Doc"}.pdf`;
    e.dataTransfer.setData(
      "DownloadURL",
      `application/pdf:${fileName}:${dataUri}`,
    );
  };

  const handleApproveReport = async (e) => {
    e.stopPropagation();
    setEditedData((prev) => ({ ...prev, status: "Ready" }));
    const updated = await updateAddress({ status: "Ready" });
    if (updated) {
      toast.success("Project marked as Ready based on report!");
    }
  };

  if (!addressData) return <p>Loading...</p>;

  const statusStyle = getStatusStyle(editedData.status);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileLayout}>
        {/* ЛАЙТБОКС ЗІ ЗУМОМ ТА ПЕРЕТЯГУВАННЯМ */}
        {selectedImage && (
          <div
            className={styles.lightbox}
            onClick={closeLightbox}
            onWheel={handleWheel}
          >
            <button className={styles.closeLightbox} onClick={closeLightbox}>
              <FaTimes />
            </button>
            <img
              src={selectedImage}
              alt="Fullscreen view"
              style={{
                transform: `scale(${zoomScale}) translate(${imgPosition.x / zoomScale}px, ${imgPosition.y / zoomScale}px)`,
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}

        <div className={styles.header}>
          <button
            className={commonStyles.buttonSecondary}
            onClick={() => navigate(-1)}
            style={{ border: "none" }}
          >
            <FaArrowLeft /> Back
          </button>
          {isEditing ? (
            <input
              type="text"
              name="address"
              value={editedData.address}
              onChange={handleInputChange}
              className={styles.titleInput}
            />
          ) : (
            <h1 className={styles.pageTitle}>{addressData.address}</h1>
          )}
          <button
            className={commonStyles.buttonPrimary}
            onClick={() =>
              isEditing ? handleSaveChanges() : setIsEditing(true)
            }
          >
            {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Save" : "Edit"}
          </button>
        </div>

        <div className={styles.detailsGrid}>
          {/* ЛІВА КОЛОНКА */}
          <div className={styles.gridColumn}>
            {/* 1. GENERAL DETAILS */}
            <div className={styles.detailCard}>
              <h3>General Project Details</h3>
              <div className={styles.cardContentWrapper}>
                <div className={styles.detailItem}>
                  <label>Status</label>
                  <div className={styles.statusCell}>
                    <select
                      name="status"
                      value={editedData.status}
                      onChange={handleStatusChange}
                      className={styles.editInput}
                      style={{
                        backgroundColor: statusStyle.bg,
                        color: statusStyle.color,
                        fontWeight: "bold",
                        cursor: "pointer",
                        border: "none",
                        outline: "none",
                        padding: "8px 14px",
                      }}
                    >
                      <option value="In Process">In Process</option>
                      <option value="Ready">Ready</option>
                      <option value="Not Finished">Not Finished</option>
                    </select>
                  </div>
                </div>

                <div className={styles.detailItem}>
                  <label>Client (Builder)</label>
                  {isEditing ? (
                    <select
                      name="builder_id"
                      value={editedData.builder_id}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      disabled={listsLoading}
                    >
                      <option value="">Select a builder</option>
                      {builders?.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>{addressData.builders?.name || "N/A"}</p>
                  )}
                </div>
                <div className={styles.detailItem}>
                  <label>Store</label>
                  {isEditing ? (
                    <select
                      name="store_id"
                      value={editedData.store_id}
                      onChange={handleInputChange}
                      className={styles.editInput}
                      disabled={listsLoading}
                    >
                      <option value="">Select a store</option>
                      {stores?.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p>{addressData.stores?.name || "N/A"}</p>
                  )}
                </div>
                <div className={styles.detailItem}>
                  <label>Project Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      name="date"
                      value={editedData.date}
                      onChange={handleInputChange}
                      className={styles.editInput}
                    />
                  ) : (
                    <p>{addressData.date || "N/A"}</p>
                  )}
                </div>
                <div className={styles.detailItem}>
                  <label>Total Amount</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="total_amount"
                      value={editedData.total_amount}
                      onChange={handleInputChange}
                      className={styles.editInput}
                    />
                  ) : (
                    <p>
                      {addressData.total_amount
                        ? `$${addressData.total_amount.toFixed(2)}`
                        : "N/A"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* БЛОК 2: AI TRANSLATION */}
            {(addressData.original_photo_url ||
              addressData.ai_translation ||
              isEditing) && (
              <div className={styles.detailCard}>
                <h3>Scanned Document & AI Notes</h3>
                <div className={styles.cardContentWrapper}>
                  {addressData.original_photo_url && (
                    <div
                      className={styles.detailItem}
                      style={{ gridTemplateColumns: "1fr", gap: "8px" }}
                    >
                      <label>Original Document</label>
                      {isImage(addressData.original_photo_url) ? (
                        <img
                          src={addressData.original_photo_url}
                          alt="Scanned Document"
                          className={styles.originalPhoto}
                          onClick={() =>
                            setSelectedImage(addressData.original_photo_url)
                          }
                        />
                      ) : (
                        <a
                          href={addressData.original_photo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.pdfLinkBox}
                        >
                          <FaFilePdf size={30} color="#dc3545" />
                          <span>View PDF Document</span>
                        </a>
                      )}
                    </div>
                  )}

                  <div
                    className={styles.detailItem}
                    style={{ gridTemplateColumns: "1fr", gap: "8px" }}
                  >
                    <label>AI Instructions / Translation</label>
                    {isEditing ? (
                      <textarea
                        name="ai_translation"
                        value={editedData.ai_translation}
                        onChange={handleInputChange}
                        className={styles.editInput}
                        style={{ minHeight: "120px", resize: "vertical" }}
                        placeholder="AI translation will appear here..."
                      />
                    ) : (
                      <div className={styles.aiNotesBox}>
                        {addressData.ai_translation ? (
                          <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>
                            {addressData.ai_translation}
                          </p>
                        ) : (
                          <span className={styles.noItemsMessage}>
                            No AI instructions available.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. MATERIALS */}
            <div className={styles.detailCard}>
              <h3>Materials</h3>
              <div className={styles.cardContentWrapper}>
                <MaterialsManager addressId={addressId} />
              </div>
            </div>

            {/* 4. WORK TYPES & PAYMENTS */}
            <div className={styles.detailCard}>
              <h3>Work Types & Payments</h3>
              <div className={styles.cardContentWrapper}>
                <WorkTypesManager
                  addressId={addressId}
                  addressData={addressData}
                />
              </div>
            </div>

            {/* 5. WORK ORDERS */}
            <div className={styles.detailCard}>
              <div className={styles.cardHeader}>
                <h3>Work Orders</h3>
                {!showWoForm && (
                  <button
                    onClick={() => {
                      setEditingWoId(null);
                      setShowWoForm(true);
                    }}
                    className={commonStyles.buttonPrimary}
                    style={{ padding: "4px 12px", fontSize: "0.85rem" }}
                  >
                    <FaPlus /> Add New
                  </button>
                )}
              </div>
              <div className={styles.cardContentWrapper}>
                {showWoForm ? (
                  <div className={styles.formContainer}>
                    <h4>
                      {editingWoId ? "Edit Work Order" : "Create Work Order"}
                    </h4>
                    <div className={styles.detailItem}>
                      <label>Area (e.g. Main Floor)</label>
                      <input
                        type="text"
                        name="area"
                        value={woData.area}
                        onChange={handleWoChange}
                        className={styles.editInput}
                        placeholder="Area..."
                      />
                    </div>
                    <div className={styles.detailItem}>
                      <label>Product</label>
                      <select
                        name="product_id"
                        value={woData.product_id}
                        onChange={handleWoChange}
                        className={styles.editInput}
                        disabled={listsLoading}
                      >
                        <option value="">Select Product</option>
                        {products?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.detailItem}>
                      <label>Square Feet</label>
                      <input
                        type="number"
                        name="sq_ft"
                        value={woData.sq_ft}
                        onChange={handleWoChange}
                        className={styles.editInput}
                        placeholder="Sq ft"
                      />
                    </div>
                    <div className={styles.detailItem}>
                      <label>Installer Signature</label>
                      <select
                        name="worker_id"
                        value={woData.worker_id}
                        onChange={handleWoChange}
                        className={styles.editInput}
                        disabled={peopleLoading}
                      >
                        <option value="">Select Installer (Optional)</option>
                        {people?.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.detailItem}>
                      <label>People on Site</label>
                      <input
                        type="number"
                        name="people_count"
                        value={woData.people_count}
                        onChange={handleWoChange}
                        className={styles.editInput}
                        placeholder="Count"
                      />
                    </div>
                    <div className={styles.detailItem}>
                      <label>Date Completed</label>
                      <input
                        type="date"
                        name="date_completed"
                        value={woData.date_completed}
                        onChange={handleWoChange}
                        className={styles.editInput}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: "10px",
                      }}
                    >
                      <button
                        onClick={handleSaveWO}
                        disabled={isSubmittingWo}
                        className={commonStyles.buttonSuccess}
                      >
                        {isSubmittingWo ? (
                          <FaSpinner className="spin" />
                        ) : (
                          <>
                            <FaCheck /> Save WO
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleCancelWO}
                        className={commonStyles.buttonSecondary}
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    {workOrders.length > 0 ? (
                      workOrders.map((wo) => (
                        <div
                          key={wo.id}
                          draggable="true"
                          onDragStart={(e) => handleDragStart(e, wo)}
                          onClick={(e) => handleEditWO(e, wo)}
                          className={styles.draggableCard}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "4px",
                            }}
                          >
                            <strong
                              style={{
                                color: "var(--color-text-primary)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <FaFilePdf
                                style={{ color: "var(--color-danger)" }}
                              />{" "}
                              Area: {wo.area || "N/A"}
                            </strong>
                            <span
                              style={{
                                fontSize: "0.85rem",
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              {wo.products?.name || "No Product"} •{" "}
                              {wo.sq_ft ? `${wo.sq_ft} sq ft` : "No sqft"} •
                              Installer: {wo.people?.name || "TBD"}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={(e) => handleDownloadPDF(e, wo)}
                              className={commonStyles.buttonIcon}
                              title="Download PDF"
                              style={{ color: "var(--color-primary)" }}
                            >
                              <FaDownload />
                            </button>
                            <button
                              onClick={(e) => handleDeleteWO(e, wo.id)}
                              className={commonStyles.buttonIcon}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={styles.noItemsMessage}>
                        No work orders created for this project yet.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ПРАВА КОЛОНКА */}
          <div className={styles.gridColumn}>
            {/* 1. WORKER REPORTS */}
            <div className={styles.detailCard}>
              <h3>Worker Daily Reports</h3>
              <div className={styles.cardContentWrapper}>
                {reports.length > 0 ? (
                  <div className={styles.reportsList}>
                    {reports.map((report) => {
                      const isExpanded = !!expandedReports[report.id];
                      return (
                        <div
                          key={report.id}
                          className={styles.reportCard}
                          style={{
                            cursor: "pointer",
                            transition: "all 0.2s",
                            backgroundColor: isExpanded
                              ? "var(--color-surface)"
                              : "var(--color-background)",
                          }}
                          onClick={() => toggleReportExpansion(report.id)}
                        >
                          <div
                            className={styles.reportHeader}
                            style={{
                              borderBottom: isExpanded
                                ? "1px solid var(--color-border)"
                                : "none",
                              paddingBottom: isExpanded ? "12px" : "0",
                              marginBottom: isExpanded ? "12px" : "0",
                            }}
                          >
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <strong>
                                  {report.profiles?.first_name}{" "}
                                  {report.profiles?.last_name || ""}
                                </strong>
                                <span
                                  style={{
                                    color: "var(--color-text-secondary)",
                                    fontSize: "0.8rem",
                                    paddingTop: "2px",
                                  }}
                                >
                                  {isExpanded ? (
                                    <FaChevronUp />
                                  ) : (
                                    <FaChevronDown />
                                  )}
                                </span>
                              </div>

                              <div style={{ marginTop: "4px" }}>
                                {(() => {
                                  let taskName = null;

                                  if (
                                    report.work_types?.work_type_templates?.name
                                  ) {
                                    taskName =
                                      report.work_types.work_type_templates
                                        .name;
                                  } else if (
                                    report.notes &&
                                    report.notes.includes("[Завдання: ")
                                  ) {
                                    const match = report.notes.match(
                                      /\[Завдання:\s*(.*?)\]/,
                                    );
                                    if (match && match[1]) {
                                      taskName = match[1];
                                    }
                                  }

                                  if (taskName) {
                                    return (
                                      <span
                                        style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          backgroundColor:
                                            "rgba(13, 110, 253, 0.1)",
                                          color: "var(--color-primary)",
                                          padding: "4px 8px",
                                          borderRadius: "6px",
                                          fontSize: "0.8rem",
                                          fontWeight: "600",
                                          marginTop: "6px",
                                        }}
                                      >
                                        <FaWrench size={10} />
                                        Виконано: {taskName}
                                      </span>
                                    );
                                  }

                                  return (
                                    <span
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        backgroundColor:
                                          "rgba(108, 117, 125, 0.1)",
                                        color: "#6c757d",
                                        padding: "4px 8px",
                                        borderRadius: "6px",
                                        fontSize: "0.8rem",
                                        fontWeight: "600",
                                        marginTop: "6px",
                                      }}
                                    >
                                      <FaInfoCircle size={10} /> General Project
                                      Report
                                    </span>
                                  );
                                })()}
                              </div>

                              <div
                                style={{
                                  fontSize: "0.85rem",
                                  color: "var(--color-text-secondary)",
                                  marginTop: "8px",
                                }}
                              >
                                {new Date(report.report_date).toLocaleString()}
                              </div>
                            </div>

                            <div onClick={(e) => e.stopPropagation()}>
                              {editedData.status === "Ready" ? (
                                <span
                                  style={{
                                    color: "#10b981",
                                    fontSize: "0.95rem",
                                    fontWeight: "bold",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px",
                                  }}
                                >
                                  <FaCheckCircle /> Approved
                                </span>
                              ) : (
                                <button
                                  className={commonStyles.buttonSuccess}
                                  style={{
                                    padding: "6px 12px",
                                    fontSize: "0.85rem",
                                  }}
                                  onClick={handleApproveReport}
                                  title="Approve report and mark project as Ready"
                                >
                                  <FaCheckCircle /> Approve
                                </button>
                              )}
                            </div>
                          </div>

                          {isExpanded && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              style={{ marginTop: "12px" }}
                            >
                              {report.notes && (
                                <div className={styles.reportNotes}>
                                  <p
                                    style={{
                                      margin: 0,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
                                    {report.notes
                                      .replace(/\[Завдання:\s*.*?\]\n?/g, "")
                                      .replace(
                                        /\[Статус від працівника:\s*.*?\]\n?/g,
                                        "",
                                      )}
                                  </p>
                                </div>
                              )}

                              {report.photos_before?.length > 0 && (
                                <div className={styles.photoSection}>
                                  <span className={styles.photoSectionTitle}>
                                    Photos Before:
                                  </span>
                                  <div className={styles.photoGrid}>
                                    {report.photos_before.map((url, i) => (
                                      <img
                                        key={`before-${i}`}
                                        src={url}
                                        alt="Before"
                                        className={styles.thumbnail}
                                        onClick={() => setSelectedImage(url)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {report.photos_after?.length > 0 && (
                                <div className={styles.photoSection}>
                                  <span className={styles.photoSectionTitle}>
                                    Photos After:
                                  </span>
                                  <div className={styles.photoGrid}>
                                    {report.photos_after.map((url, i) => (
                                      <img
                                        key={`after-${i}`}
                                        src={url}
                                        alt="After"
                                        className={styles.thumbnail}
                                        onClick={() => setSelectedImage(url)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className={styles.noItemsMessage}>
                    No reports submitted by workers yet.
                  </p>
                )}
              </div>
            </div>

            {/* 2. SQUARE FEET NOTES */}
            <div className={styles.detailCard}>
              <h3>Square Feet Notes</h3>
              <div className={styles.cardContentWrapper}>
                <div className={styles.addNoteForm}>
                  <input
                    type="text"
                    value={newSqFtNote}
                    onChange={(e) => setNewSqFtNote(e.target.value)}
                    placeholder="Add a sq ft note..."
                    className={styles.noteInput}
                  />
                  <button
                    onClick={handleAddSqFtNote}
                    className={styles.addButton}
                  >
                    <FaPlus />
                  </button>
                </div>
                {editedData.sq_ft_notes.length > 0 ? (
                  <ul className={styles.notesList}>
                    {editedData.sq_ft_notes.map((note, index) => (
                      <li key={index} className={styles.noteItem}>
                        <span>{note}</span>
                        <button
                          onClick={() => handleDeleteSqFtNote(index)}
                          className={commonStyles.buttonIcon}
                        >
                          <FaTrash />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.noItemsMessage}>No notes yet.</p>
                )}
              </div>
            </div>

            {/* 3. FILES & PHOTOS */}
            <div className={styles.detailCard}>
              <h3>Files & Photos</h3>
              <div className={styles.cardContentWrapper}>
                <FileUpload
                  bucketName={BUCKET_NAME}
                  onUploadSuccess={handleFileUploaded}
                />
                {addressData.files?.length > 0 ? (
                  <ul className={styles.fileList}>
                    {addressData.files.map((id) => (
                      <FileListItem
                        key={id}
                        bucketName={BUCKET_NAME}
                        fileIdentifier={id}
                        onDelete={handleFileDelete}
                        onImageClick={(url) => setSelectedImage(url)}
                      />
                    ))}
                  </ul>
                ) : (
                  <p className={styles.noItemsMessage}>
                    No files uploaded yet.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressDetailsPage;
