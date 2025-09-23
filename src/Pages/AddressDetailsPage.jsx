// src/Pages/AddressDetailsPage.jsx

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTrash,
  FaFileAlt,
  FaSpinner,
} from "react-icons/fa";
import styles from "./AddressDetailsPage.module.css";
import listStyles from "./AddressListPage.module.css"; // ІМПОРТ: стилі для індикатора
import toast from "react-hot-toast";
import FileUpload from "../components/FileUpload/FileUpload";
import { useAdminLists } from "../hooks/useAdminLists";
import WorkTypesManager from "../components/WorkTypesManager/WorkTypesManager";

// ДОДАНО: Компонент для візуального відображення статусу
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
          url.pathname.indexOf(bucketName) + bucketName.length + 1
        );
      } catch (e) {
        /* Not a URL, already a path */
      }

      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(path, 3600);
      if (error) {
        console.error("Error creating signed URL:", error);
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
        className={styles.deleteFileButton}
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

  const [addressData, setAddressData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newGeneralNote, setNewGeneralNote] = useState("");
  const [newMaterialNote, setNewMaterialNote] = useState("");
  const { builders, stores, loading: listsLoading } = useAdminLists();

  const [editedData, setEditedData] = useState({
    notes: [],
    material_notes: [],
    total_amount: "",
    date: "",
    status: "",
    builder_id: "",
    store_id: "",
  });

  const BUCKET_NAME = "address-files";

  const fetchAddressDetails = useCallback(async () => {
    if (!addressId) return;
    const { data, error } = await supabase
      .from("addresses")
      .select("*, builders(name), stores(name)")
      .eq("id", addressId)
      .single();
    if (error) {
      console.error("Error fetching address details:", error);
      toast.error("Could not load address data.");
      navigate("/addresses");
    } else {
      setAddressData(data);
      setEditedData({
        notes: data.notes || [],
        material_notes: data.material_notes || [],
        total_amount: data.total_amount || "",
        date: data.date || "",
        status: data.status || "In Process",
        builder_id: data.builder_id || "",
        store_id: data.store_id || "",
      });
    }
  }, [addressId, navigate]);

  useEffect(() => {
    fetchAddressDetails();
  }, [fetchAddressDetails]);

  const updateAddress = async (updates) => {
    if (!addressId) {
      toast.error("Address ID is missing. Cannot save changes.");
      return null;
    }
    const { data, error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", addressId)
      .select("*, builders(name), stores(name)")
      .single();
    if (error) {
      console.error("Error updating address:", error);
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
      toast.success("Details saved successfully!");
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
    if (!window.confirm("Are you sure you want to delete this material note?"))
      return;
    const updatedNotes = editedData.material_notes.filter(
      (_, i) => i !== index
    );
    const updated = await updateAddress({ material_notes: updatedNotes });
    if (updated) {
      setEditedData((prev) => ({ ...prev, material_notes: updatedNotes }));
      toast.success("Material note deleted!");
    }
  };
  const handleAddGeneralNote = async () => {
    if (newGeneralNote.trim() === "") return;
    const updatedNotes = [...editedData.notes, newGeneralNote.trim()];
    const updated = await updateAddress({ notes: updatedNotes });
    if (updated) {
      setEditedData((prev) => ({ ...prev, notes: updatedNotes }));
      setNewGeneralNote("");
      toast.success("Note added!");
    }
  };
  const handleDeleteGeneralNote = async (index) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    const updatedNotes = editedData.notes.filter((_, i) => i !== index);
    const updated = await updateAddress({ notes: updatedNotes });
    if (updated) {
      setEditedData((prev) => ({ ...prev, notes: updatedNotes }));
      toast.success("Note deleted!");
    }
  };
  const handleFileUploaded = async (filePath) => {
    const updatedFiles = [...(addressData.files || []), filePath];
    const updated = await updateAddress({ files: updatedFiles });
    if (updated) {
      toast.success("File uploaded successfully!");
    }
  };
  const handleFileDelete = async (fileIdentifier) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    let path = fileIdentifier;
    try {
      const url = new URL(fileIdentifier);
      path = url.pathname.substring(
        url.pathname.indexOf(BUCKET_NAME) + BUCKET_NAME.length + 1
      );
    } catch (e) {
      /* It's already a path */
    }
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);
    if (storageError) {
      toast.error("Failed to delete file from storage.");
      return;
    }
    const updatedFiles = addressData.files.filter(
      (identifier) => identifier !== fileIdentifier
    );
    const updated = await updateAddress({ files: updatedFiles });
    if (updated) {
      toast.success("File deleted successfully!");
    }
  };

  if (!addressData) return <p>Loading...</p>;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/addresses")}
        >
          <FaArrowLeft /> Back
        </button>
        <h1 className={styles.pageTitle}>{addressData.address}</h1>
        <button
          className={styles.editButton}
          onClick={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
        >
          {isEditing ? <FaCheck /> : <FaEdit />}{" "}
          {isEditing ? "Save" : "Edit Details"}
        </button>
      </div>

      <div className={styles.detailsGrid}>
        <div className={styles.gridColumn}>
          <div className={styles.detailCard}>
            <h3>Project Details</h3>
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
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p>{addressData.stores?.name || "N/A"}</p>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>Builder</label>
              {isEditing ? (
                <select
                  name="builder_id"
                  value={editedData.builder_id}
                  onChange={handleInputChange}
                  className={styles.editInput}
                  disabled={listsLoading}
                >
                  <option value="">Select a builder</option>
                  {builders.map((builder) => (
                    <option key={builder.id} value={builder.id}>
                      {builder.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p>{addressData.builders?.name || "N/A"}</p>
              )}
            </div>
            <div className={styles.detailItem}>
              <label>Date</label>
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
            <WorkTypesManager addressId={addressId} />
          </div>
        </div>

        <div className={styles.gridColumn}>
          <div className={styles.detailCard}>
            <h3>Material Notes</h3>
            <div className={styles.addNoteForm}>
              <input
                type="text"
                value={newMaterialNote}
                onChange={(e) => setNewMaterialNote(e.target.value)}
                placeholder="Add material info..."
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
                      className={styles.deleteNoteButton}
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
            <h3>General Notes</h3>
            <div className={styles.addNoteForm}>
              <input
                type="text"
                value={newGeneralNote}
                onChange={(e) => setNewGeneralNote(e.target.value)}
                placeholder="Add a new note..."
                className={styles.noteInput}
              />
              <button
                onClick={handleAddGeneralNote}
                className={styles.addButton}
              >
                <FaPlus />
              </button>
            </div>
            {editedData.notes.length > 0 ? (
              <ul className={styles.notesList}>
                {editedData.notes.map((note, index) => (
                  <li key={index} className={styles.noteItem}>
                    <span>{note}</span>
                    <button
                      onClick={() => handleDeleteGeneralNote(index)}
                      className={styles.deleteNoteButton}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.noItemsMessage}>No general notes yet.</p>
            )}
          </div>
          <div className={styles.detailCard}>
            <h3>Files & Photos</h3>
            <FileUpload
              bucketName={BUCKET_NAME}
              onUploadSuccess={handleFileUploaded}
            />
            {addressData.files && addressData.files.length > 0 ? (
              <ul className={styles.fileList}>
                {addressData.files.map((fileIdentifier) => (
                  <FileListItem
                    key={fileIdentifier}
                    bucketName={BUCKET_NAME}
                    fileIdentifier={fileIdentifier}
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
