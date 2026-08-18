// src/components/PhotoUploader/PhotoUploader.jsx
import { useState } from "react";
import { supabase } from "../../supabaseClient";
import { FaCamera, FaSpinner } from "react-icons/fa";
import styles from "./PhotoUploader.module.css";

const PhotoUploader = ({ label, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState([]);

  const uploadFiles = async (event) => {
    try {
      setUploading(true);
      const files = Array.from(event.target.files);
      const urls = [];

      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("worker-photos")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("worker-photos")
          .getPublicUrl(fileName);

        urls.push(data.publicUrl);
      }

      const newUrls = [...uploadedUrls, ...urls];
      setUploadedUrls(newUrls);
      onUploadComplete(newUrls);
    } catch (error) {
      console.error("Помилка завантаження фото:", error.message);
      alert("Не вдалося завантажити фото.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (indexToRemove) => {
    const newUrls = uploadedUrls.filter((_, index) => index !== indexToRemove);
    setUploadedUrls(newUrls);
    onUploadComplete(newUrls);
  };

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>

      <input
        type="file"
        multiple
        accept="image/*"
        capture="environment"
        onChange={uploadFiles}
        disabled={uploading}
        className={styles.hiddenInput}
        id={`upload-${label}`}
      />

      <label htmlFor={`upload-${label}`} className={styles.uploadButton}>
        {uploading ? (
          <FaSpinner className="spin" size={20} />
        ) : (
          <FaCamera size={20} />
        )}
        {uploading ? "Завантаження..." : "Зробити фото / Обрати"}
      </label>

      {uploadedUrls.length > 0 && (
        <div className={styles.previewContainer}>
          {uploadedUrls.map((url, index) => (
            <div key={index} className={styles.previewWrapper}>
              <img src={url} alt="preview" className={styles.previewImage} />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className={styles.deleteButton}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoUploader;
