import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
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
  FaBell,
  FaCheckDouble,
} from "react-icons/fa";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import styles from "./Header.module.css";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, userRole, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Стейт для сповіщень
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

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
    setIsNotifOpen(false);
  };

  // Завантаження сповіщень
  useEffect(() => {
    if (!user || userRole !== "admin") return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50); // Показуємо останні 50
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.is_read).length);
      }
    };

    fetchNotifications();

    // Підписка на оновлення в реальному часі (Real-time)
    const subscription = supabase
      .channel("admin_notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications(); // Оновлюємо список, коли БД змінюється
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, userRole]);

  // Закриття оверлею при кліку за його межами
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id, link) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setIsNotifOpen(false);
    closeMobileMenu();
    if (link) navigate(link);
  };

  const markAllAsRead = async () => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
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

        {/* Контроли (Сповіщення та Вихід) */}
        <div className={styles.navControls}>
          {/* === ДЗВІНОЧОК СПОВІЩЕНЬ (Тільки для Адміна) === */}
          {userRole === "admin" && (
            <div className={styles.notifContainer} ref={notifRef}>
              <button
                className={styles.notifButton}
                onClick={() => setIsNotifOpen(!isNotifOpen)}
              >
                <FaBell />
                <span className={styles.mobileOnlyText}>Сповіщення</span>
                {unreadCount > 0 && (
                  <span className={styles.notifBadge}>{unreadCount}</span>
                )}
              </button>

              {/* ВИПАДАЮЧЕ ВІКНО СПОВІЩЕНЬ */}
              {isNotifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span className={styles.notifTitle}>Сповіщення</span>
                    {unreadCount > 0 && (
                      <button
                        className={styles.markAllBtn}
                        onClick={markAllAsRead}
                      >
                        <FaCheckDouble /> Прочитати все
                      </button>
                    )}
                  </div>
                  <div className={styles.notifList}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyNotif}>
                        Немає нових сповіщень
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`${styles.notifItem} ${
                            !n.is_read ? styles.notifUnread : ""
                          }`}
                          onClick={() => markAsRead(n.id, n.link)}
                        >
                          <div className={styles.notifItemTitleRow}>
                            <span className={styles.notifItemTitle}>
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <span className={styles.unreadDot}></span>
                            )}
                          </div>
                          <p className={styles.notifItemMessage}>{n.message}</p>
                          <span className={styles.notifItemDate}>
                            {new Date(n.created_at).toLocaleString("uk-UA", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <button onClick={handleLogout} className={styles.logoutButton}>
            <FaSignOutAlt />
            <span className={styles.desktopOnly}>Log Out</span>
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
