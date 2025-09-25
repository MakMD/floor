// src/components/AddressFilter/AddressFilter.jsx
import React from "react";
import styles from "./AddressFilter.module.css";

const AddressFilter = ({ onFilterChange, dateFilter, statusFilter }) => {
  const handleDateChange = (e) => {
    onFilterChange("date", e.target.value);
  };

  const handleStatusChange = (e) => {
    onFilterChange("status", e.target.value);
  };

  return (
    <div className={styles.filterContainer}>
      <div className={styles.filterGroup}>
        <label htmlFor="dateFilter">Date</label>
        <select id="dateFilter" value={dateFilter} onChange={handleDateChange}>
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="yesterday">Yesterday</option>
        </select>
      </div>
      <div className={styles.filterGroup}>
        <label htmlFor="statusFilter">Status</label>
        <select
          id="statusFilter"
          value={statusFilter}
          onChange={handleStatusChange}
        >
          <option value="all">All Statuses</option>
          <option value="Ready">Ready</option>
          <option value="In Process">In Process</option>
          <option value="Not Finished">Not Finished</option>
        </select>
      </div>
    </div>
  );
};

export default AddressFilter;
