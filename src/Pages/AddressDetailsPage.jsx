// src/Pages/AddressDetailsPage.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTrash,
  FaFileAlt,
} from "react-icons/fa";
import styles from "./AddressDetailsPage.module.css";
import toast from "react-hot-toast";
import FileUpload from "../components/FileUpload/FileUpload";
import PersonPicker from "../components/PersonPicker/PersonPicker"; // Оновлений імпорт

const AddressDetailsPage = () => {
  const { addressId } = useParams();
  const [addressData, setAddressData] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editedNotes, setEditedNotes] = useState([]);
  const [editedSquareFeet, setEditedSquareFeet] = useState("");
  const [editedMaterial, setEditedMaterial] = useState("");
  const [editedBuilder, setEditedBuilder] = useState("");
  const [editedDate, setEditedDate] = useState("");
  const navigate = useNavigate();

  const fetchAddressDetails = async () => {
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("id", addressId)
      .single();

    if (error) {
      console.error("Error fetching address details:", error);
    } else {
      setAddressData(data);
      setEditedNotes(data.notes || []);
      setEditedSquareFeet(data.square_feet || "");
      setEditedMaterial(data.material || "");
      setEditedBuilder(data.builder || "");
      setEditedDate(data.date || "");
    }
  };

  useEffect(() => {
    fetchAddressDetails();
  }, [addressId]);

  const handleSaveChanges = async () => {
    const updates = {
      notes: editedNotes,
      square_feet: editedSquareFeet ? parseInt(editedSquareFeet, 10) : null,
      material: editedMaterial.trim() || null,
      builder: editedBuilder.trim() || null,
      date: editedDate || null,
    };

    const { data, error } = await supabase
      .from("addresses")
      .update(updates)
      .eq("id", addressId)
      .select()
      .single();

    if (error) {
      console.error("Error saving changes:", error);
      toast.error("Failed to save changes.");
    } else {
      setAddressData(data);
      setIsEditing(false);
      toast.success("Changes saved successfully!");
    }
  };

  const handleAddNote = async () => {
    if (newNote.trim() === "") return;
    const updatedNotes = [...(addressData.notes || []), newNote.trim()];
    await handleSaveChanges({ notes: updatedNotes });
    setNewNote("");
  };

  const handleDeleteNote = async (index) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    const updatedNotes = editedNotes.filter((_, i) => i !== index);
    await handleSaveChanges({ notes: updatedNotes });
  };

  const handleFileUploaded = async (fileUrl) => {
    const updatedFiles = [...(addressData.files || []), fileUrl];
    await handleSaveChanges({ files: updatedFiles });
  };

  const handleFileDelete = async (fileUrl) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    const updatedFiles = addressData.files.filter((file) => file !== fileUrl);
    await handleSaveChanges({ files: updatedFiles });
  };

  const handleWorkersUpdate = async (workers) => {
    const { error } = await supabase
      .from("addresses")
      .update({ workers: workers })
      .eq("id", addressId);
    if (error) {
      console.error("Error updating workers:", error);
      toast.error("Failed to update workers.");
    } else {
      fetchAddressDetails();
      toast.success("Workers updated successfully!");
    }
  };

  if (!addressData) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/addresses")}
        >
          <FaArrowLeft /> Back to Addresses
        </button>
        <h1 className={styles.pageTitle}>{addressData.address}</h1>
        <button
          className={styles.editButton}
          onClick={() => (isEditing ? handleSaveChanges() : setIsEditing(true))}
        >
          {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      <div className={styles.detailsContainer}>
        <div className={styles.detailCard}>
          <div className={styles.detailItem}>
            <p>
              <strong>Date:</strong>
            </p>
            {isEditing ? (
              <input
                type="date"
                value={editedDate}
                onChange={(e) => setEditedDate(e.target.value)}
                className={styles.editInput}
              />
            ) : (
              <p>{addressData.date || "N/A"}</p>
            )}
          </div>
          <div className={styles.detailItem}>
            <p>
              <strong>Builder:</strong>
            </p>
            {isEditing ? (
              <input
                type="text"
                value={editedBuilder}
                onChange={(e) => setEditedBuilder(e.target.value)}
                className={styles.editInput}
              />
            ) : (
              <p>{addressData.builder || "N/A"}</p>
            )}
          </div>
          <div className={styles.detailItem}>
            <p>
              <strong>Square Feet:</strong>
            </p>
            {isEditing ? (
              <input
                type="number"
                value={editedSquareFeet}
                onChange={(e) => setEditedSquareFeet(e.target.value)}
                className={styles.editInput}
              />
            ) : (
              <p>{addressData.square_feet || "N/A"}</p>
            )}
          </div>
          <div className={styles.detailItem}>
            <p>
              <strong>Material:</strong>
            </p>
            {isEditing ? (
              <input
                type="text"
                value={editedMaterial}
                onChange={(e) => setEditedMaterial(e.target.value)}
                className={styles.editInput}
              />
            ) : (
              <p>{addressData.material || "N/A"}</p>
            )}
          </div>
        </div>
      </div>

      <PersonPicker
        addressId={addressId}
        attachedWorkers={addressData.workers || []}
        onWorkersUpdate={handleWorkersUpdate}
      />

      <div className={styles.filesSection}>
        <div className={styles.sectionHeader}>
          <h2>Files & Photos</h2>
          <FileUpload
            bucketName="address-files"
            onUploadSuccess={handleFileUploaded}
          />
        </div>
        {addressData.files && addressData.files.length > 0 ? (
          <ul className={styles.fileList}>
            {addressData.files.map((fileUrl, index) => (
              <li key={index} className={styles.fileItem}>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.fileLink}
                >
                  <FaFileAlt /> {fileUrl.split("/").pop()}
                </a>
                {isEditing && (
                  <button
                    onClick={() => handleFileDelete(fileUrl)}
                    className={styles.deleteFileButton}
                  >
                    <FaTrash />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noFiles}>No files uploaded yet.</p>
        )}
      </div>

      <div className={styles.notesSection}>
        <h2>Notes</h2>
        {!isEditing && (
          <div className={styles.addNoteForm}>
            <input
              type="text"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add new note..."
              className={styles.noteInput}
            />
            <button onClick={handleAddNote} className={styles.addButton}>
              <FaPlus /> Add Note
            </button>
          </div>
        )}
        {editedNotes && editedNotes.length > 0 ? (
          <ul className={styles.notesList}>
            {editedNotes.map((note, index) => (
              <li key={index} className={styles.noteItem}>
                {isEditing ? (
                  <div className={styles.noteEditContainer}>
                    <input
                      type="text"
                      value={note}
                      onChange={(e) => handleNoteChange(index, e.target.value)}
                      className={styles.editNoteInput}
                    />
                    <button
                      onClick={() => handleDeleteNote(index)}
                      className={styles.deleteNoteButton}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ) : (
                  note
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noNotes}>No notes for this address yet.</p>
        )}
      </div>
    </div>
  );
};

export default AddressDetailsPage;
