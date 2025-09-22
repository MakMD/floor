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
  FaUserPlus,
} from "react-icons/fa";
import styles from "./AddressDetailsPage.module.css";
import toast from "react-hot-toast";
import FileUpload from "../components/FileUpload/FileUpload";
import PersonPicker from "../components/PersonPicker/PersonPicker";
// ОНОВЛЕНО: Імпортуємо обидві функції
import {
  addInvoiceForWorker,
  removeInvoiceForWorker,
} from "../services/invoiceService";

// ... (Компонент FileListItem залишається без змін) ...
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
  const [newBuilder, setNewBuilder] = useState("");

  const [editedData, setEditedData] = useState({
    notes: [],
    material_notes: [],
    builders: [],
    square_feet: "",
    date: "",
  });

  const BUCKET_NAME = "address-files";

  const fetchAddressDetails = useCallback(async () => {
    if (!addressId) return;
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
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
        builders: data.builders || [],
        square_feet: data.square_feet || "",
        date: data.date || "",
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
      .select()
      .single();
    if (error) {
      console.error("Error updating address:", error);
      toast.error(error.message || "Failed to save changes.");
      return null;
    }
    setAddressData(data);
    return data;
  };

  const handleWorkersUpdate = async (newWorkersList) => {
    const oldWorkersList = addressData.workers || [];
    const updated = await updateAddress({ workers: newWorkersList });

    if (updated) {
      toast.success("Workers list updated!");

      const addedWorkers = newWorkersList.filter(
        (id) => !oldWorkersList.includes(id)
      );
      const removedWorkers = oldWorkersList.filter(
        (id) => !newWorkersList.includes(id)
      );

      if (addedWorkers.length > 0 || removedWorkers.length > 0) {
        if (!addressData.date || !addressData.address) {
          toast.error(
            "Cannot manage invoices without an address and date. Please fill them in."
          );
          return;
        }

        const invoiceData = {
          address: addressData.address,
          date: addressData.date,
        };

        // Створюємо інвойси для доданих працівників
        for (const workerId of addedWorkers) {
          await addInvoiceForWorker(workerId, invoiceData);
        }

        // ОНОВЛЕНО: Видаляємо інвойси для видалених працівників
        for (const workerId of removedWorkers) {
          await removeInvoiceForWorker(workerId, invoiceData);
        }
      }
    }
  };

  // ... (решта функцій-обробників залишається без змін) ...
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedData((prev) => ({ ...prev, [name]: value }));
  };
  const handleSaveChanges = async () => {
    const updates = {
      square_feet: editedData.square_feet
        ? parseInt(editedData.square_feet, 10)
        : null,
      date: editedData.date || null,
    };
    const updated = await updateAddress(updates);
    if (updated) {
      setIsEditing(false);
      toast.success("Details saved successfully!");
    }
  };
  const handleAddBuilder = async () => {
    if (newBuilder.trim() === "") return;
    const updatedBuilders = [...editedData.builders, newBuilder.trim()];
    const updated = await updateAddress({ builders: updatedBuilders });
    if (updated) {
      setEditedData((prev) => ({ ...prev, builders: updatedBuilders }));
      setNewBuilder("");
      toast.success("Builder added!");
    }
  };
  const handleDeleteBuilder = async (index) => {
    if (!window.confirm("Are you sure you want to delete this builder?"))
      return;
    const updatedBuilders = editedData.builders.filter((_, i) => i !== index);
    const updated = await updateAddress({ builders: updatedBuilders });
    if (updated) {
      setEditedData((prev) => ({ ...prev, builders: updatedBuilders }));
      toast.success("Builder deleted!");
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
    // ... (JSX розмітка залишається без змін) ...
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
        {/* ЛІВА КОЛОНКА */}
        <div className={styles.gridColumn}>
          <div className={styles.detailCard}>
            <h3>
              <FaUserPlus /> Builders
            </h3>
            {(isEditing || editedData.builders.length === 0) && (
              <div className={styles.addNoteForm}>
                <input
                  type="text"
                  value={newBuilder}
                  onChange={(e) => setNewBuilder(e.target.value)}
                  placeholder="Add builder name..."
                  className={styles.noteInput}
                />
                <button onClick={handleAddBuilder} className={styles.addButton}>
                  <FaPlus />
                </button>
              </div>
            )}

            {editedData.builders.length > 0 ? (
              <ul className={styles.notesList}>
                {editedData.builders.map((builder, index) => (
                  <li key={index} className={styles.noteItem}>
                    <span>{builder}</span>
                    {isEditing && (
                      <button
                        onClick={() => handleDeleteBuilder(index)}
                        className={styles.deleteNoteButton}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              !isEditing && (
                <p className={styles.noItemsMessage}>No builders added yet.</p>
              )
            )}
          </div>

          <div className={styles.detailCard}>
            <h3>Project Details</h3>
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
              <label>Square Feet</label>
              {isEditing ? (
                <input
                  type="number"
                  name="square_feet"
                  value={editedData.square_feet}
                  onChange={handleInputChange}
                  className={styles.editInput}
                />
              ) : (
                <p>{addressData.square_feet || "N/A"}</p>
              )}
            </div>
          </div>
          <div className={styles.detailCard}>
            <h3>Workers</h3>
            <PersonPicker
              addressId={addressId}
              attachedWorkers={addressData.workers || []}
              onWorkersUpdate={handleWorkersUpdate}
            />
          </div>
        </div>

        {/* ПРАВА КОЛОНКА */}
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
