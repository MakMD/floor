// src/components/Header/Header.jsx
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaProjectDiagram,
  FaUsers,
  FaCalendarAlt,
  FaCog,
  FaSignOutAlt,
  FaSun,
  FaMoon,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Header.module.css";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { userRole, signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Визначення активного посилання
  const getLinkClass = (path) => {
    return location.pathname.startsWith(path)
      ? `${styles.navLink} ${styles.activeLink}`
      : styles.navLink;
  };

  const handleLogout = async () => {
    await signOut();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      {/* Логотип */}
      <Link to="/" className={styles.logoLink} onClick={closeMobileMenu}>
        <img
          src="/Flooring.Boss.svg"
          alt="Flooring Boss Logo"
          className={styles.logo}
        />
      </Link>

      {/* Кнопка відкриття мобільного меню (Гамбургер) */}
      <button className={styles.hamburgerButton} onClick={toggleMobileMenu}>
        <FaBars />
      </button>

      {/* Навігація */}
      <nav
        className={`${styles.nav} ${isMobileMenuOpen ? styles.navMobileOpen : ""}`}
      >
        {/* Шапка мобільного меню (видима тільки на мобільних, коли меню відкрите) */}
        {isMobileMenuOpen && (
          <div className={styles.mobileMenuHeader}>
            <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>Меню</span>
            <button className={styles.closeButton} onClick={closeMobileMenu}>
              <FaTimes />
            </button>
          </div>
        )}

        {/* === ПОСИЛАННЯ ДЛЯ АДМІНІСТРАТОРА === */}
        {userRole === "admin" && (
          <>
            <Link
              to="/addresses"
              className={getLinkClass("/addresses")}
              onClick={closeMobileMenu}
            >
              <FaProjectDiagram />
              Projects
            </Link>
            <Link
              to="/people"
              className={getLinkClass("/people")}
              onClick={closeMobileMenu}
            >
              <FaUsers />
              People
            </Link>
            <Link
              to="/calendar"
              className={getLinkClass("/calendar")}
              onClick={closeMobileMenu}
            >
              <FaCalendarAlt />
              Calendar
            </Link>
            <Link
              to="/admin"
              className={getLinkClass("/admin")}
              onClick={closeMobileMenu}
            >
              <FaCog />
              Admin
            </Link>
          </>
        )}

        {/* === ПОСИЛАННЯ ДЛЯ ПРАЦІВНИКА === */}
        {userRole === "worker" && (
          <div
            className={styles.navLink}
            style={{ cursor: "default", color: "var(--color-primary)" }}
          >
            Особистий кабінет
          </div>
        )}

        {/* Контроли (Тема та Вихід) */}
        <div className={styles.navControls}>
          <button
            onClick={toggleTheme}
            className={styles.logoutButton}
            title="Змінити тему"
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
          </button>
          <button onClick={handleLogout} className={styles.logoutButton}>
            <FaSignOutAlt />
            <span className={styles.desktopOnly}>Log Out</span>
          </button>
        </div>
      </nav>

      {/* Затемнення фону (Оверлей) при відкритому мобільному меню */}
      <div
        className={styles.overlay}
        onClick={closeMobileMenu}
        style={{
          display: isMobileMenuOpen ? "block" : "none",
        }}
      ></div>
    </header>
  );
};

export default Header;
