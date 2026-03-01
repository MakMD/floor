import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { jsPDF } from "jspdf"; // ДОДАНО: Бібліотека для PDF
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
  FaDownload, // ДОДАНО: Іконка завантаження
} from "react-icons/fa";
import styles from "./AddressDetailsPage.module.css";
import listStyles from "./AddressListPage.module.css";
import commonStyles from "../styles/common.module.css";
import toast from "react-hot-toast";
import FileUpload from "../components/FileUpload/FileUpload";
import { useAdminLists } from "../hooks/useAdminLists";
import { usePeople } from "../hooks/usePeople";
import WorkTypesManager from "../components/WorkTypesManager/WorkTypesManager";
import MaterialsManager from "../components/MaterialsManager/MaterialsManager";

const StatusIndicator = ({ status }) => {
  const statusClass =
    {
      "In Process": listStyles.statusInProgress,
      Ready: listStyles.statusReady,
      "Not Finished": listStyles.statusNotFinished,
    }[status] || "";

  return (
    <div className={`${listStyles.statusIndicator} ${statusClass}`}>
      <span>{status || "No Status"}</span>
    </div>
  );
};

const FileListItem = ({ bucketName, fileIdentifier, onDelete }) => {
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
  const searchState = location.state || null;

  const [addressData, setAddressData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newMaterialNote, setNewMaterialNote] = useState("");
  const [editedData, setEditedData] = useState({
    address: "",
    material_notes: [],
    total_amount: "",
    date: "",
    status: "",
    builder_id: "",
    store_id: "",
  });

  const [workOrders, setWorkOrders] = useState([]);
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

  const BUCKET_NAME = "address-files";

  const fetchData = useCallback(async () => {
    if (!addressId) return;

    const { data: addrData, error: addrError } = await supabase
      .from("addresses")
      .select("*, builders(name), stores(name)")
      .eq("id", addressId)
      .single();

    if (addrError) {
      toast.error("Could not load address data.");
      navigate("/addresses");
      return;
    }

    setAddressData(addrData);
    setEditedData({
      address: addrData.address || "",
      material_notes: addrData.material_notes || [],
      total_amount: addrData.total_amount || "",
      date: addrData.date || "",
      status: addrData.status || "In Process",
      builder_id: addrData.builder_id || "",
      store_id: addrData.store_id || "",
    });

    const { data: woList, error: woError } = await supabase
      .from("work_orders")
      .select("*, products(name), people(name)")
      .eq("address_id", addressId)
      .order("created_at", { ascending: false });

    if (!woError) {
      setWorkOrders(woList || []);
    }
  }, [addressId, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
    };
    const updated = await updateAddress(updates);
    if (updated) {
      setIsEditing(false);
      toast.success("Project Details saved!");
    }
  };

  const handleAddMaterialNote = async () => {
    if (newMaterialNote.trim() === "") return;
    const updatedNotes = [...editedData.material_notes, newMaterialNote.trim()];
    const updated = await updateAddress({ material_notes: updatedNotes });
    if (updated) {
      setEditedData((prev) => ({ ...prev, material_notes: updatedNotes }));
      setNewMaterialNote("");
      toast.success("Material note added!");
    }
  };

  const handleDeleteMaterialNote = async (index) => {
    if (!window.confirm("Are you sure?")) return;
    const updatedNotes = editedData.material_notes.filter(
      (_, i) => i !== index,
    );
    const updated = await updateAddress({ material_notes: updatedNotes });
    if (updated) {
      setEditedData((prev) => ({ ...prev, material_notes: updatedNotes }));
      toast.success("Material note deleted!");
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

  // --- ФУНКЦІЇ WORK ORDERS ---
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

  // --- ЛОГІКА ГЕНЕРАЦІЇ PDF ---
  // --- ЛОГІКА ГЕНЕРАЦІЇ PDF ---
  const generatePDF = (wo) => {
    const doc = new jsPDF();

    // 1. Шапка (Header)
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("FLOORING BOSS LTD.", 105, 25, { align: "center" });

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100); // Сірий колір для локації
    doc.text("Edmonton, Alberta", 105, 33, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Повертаємо чорний колір
    doc.text("WORK ORDER", 105, 50, { align: "center" });

    // 2. Підготовка даних для таблиці
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

    // Додаємо Area тільки якщо вона заповнена
    if (wo.area && wo.area.trim() !== "") {
      rows.push({ label: "Area:", value: wo.area });
    }

    // 3. Малювання таблиці
    let startY = 65;
    const leftMargin = 20;
    const col1Width = 50;
    const col2Width = 120;
    const rowHeight = 12;

    // Малюємо зовнішню рамку таблиці
    doc.setLineWidth(0.3);
    doc.rect(
      leftMargin,
      startY,
      col1Width + col2Width,
      rows.length * rowHeight,
    );

    // Заповнюємо рядки
    rows.forEach((row, i) => {
      const currentY = startY + i * rowHeight;

      // Малюємо горизонтальні лінії (крім першого рядка)
      if (i > 0) {
        doc.line(
          leftMargin,
          currentY,
          leftMargin + col1Width + col2Width,
          currentY,
        );
      }

      // Малюємо вертикальну лінію-розділювач між колонками
      doc.line(
        leftMargin + col1Width,
        currentY,
        leftMargin + col1Width,
        currentY + rowHeight,
      );

      // Текст першої колонки (Назва поля)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(row.label, leftMargin + 5, currentY + 8);

      // Текст другої колонки (Значення)
      doc.setFont("helvetica", "normal");
      doc.text(row.value.toString(), leftMargin + col1Width + 5, currentY + 8);
    });

    // 4. Підписи та завершення (Футер)
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

  // Завантаження PDF по кнопці
  const handleDownloadPDF = (e, wo) => {
    e.stopPropagation();
    const doc = generatePDF(wo);
    doc.save(`WorkOrder_${wo.area || "Doc"}.pdf`);
  };

  // Перетягування файлу
  const handleDragStart = (e, wo) => {
    const doc = generatePDF(wo);
    const dataUri = doc.output("datauristring");
    const fileName = `WorkOrder_${wo.area ? wo.area.replace(/\s+/g, "_") : "Doc"}.pdf`;

    // Формуємо спец-URL для браузера, щоб він сприймав це як завантаження файлу
    e.dataTransfer.setData(
      "DownloadURL",
      `application/pdf:${fileName}:${dataUri}`,
    );
  };

  if (!addressData) return <p>Loading...</p>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button
          className={commonStyles.buttonSecondary}
          onClick={() => navigate("/addresses", { state: searchState })}
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
          onClick={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
        >
          {isEditing ? <FaCheck /> : <FaEdit />}{" "}
          {isEditing ? "Save" : "Edit Details"}
        </button>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.gridColumn}>
          {/* === БЛОК: WORK ORDERS === */}
          <div
            className={styles.detailCard}
            style={{ borderLeft: "4px solid var(--color-primary)" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0 }}>Work Orders</h3>
              {!showWoForm && (
                <button
                  onClick={() => {
                    setEditingWoId(null);
                    setShowWoForm(true);
                  }}
                  className={commonStyles.buttonPrimary}
                  style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                >
                  <FaPlus /> Add New
                </button>
              )}
            </div>

            {showWoForm ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "16px",
                  backgroundColor: "var(--color-background)",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                }}
              >
                <h4>{editingWoId ? "Edit Work Order" : "Create Work Order"}</h4>
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
                  style={{ display: "flex", gap: "10px", marginTop: "10px" }}
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
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "6px",
                        backgroundColor: "var(--color-background)",
                        cursor: "grab",
                        transition: "background-color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--color-surface)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor =
                          "var(--color-background)")
                      }
                      title="Drag to desktop or click to edit"
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
                          <FaFilePdf style={{ color: "#e11d48" }} /> Area:{" "}
                          {wo.area || "N/A"}
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
                        {/* КНОПКА ЗАВАНТАЖЕННЯ PDF */}
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
                  <p
                    style={{
                      color: "var(--color-text-secondary)",
                      fontStyle: "italic",
                      fontSize: "0.9rem",
                    }}
                  >
                    No work orders created for this project yet.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className={styles.detailCard}>
            <h3>General Project Details</h3>
            <div className={styles.detailItem}>
              <label>Status</label>
              <div className={styles.statusCell}>
                {isEditing ? (
                  <select
                    name="status"
                    value={editedData.status}
                    onChange={handleInputChange}
                    className={styles.editInput}
                  >
                    <option value="In Process">In Process</option>
                    <option value="Ready">Ready</option>
                    <option value="Not Finished">Not Finished</option>
                  </select>
                ) : (
                  <StatusIndicator status={addressData.status} />
                )}
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

          <div className={styles.detailCard}>
            <h3>Work Types & Payments</h3>
            <WorkTypesManager addressId={addressId} addressData={addressData} />
          </div>
        </div>

        <div className={styles.gridColumn}>
          <div className={styles.detailCard}>
            <h3>Materials</h3>
            <MaterialsManager addressId={addressId} />
          </div>
          <div className={styles.detailCard}>
            <h3>Material Notes</h3>
            <div className={styles.addNoteForm}>
              <input
                type="text"
                value={newMaterialNote}
                onChange={(e) => setNewMaterialNote(e.target.value)}
                placeholder="Add a text note..."
                className={styles.noteInput}
              />
              <button
                onClick={handleAddMaterialNote}
                className={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            {editedData.material_notes.length > 0 ? (
              <ul className={styles.notesList}>
                {editedData.material_notes.map((note, index) => (
                  <li key={index} className={styles.noteItem}>
                    <span>{note}</span>
                    <button
                      onClick={() => handleDeleteMaterialNote(index)}
                      className={commonStyles.buttonIcon}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noItemsMessage}>No material notes yet.</p>
            )}
          </div>
          <div className={styles.detailCard}>
            <h3>Files & Photos</h3>
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
                  />
                ))}
              </ul>
            ) : (
              <p className={styles.noItemsMessage}>No files uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressDetailsPage;
