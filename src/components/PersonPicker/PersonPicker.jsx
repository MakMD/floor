// src/components/PersonPicker/PersonPicker.jsx

import React, { useState, useEffect } from "react";
import { supabase } from "../../supabaseClient";
import { FaUserPlus, FaUserMinus } from "react-icons/fa";
import styles from "./PersonPicker.module.css";
import { FaTimes } from "react-icons/fa"; // Імпортуємо іконку для кнопки закриття

const PersonPicker = ({ addressId, attachedWorkers, onWorkersUpdate }) => {
  const [allPeople, setAllPeople] = useState([]);
  const [showPicker, setShowPicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchAllPeople = async () => {
      const { data, error } = await supabase.from("people").select("id, name");
      if (error) {
        console.error("Error fetching people:", error);
      } else {
        setAllPeople(data || []);
      }
    };
    fetchAllPeople();
  }, []);

  const handleToggleWorker = (personId) => {
    const isAttached = attachedWorkers.includes(personId);
    const newWorkersList = isAttached
      ? attachedWorkers.filter((id) => id !== personId)
      : [...attachedWorkers, personId];
    onWorkersUpdate(newWorkersList);
  };

  const getWorkerName = (personId) => {
    const person = allPeople.find((p) => p.id === personId);
    return person ? person.name : "Unknown";
  };

  const availableWorkers = allPeople.filter(
    (person) => !attachedWorkers.includes(person.id)
  );

  const filteredWorkers = availableWorkers.filter((person) =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pickerContainer}>
      <div className={styles.sectionHeader}>
        <h2>Workers</h2>
      </div>

      <div className={styles.attachedWorkers}>
        {attachedWorkers.length > 0 ? (
          attachedWorkers.map((personId) => (
            <div key={personId} className={styles.workerItem}>
              <span>{getWorkerName(personId)}</span>
              <button
                onClick={() => handleToggleWorker(personId)}
                className={styles.detachButton}
              >
                <FaUserMinus />
              </button>
            </div>
          ))
        ) : (
          <p>No workers attached yet.</p>
        )}
      </div>

      <button
        onClick={() => setShowPicker(!showPicker)}
        className={styles.addWorkerButton}
      >
        {showPicker ? (
          "Close Picker"
        ) : (
          <>
            <FaUserPlus /> Add Worker
          </>
        )}
      </button>

      {showPicker && (
        <div className={styles.pickerModal}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search for a worker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button
              onClick={() => setShowPicker(false)}
              className={styles.closePickerButton}
            >
              <FaTimes />
            </button>
          </div>
          <ul className={styles.availableWorkersList}>
            {filteredWorkers.length > 0 ? (
              filteredWorkers.map((person) => (
                <li key={person.id} className={styles.availableWorkerItem}>
                  <span>{person.name}</span>
                  <button
                    onClick={() => handleToggleWorker(person.id)}
                    className={styles.attachButton}
                  >
                    <FaUserPlus /> Attach
                  </button>
                </li>
              ))
            ) : (
              <p>No available workers found.</p>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PersonPicker;
