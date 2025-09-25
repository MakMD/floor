// src/Pages/CalendarPage/CalendarPage.jsx

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  subWeeks,
  addWeeks,
  isSameDay,
  isSameMonth,
} from "date-fns";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { supabase } from "../supabaseClient";
import toast from "react-hot-toast";
import styles from "./CalendarPage.module.css";

const CalendarPage = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const weekStartsOn = 1; // Monday

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      const start = startOfWeek(currentDate, { weekStartsOn });
      const end = endOfWeek(currentDate, { weekStartsOn });

      const { data, error } = await supabase
        .from("addresses")
        .select("*, work_types(payment_amount)")
        .gte("date", format(start, "yyyy-MM-dd"))
        .lte("date", format(end, "yyyy-MM-dd"));

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
      <span className={styles.headerDate}>
        {format(startOfWeek(currentDate, { weekStartsOn }), "d MMM")} -{" "}
        {format(endOfWeek(currentDate, { weekStartsOn }), "d MMM, yyyy")}
      </span>
      <button onClick={nextWeek} className={styles.navButton}>
        <FaChevronRight />
      </button>
    </div>
  );

  const renderDays = () => {
    const days = [];
    const startDate = startOfWeek(currentDate, { weekStartsOn });
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className={styles.dayLabel} key={i}>
          {format(addDays(startDate, i), "EEE")}
        </div>
      );
    }
    return <div className={styles.daysGrid}>{days}</div>;
  };

  const renderCells = () => {
    const startDate = startOfWeek(currentDate, { weekStartsOn });
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      const dateKey = format(day, "yyyy-MM-dd");
      const dayEvents = eventsByDate[dateKey] || [];

      cells.push(
        <div
          className={`${styles.cell} ${
            !isSameMonth(day, currentDate) ? styles.disabled : ""
          } ${isSameDay(day, new Date()) ? styles.today : ""} ${
            isSameDay(day, selectedDate) ? styles.selected : ""
          }`}
          key={day}
          onClick={() => onDateClick(day)}
        >
          <span className={styles.number}>{format(day, "d")}</span>
          {dayEvents.length > 0 && (
            <div className={styles.eventIndicator}>{dayEvents.length}</div>
          )}
          <div className={styles.eventsList}>
            {dayEvents.slice(0, 2).map((event) => {
              const statusClass =
                {
                  "In Process": styles.eventInProgress,
                  Ready: styles.eventReady,
                  "Not Finished": styles.eventNotFinished,
                }[event.status] || "";
              return (
                <div
                  key={event.id}
                  className={`${styles.eventItem} ${statusClass}`}
                >
                  {event.address}
                </div>
              );
            })}
            {dayEvents.length > 2 && (
              <div className={styles.moreEvents}>
                + {dayEvents.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }
    return <div className={styles.daysGrid}>{cells}</div>;
  };

  const renderInfoPanel = () => {
    const eventsForSelectedDay =
      eventsByDate[format(selectedDate, "yyyy-MM-dd")] || [];

    return (
      <div className={styles.infoPanel}>
        <h3>
          Schedule for{" "}
          <span className={styles.panelDate}>
            {format(selectedDate, "EEEE, d MMMM")}
          </span>
        </h3>
        {eventsForSelectedDay.length > 0 ? (
          <ul className={styles.infoList}>
            {eventsForSelectedDay.map((event) => {
              const statusClass =
                {
                  "In Process": styles.statusInProgress,
                  Ready: styles.statusReady,
                  "Not Finished": styles.statusNotFinished,
                }[event.status] || "";

              const statusBorderClass =
                {
                  "In Process": styles.inProcessBorder,
                  Ready: styles.readyBorder,
                  "Not Finished": styles.notFinishedBorder,
                }[event.status] || "";

              return (
                <li
                  key={event.id}
                  className={`${styles.infoItem} ${statusBorderClass}`}
                  onClick={() => navigate(`/address/${event.id}`)}
                >
                  <span className={styles.infoAddress}>{event.address}</span>
                  <span className={`${styles.infoStatus} ${statusClass}`}>
                    {event.status}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className={styles.noEventsMessage}>No projects for this day.</p>
        )}
      </div>
    );
  };

  const onDateClick = (day) => {
    setSelectedDate(day);
  };

  const nextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  const prevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  return (
    <div className={styles.calendarContainer}>
      <h1 className={styles.pageTitle}>Calendar</h1>
      <div className={styles.layout}>
        <div className={styles.mainContent}>
          <div className={styles.calendar}>
            {renderHeader()}
            {renderDays()}
            {loading ? <p>Loading...</p> : renderCells()}
          </div>
          {renderInfoPanel()}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
