import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isToday,
} from "date-fns";
import {
  FaChevronLeft,
  FaChevronRight,
  FaMapMarkerAlt,
  FaTools,
  FaClock,
  FaRulerCombined,
  FaDollarSign,
} from "react-icons/fa";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import styles from "./CalendarPage.module.css";

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const weekStartsOn = 1; // Понеділок

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const start = startOfWeek(currentDate, { weekStartsOn });
      const end = endOfWeek(currentDate, { weekStartsOn });

      const { data, error } = await supabase
        .from("addresses")
        .select("*, builders(name), stores(name)")
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"))
        .order("service_time", { ascending: true, nullsFirst: false }); // Сортуємо по часу, якщо він є

      if (error) {
        toast.error("Could not fetch calendar events.");
        console.error(error);
      } else {
        setEvents(data || []);
      }
      setLoading(false);
    };
    fetchEvents();
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      const dateKey = event.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [events]);

  const renderHeader = () => (
    <div className={styles.header}>
      <button onClick={prevWeek} className={styles.navButton}>
        <FaChevronLeft />
      </button>
      <div className={styles.headerDateContainer}>
        <span className={styles.headerDate}>
          {format(startOfWeek(currentDate, { weekStartsOn }), "d MMMM")} -{" "}
          {format(endOfWeek(currentDate, { weekStartsOn }), "d MMMM, yyyy")}
        </span>
        <button
          onClick={() => setCurrentDate(new Date())}
          className={styles.todayButton}
        >
          Go to Today
        </button>
      </div>
      <button onClick={nextWeek} className={styles.navButton}>
        <FaChevronRight />
      </button>
    </div>
  );

  const renderVerticalDays = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn });
    const days = [];

    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      const dateKey = format(day, "yyyy-MM-dd");
      const dayEvents = eventsByDate[dateKey] || [];
      const isCurrentDay = isToday(day);

      days.push(
        <div
          key={dateKey}
          className={`${styles.daySection} ${
            isCurrentDay ? styles.isTodaySection : ""
          }`}
        >
          <div className={styles.dayHeader}>
            <div className={styles.dayDateWrap}>
              <span className={styles.dayNumber}>{format(day, "d")}</span>
              <div className={styles.dayTextWrap}>
                <span className={styles.dayName}>{format(day, "EEEE")}</span>
                <span className={styles.dayMonth}>{format(day, "MMMM")}</span>
              </div>
            </div>
            {isCurrentDay && <span className={styles.todayBadge}>Today</span>}
          </div>

          <div className={styles.eventsGrid}>
            {dayEvents.length > 0 ? (
              dayEvents.map((event) => {
                const statusBackgroundClass =
                  {
                    Ready: styles.readyBackground,
                    "In Process": styles.inProcessBackground,
                    "Not Finished": styles.notFinishedBackground,
                  }[event.status] || "";

                const hasFooterInfo =
                  event.sq_ft ||
                  event.total_amount ||
                  (event.project_type === "Service" && event.service_time);

                return (
                  <div
                    key={event.id}
                    className={`${styles.eventCard} ${statusBackgroundClass}`}
                    onClick={() => navigate(`/address/${event.id}`)}
                  >
                    <div className={styles.cardHeader}>
                      <span className={styles.cardWo}>
                        {event.work_order_number
                          ? `WO #${event.work_order_number}`
                          : "No WO"}
                      </span>
                      <span
                        className={`${styles.statusBadge} ${
                          event.status === "Ready"
                            ? styles.badgeReady
                            : event.status === "In Process"
                              ? styles.badgeProcess
                              : styles.badgeNotFinished
                        }`}
                      >
                        {event.status}
                      </span>
                    </div>

                    <div className={styles.cardTitle}>
                      {event.project_type === "Service" ? (
                        <FaTools className={styles.serviceIcon} />
                      ) : (
                        <FaMapMarkerAlt className={styles.addressIcon} />
                      )}
                      <span>{event.address}</span>
                    </div>

                    <div className={styles.cardMeta}>
                      {event.builders?.name && (
                        <span>
                          <strong>B:</strong> {event.builders.name}
                        </span>
                      )}
                      {event.stores?.name && (
                        <span>
                          <strong>S:</strong> {event.stores.name}
                        </span>
                      )}
                    </div>

                    {/* Інформативний футер, показуємо тільки якщо є дані */}
                    {hasFooterInfo && (
                      <div className={styles.cardFooter}>
                        {event.project_type === "Service" &&
                          event.service_time && (
                            <div className={styles.footerTag}>
                              <FaClock /> {event.service_time}
                            </div>
                          )}
                        {event.sq_ft && (
                          <div className={styles.footerTag}>
                            <FaRulerCombined /> {event.sq_ft} sq ft
                          </div>
                        )}
                        {event.total_amount && (
                          <div className={styles.footerTag}>
                            <FaDollarSign /> {event.total_amount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className={styles.noEvents}>No projects for this day.</div>
            )}
          </div>
        </div>,
      );
    }

    return <div className={styles.verticalList}>{days}</div>;
  };

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

  return (
    <div className={styles.calendarContainer}>
      <h1 className={styles.pageTitle}>Schedule</h1>
      <div className={styles.layout}>
        <div className={styles.calendar}>
          {renderHeader()}
          {loading ? (
            <p className={styles.loadingText}>Loading...</p>
          ) : (
            renderVerticalDays()
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
