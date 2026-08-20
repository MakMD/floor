import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
  FaRegCalendarAlt,
  FaRegCalendar,
  FaMapMarkerAlt,
  FaSearch,
} from "react-icons/fa";
import { MdOutlineChevronRight } from "react-icons/md";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import styles from "./CalendarPage.module.css";

const STORAGE_KEY = "calendar_state";
const EXPIRATION_TIME = 3 * 60 * 1000;

const CalendarPage = () => {
  // --- СТАНИ ---
  const [selectedDate, setSelectedDate] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < EXPIRATION_TIME) {
          return new Date(parsed.selectedDate);
        }
      }
    } catch (e) {
      console.error("Помилка читання збереженої дати:", e);
    }
    return new Date();
  });

  const [viewMode, setViewMode] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Date.now() - parsed.timestamp < EXPIRATION_TIME) {
          return parsed.viewMode || "day";
        }
      }
    } catch (e) {}
    return "day";
  });

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Стан для індикаторів у випадаючому календарі
  const [calendarMonth, setCalendarMonth] = useState(selectedDate);
  const [monthEvents, setMonthEvents] = useState([]);

  const navigate = useNavigate();
  const weekStartsOn = 1;

  // --- ЕФЕКТИ ---
  useEffect(() => {
    const stateToSave = {
      selectedDate: selectedDate.toISOString(),
      viewMode,
      timestamp: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [selectedDate, viewMode]);

  // Завантаження подій для списку (День/Тиждень)
  const fetchEvents = async () => {
    setLoading(true);

    let startDate, endDate;
    if (viewMode === "day") {
      startDate = format(selectedDate, "yyyy-MM-dd");
      endDate = format(selectedDate, "yyyy-MM-dd");
    } else {
      startDate = format(
        startOfWeek(selectedDate, { weekStartsOn }),
        "yyyy-MM-dd",
      );
      endDate = format(endOfWeek(selectedDate, { weekStartsOn }), "yyyy-MM-dd");
    }

    const { data, error } = await supabase
      .from("addresses")
      .select("*, builders(name), stores(name)")
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: true })
      .order("service_time", { ascending: true, nullsFirst: false });

    if (error) {
      toast.error("Could not fetch calendar events.");
      console.error(error);
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedDate, viewMode]);

  // Легке завантаження подій для відображення крапок-індикаторів у всьому місяці
  useEffect(() => {
    const fetchMonthEvents = async () => {
      const start = format(startOfMonth(calendarMonth), "yyyy-MM-dd");
      const end = format(endOfMonth(calendarMonth), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("addresses")
        .select("date, status")
        .gte("date", start)
        .lte("date", end);

      if (!error && data) {
        setMonthEvents(data);
      }
    };
    fetchMonthEvents();
  }, [calendarMonth]);

  // --- ЛОГІКА ІНДИКАТОРІВ (КРАПОК) ---
  const getDayStatus = (date) => {
    if (!monthEvents || monthEvents.length === 0) return null;

    const formattedDate = format(date, "yyyy-MM-dd");
    const jobsOnDay = monthEvents.filter((job) => job.date === formattedDate);

    if (jobsOnDay.length === 0) return null;

    // Якщо хоча б одна робота НЕ "Ready" і НЕ "Completed" — світимо червоним
    const hasUnfinished = jobsOnDay.some(
      (job) => job.status !== "Ready" && job.status !== "Completed",
    );

    return hasUnfinished ? "red" : "green";
  };

  const renderDayContents = (day, date) => {
    const status = getDayStatus(date);
    return (
      <div className={styles.dateCell}>
        <span>{day}</span>
        {status && (
          <div
            className={`${styles.indicator} ${
              status === "red" ? styles.indicatorRed : styles.indicatorGreen
            }`}
          />
        )}
      </div>
    );
  };

  // --- НАВІГАЦІЯ ---
  const handleNext = () => {
    const newDate =
      viewMode === "day" ? addDays(selectedDate, 1) : addWeeks(selectedDate, 1);
    setSelectedDate(newDate);
    setCalendarMonth(newDate);
  };

  const handlePrev = () => {
    const newDate =
      viewMode === "day" ? subDays(selectedDate, 1) : subWeeks(selectedDate, 1);
    setSelectedDate(newDate);
    setCalendarMonth(newDate);
  };

  const handleConfirmMaterials = (e, id) => {
    e.stopPropagation();
    toast.success(`Materials confirmed for Job #${id}`);
  };

  // --- ФІЛЬТРАЦІЯ ПОДІЙ ЗА ПОШУКОМ ---
  const filteredEvents = events.filter((event) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const address = (event.address || "").toLowerCase();
    const builder = (event.builders?.name || "").toLowerCase();
    // Виправлено краш: перетворюємо число на рядок перед toLowerCase()
    const wo = String(event.work_order_number || "").toLowerCase();

    return (
      address.includes(query) || builder.includes(query) || wo.includes(query)
    );
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    if (!acc[event.date]) acc[event.date] = { services: [], jobs: [] };
    if (event.project_type === "Service") acc[event.date].services.push(event);
    else acc[event.date].jobs.push(event);
    return acc;
  }, {});

  const datesToRender =
    Object.keys(groupedEvents).length > 0
      ? Object.keys(groupedEvents).sort()
      : viewMode === "day"
        ? [format(selectedDate, "yyyy-MM-dd")]
        : [];

  const getHeaderText = () => {
    if (viewMode === "day") return format(selectedDate, "MM/dd/yyyy");
    const start = startOfWeek(selectedDate, { weekStartsOn });
    const end = endOfWeek(selectedDate, { weekStartsOn });
    return `${format(start, "MM/dd")} - ${format(end, "MM/dd")}`;
  };

  return (
    <div className={styles.calendarContainer}>
      <div className={styles.mobileLayout}>
        {/* --- ЛИПКА НАВІГАЦІЯ --- */}
        <div className={styles.navbar}>
          <div className={styles.navTopRow}>
            {/* ВСІ КНОПКИ ЗГРУПОВАНІ ЗЛІВА */}
            <div className={styles.navGroup}>
              <button onClick={handlePrev} className={styles.iconBtn}>
                <FaChevronLeft size={14} />
              </button>

              {/* ВИПАДАЮЧИЙ КАЛЕНДАР */}
              <DatePicker
                selected={selectedDate}
                onChange={(date) => {
                  setSelectedDate(date);
                  setCalendarMonth(date);
                }}
                onMonthChange={(date) => setCalendarMonth(date)}
                customInput={
                  <button className={styles.datePickerBtn}>
                    {getHeaderText()}
                    <FaRegCalendarAlt
                      size={16}
                      style={{ marginLeft: "8px", color: "#666" }}
                    />
                  </button>
                }
                renderDayContents={renderDayContents}
                calendarClassName={styles.customCalendar}
              />

              <button onClick={handleNext} className={styles.iconBtn}>
                <FaChevronRight size={14} />
              </button>
              <button onClick={fetchEvents} className={styles.iconBtn}>
                <FaSyncAlt size={14} />
              </button>

              {/* ПЕРЕМИКАЧІ ВИГЛЯДУ ПЕРЕНЕСЕНО СЮДИ */}
              <button
                onClick={() => setViewMode("day")}
                className={`${styles.iconBtn} ${viewMode === "day" ? styles.activeViewBtn : ""}`}
                title="Day View"
              >
                <FaRegCalendar size={16} />
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`${styles.iconBtn} ${viewMode === "week" ? styles.activeViewBtn : ""}`}
                title="Week View"
              >
                <FaRegCalendarAlt size={16} />
              </button>
            </div>
          </div>

          {/* ПОШУКОВИЙ РЯДОК */}
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Шукати адресу, клієнта або WO..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.content}>
          {loading ? (
            <p className={styles.loadingText}>Loading schedule...</p>
          ) : datesToRender.length === 0 ? (
            <div className={styles.noEvents}>
              {searchQuery
                ? "Нічого не знайдено за вашим запитом."
                : "No projects for this period."}
            </div>
          ) : (
            <div className={styles.listContainer}>
              {datesToRender.map((dateKey) => {
                const dayData = groupedEvents[dateKey] || {
                  services: [],
                  jobs: [],
                };
                const displayDate = format(
                  new Date(dateKey + "T00:00:00"),
                  "dd MMM yyyy",
                );

                return (
                  <div key={dateKey} className={styles.dayGroup}>
                    {dayData.services.length > 0 && (
                      <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                          {displayDate} - Services ({dayData.services.length})
                        </div>
                        <div className={styles.cardsList}>
                          {dayData.services.map((event) => (
                            <div
                              key={event.id}
                              className={styles.card}
                              onClick={() => navigate(`/address/${event.id}`)}
                            >
                              <div className={styles.cardContent}>
                                <div className={styles.cardTitle}>
                                  Service: {event.work_order_number || "N/A"} -{" "}
                                  {event.builders?.name || "Unknown Builder"}
                                  {event.service_time
                                    ? ` - ${event.service_time}`
                                    : ""}
                                </div>
                                <div className={styles.cardAddress}>
                                  <FaMapMarkerAlt className={styles.pinIcon} />
                                  <span>{event.address}</span>
                                </div>
                                {event.notes && (
                                  <div className={styles.cardNotes}>
                                    {event.notes}
                                  </div>
                                )}
                              </div>
                              <MdOutlineChevronRight
                                className={styles.chevronIcon}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayData.jobs.length > 0 && (
                      <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                          {displayDate} - Jobs ({dayData.jobs.length})
                        </div>
                        <div className={styles.cardsList}>
                          {dayData.jobs.map((event) => (
                            <div
                              key={event.id}
                              className={styles.card}
                              onClick={() => navigate(`/address/${event.id}`)}
                            >
                              <div className={styles.cardContent}>
                                <div className={styles.cardTitle}>
                                  Job Id: {event.work_order_number || "N/A"} -{" "}
                                  {event.builders?.name || "Unknown Builder"}
                                </div>
                                <div className={styles.cardAddress}>
                                  <FaMapMarkerAlt className={styles.pinIcon} />
                                  <span>{event.address}</span>
                                </div>
                                <button
                                  className={styles.confirmBtn}
                                  onClick={(e) =>
                                    handleConfirmMaterials(e, event.id)
                                  }
                                >
                                  Confirm Materials
                                </button>
                              </div>
                              <MdOutlineChevronRight
                                className={styles.chevronIcon}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {dayData.services.length === 0 &&
                      dayData.jobs.length === 0 && (
                        <div className={styles.noEvents}>
                          No projects for {displayDate}.
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
