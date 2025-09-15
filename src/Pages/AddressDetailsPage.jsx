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

const AddressDetailsPage = () => {
  const { addressId } = useParams();
  const [addressData, setAddressData] = useState(null);
  const [newNote, setNewNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState([]);
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
    }
  };

  useEffect(() => {
    fetchAddressDetails();
  }, [addressId]);

  const handleAddNote = async () => {
    if (newNote.trim() === "") return;

    const updatedNotes = [...(addressData.notes || []), newNote.trim()];

    const { data, error } = await supabase
      .from("addresses")
      .update({ notes: updatedNotes })
      .eq("id", addressId)
      .select()
      .single();

    if (error) {
      console.error("Error adding note:", error);
      toast.error("Error adding note.");
    } else {
      setAddressData(data);
      setEditedNotes(data.notes);
      setNewNote("");
      toast.success("Note added successfully!");
    }
  };

  const handleNoteChange = (index, value) => {
    const updatedNotes = [...editedNotes];
    updatedNotes[index] = value;
    setEditedNotes(updatedNotes);
  };

  const handleDeleteNote = (index) => {
    if (!window.confirm("Are you sure you want to delete this note?")) return;
    const updatedNotes = editedNotes.filter((_, i) => i !== index);
    setEditedNotes(updatedNotes);
    handleSaveChanges({ notes: updatedNotes });
  };

  const handleSaveChanges = async (updates) => {
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
      setEditedNotes(data.notes);
      setIsEditing(false);
      toast.success("Changes saved successfully!");
    }
  };

  const handleFileUploaded = (fileUrl) => {
    const updatedFiles = [...(addressData.files || []), fileUrl];
    handleSaveChanges({ files: updatedFiles });
  };

  const handleFileDelete = (fileUrl) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    const updatedFiles = addressData.files.filter((file) => file !== fileUrl);
    handleSaveChanges({ files: updatedFiles });
    // TODO: Optionally delete from Supabase Storage
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
          onClick={() =>
            isEditing
              ? handleSaveChanges({ notes: editedNotes })
              : setIsEditing(true)
          }
        >
          {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      {addressData.square_feet && (
        <p className={styles.squareFeet}>
          Square Feet: <strong>{addressData.square_feet}</strong>
        </p>
      )}

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
              placeholder="Add new note (e.g., 'Main floor: 1200 sqft')"
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
