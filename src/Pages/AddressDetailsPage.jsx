// src/Pages/AddressDetailsPage.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import styles from "./AddressDetailsPage.module.css";

const AddressDetailsPage = () => {
  const { addressId } = useParams();
  const [addressData, setAddressData] = useState(null);
  const [newNote, setNewNote] = useState("");
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
    } else {
      setAddressData(data);
      setNewNote("");
    }
  };

  if (!addressData) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.pageContainer}>
      <button
        className={styles.backButton}
        onClick={() => navigate("/addresses")}
      >
        Back to Addresses
      </button>
      <h1 className={styles.pageTitle}>{addressData.address}</h1>

      <div className={styles.notesSection}>
        <h2>Notes</h2>
        <div className={styles.addNoteForm}>
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Add new note (e.g., 'Main floor: 1200 sqft')"
            className={styles.noteInput}
          />
          <button onClick={handleAddNote} className={styles.addButton}>
            Add Note
          </button>
        </div>

        {addressData.notes && addressData.notes.length > 0 ? (
          <ul className={styles.notesList}>
            {addressData.notes.map((note, index) => (
              <li key={index} className={styles.noteItem}>
                {note}
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
