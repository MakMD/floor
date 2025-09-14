// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./components/App/App";
import "../index.css"; // Залишаємо для глобальних стилів

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
