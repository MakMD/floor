import { useState } from "react";
import axios from "axios";

const BackupButton = () => {
  const [loading, setLoading] = useState(false);

  // Список компаній, дані яких ми хочемо бекапити
  const companies = [
    { name: "google" },
    { name: "apple" },
    { name: "samsung" },
    { name: "cwp" },
    { name: "amazon" },
    { name: "newCompany" },
    { name: "example" },
  ];

  const handleBackup = async () => {
    setLoading(true);

    try {
      // Бекап даних всіх компаній
      const companyDataPromises = companies.map(async (company) => {
        const response = await axios.get(
          `https://66ac12f3f009b9d5c7310a1a.mockapi.io/${company.name}`
        );
        return { [company.name]: response.data };
      });

      // Бекап даних всіх людей
      const peopleResponse = await axios.get(
        "https://66e3d74dd2405277ed1201b1.mockapi.io/people"
      );

      // Чекаємо на всі запити до компаній
      const companyData = await Promise.all(companyDataPromises);

      // Формуємо загальні дані для бекапу
      const data = {
        companies: companyData,
        people: peopleResponse.data,
      };

      // Викликаємо функцію для завантаження даних на комп'ютер
      downloadBackup(data);
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Failed to fetch data for backup.");
    }

    setLoading(false);
  };

  // Функція для скачування бекапу як JSON файл
  const downloadBackup = (data) => {
    const fileName = `backup-${new Date().toISOString().slice(0, 10)}.json`;
    const json = JSON.stringify(data, null, 2); // Форматуємо як JSON
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      <button onClick={handleBackup} disabled={loading}>
        {loading ? "Backing up..." : "Backup Data"}
      </button>
    </div>
  );
};

export default BackupButton;
