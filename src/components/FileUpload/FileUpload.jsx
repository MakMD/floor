// src/components/FileUpload/FileUpload.jsx

import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import styles from "./FileUpload.module.css";
import { FaUpload } from "react-icons/fa";
import toast from "react-hot-toast";

const FileUpload = ({ bucketName, onUploadSuccess }) => {
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    const fileName = `${Date.now()}_${file.name}`;

    // ЗАПИТ: Завантажуємо файл у сховище
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file);

    if (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file.");
    } else {
      // ПОВЕРТАЄМО РЕЗУЛЬТАТ: Замість публічного URL, повертаємо шлях до файлу (path)
      // Це ключ до більш безпечної та гнучкої системи.
      onUploadSuccess(data.path);
      toast.success("File uploaded successfully!");
    }
    setLoading(false);
  };

  return (
    <div className={styles.fileUploadContainer}>
      <label htmlFor="file-upload" className={styles.uploadButton}>
        <FaUpload /> {loading ? "Uploading..." : "Upload File"}
      </label>
      <input
        id="file-upload"
        type="file"
        onChange={handleFileUpload}
        disabled={loading}
        className={styles.fileInput}
      />
    </div>
  );
};

export default FileUpload;
