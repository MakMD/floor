// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import styles from "./AllTablesList.module.css"; // Підключаємо стилі

// const AllTablesList = () => {
//   const [tables, setTables] = useState([]);
//   const [newTableName, setNewTableName] = useState(""); // Для нової таблиці
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchTables = async () => {
//       try {
//         const response = await axios.get(
//           "https://66ac12f3f009b9d5c7310a1a.mockapi.io/tables"
//         );
//         setTables(response.data);
//       } catch (error) {
//         console.error("Error fetching tables:", error);
//       }
//     };

//     fetchTables();
//   }, []);

//   const handleTableClick = (tableName) => {
//     navigate(`/table/${tableName}`);
//   };

//   const handleCreateTable = async () => {
//     if (newTableName.trim() === "") {
//       return; // Не створюємо таблицю з порожнім іменем
//     }

//     try {
//       const newTable = {
//         tables: {
//           [newTableName]: [], // Додаємо нову таблицю з порожніми інвойсами
//         },
//       };

//       const response = await axios.post(
//         "https://66ac12f3f009b9d5c7310a1a.mockapi.io/tables",
//         newTable
//       );
//       setTables([...tables, response.data]); // Додаємо нову таблицю до списку
//       setNewTableName(""); // Очищаємо поле вводу
//     } catch (error) {
//       console.error("Error creating new table:", error);
//     }
//   };

//   return (
//     <div className={styles.tablesContainer}>
//       <h2 className={styles.pageTitle}>Available Tables</h2>

//       {/* Форма для створення нової таблиці */}
//       <div className={styles.createTableForm}>
//         <input
//           type="text"
//           placeholder="Enter new table name"
//           value={newTableName}
//           onChange={(e) => setNewTableName(e.target.value)}
//           className={styles.inputField}
//         />
//         <button
//           onClick={handleCreateTable}
//           className={styles.createTableButton}
//         >
//           Create Table
//         </button>
//       </div>

//       <ul className={styles.tablesList}>
//         {tables.map((tableObj, index) =>
//           Object.keys(tableObj.tables).map((tableName) => (
//             <li
//               key={index}
//               className={styles.tableItem}
//               onClick={() => handleTableClick(tableName)}
//             >
//               {tableName}
//             </li>
//           ))
//         )}
//       </ul>
//     </div>
//   );
// };

// export default AllTablesList;
