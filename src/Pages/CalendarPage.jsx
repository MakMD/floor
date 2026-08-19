import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
} from "date-fns";
import {
  FaChevronLeft,
  FaChevronRight,
  FaSyncAlt,
  FaRegCalendarAlt,
  FaRegCalendar,
  FaMapMarkerAlt,
} from "react-icons/fa";
// Використовуємо тонкий шеврон для карток
import { MdOutlineChevronRight } from "react-icons/md";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import styles from "./CalendarPage.module.css";

const CalendarPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("day"); // 'day' або 'week'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const weekStartsOn = 1; // Понеділок

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

  const handleNext = () => {
    if (viewMode === "day") setSelectedDate((prev) => addDays(prev, 1));
    else setSelectedDate((prev) => addWeeks(prev, 1));
  };

  const handlePrev = () => {
    if (viewMode === "day") setSelectedDate((prev) => subDays(prev, 1));
    else setSelectedDate((prev) => subWeeks(prev, 1));
  };

  const handleConfirmMaterials = (e, id) => {
    e.stopPropagation();
    toast.success(`Materials confirmed for Job #${id}`);
  };

  // Групування подій
  const groupedEvents = events.reduce((acc, event) => {
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
        {/* --- НАВІГАЦІЙНА ПАНЕЛЬ ЯК НА СКРІНШОТІ --- */}
        <div className={styles.navbar}>
          <div className={styles.navGroup}>
            <button onClick={handlePrev} className={styles.iconBtn}>
              <FaChevronLeft size={14} />
            </button>

            <div className={styles.datePicker}>
              <span className={styles.dateText}>{getHeaderText()}</span>
              <FaRegCalendarAlt className={styles.calendarIcon} size={16} />
            </div>

            <button onClick={handleNext} className={styles.iconBtn}>
              <FaChevronRight size={14} />
            </button>
            <button onClick={fetchEvents} className={styles.iconBtn}>
              <FaSyncAlt size={14} />
            </button>
          </div>

          <div className={styles.navGroup}>
            <button
              onClick={() => setViewMode("day")}
              className={`${styles.iconBtn} ${viewMode === "day" ? styles.activeViewBtn : ""}`}
            >
              <FaRegCalendar size={16} />
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`${styles.iconBtn} ${viewMode === "week" ? styles.activeViewBtn : ""}`}
            >
              <FaRegCalendarAlt size={16} />
            </button>
          </div>
        </div>

        {/* --- КОНТЕНТ --- */}
        <div className={styles.content}>
          {loading ? (
            <p className={styles.loadingText}>Loading schedule...</p>
          ) : datesToRender.length === 0 ? (
            <div className={styles.noEvents}>No projects for this period.</div>
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
                    {/* СЕРВІСИ */}
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

                    {/* РОБОТИ (JOBS) */}
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

                    {/* Порожній день (тільки для Day View) */}
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
