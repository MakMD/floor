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
      <Link to="/" className={styles.logoLink} onClick={closeMobileMenu}>
        <img
          src="/Flooring.Boss.svg"
          alt="Flooring Boss Logo"
          className={styles.logo}
        />
      </Link>

      <button className={styles.hamburgerButton} onClick={toggleMobileMenu}>
        <FaBars />
      </button>

      <nav
        className={`${styles.nav} ${isMobileMenuOpen ? styles.navMobileOpen : ""}`}
      >
        {isMobileMenuOpen && (
          <div className={styles.mobileMenuHeader}>
            <span
              style={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                color: "var(--color-text-primary)",
              }}
            >
              Меню
            </span>
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
            onClick={() => {
              toggleTheme();
              closeMobileMenu(); // Закриваємо меню після зміни теми для зручності
            }}
            className={styles.logoutButton}
            title="Змінити тему"
          >
            {theme === "light" ? <FaMoon /> : <FaSun />}
            {/* Текст тільки для мобілки */}
            <span className={styles.mobileOnlyText}>
              {theme === "light" ? "Темна тема" : "Світла тема"}
            </span>
          </button>

          <button onClick={handleLogout} className={styles.logoutButton}>
            <FaSignOutAlt />
            <span className={styles.desktopOnly}>Log Out</span>
            {/* Текст тільки для мобілки */}
            <span className={styles.mobileOnlyText}>Вийти з акаунта</span>
          </button>
        </div>
      </nav>

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
