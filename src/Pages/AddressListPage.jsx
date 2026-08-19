// src/Pages/AddressListPage.jsx
import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAdminLists } from "../hooks/useAdminLists";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import AddressFilter from "../components/AddressFilter/AddressFilter";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTrash,
  FaMapMarkerAlt,
  FaTools,
  FaClock,
  FaExclamationTriangle,
  FaDollarSign,
  FaFilter,
} from "react-icons/fa";
import styles from "./AddressListPage.module.css";
import commonStyles from "../styles/common.module.css";
import toast from "react-hot-toast";
import { format, addDays, subDays, parseISO } from "date-fns";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const StatusIndicator = ({ status }) => {
  const statusConfig = {
    Ready: {
      icon: <FaCheck />,
      className: styles.statusReady,
    },
    "In Process": {
      icon: <FaClock />,
      className: styles.statusInProgress,
    },
    "Not Finished": {
      icon: <FaExclamationTriangle />,
      className: styles.statusNotFinished,
    },
  }[status];

  if (!statusConfig) {
    return null;
  }

  return (
    <div className={`${styles.statusIndicator} ${statusConfig.className}`}>
      {statusConfig.icon}
      <span>{status}</span>
    </div>
  );
};

const AddProjectSchema = Yup.object().shape({
  project_type: Yup.string().required("Project type is required"),
  address: Yup.string()
    .trim()
    .min(3, "Address must be at least 3 characters")
    .required("Address or Service Name is required"),
  date: Yup.date().required("Date is required"),
  time: Yup.string().when("project_type", {
    is: "Service",
    then: (schema) => schema.required("Time is required for services"),
    otherwise: (schema) => schema.notRequired(),
  }),
  total_amount: Yup.number().nullable(),
  sq_ft: Yup.number().nullable(),
  store_id: Yup.number().nullable(),
  builder_id: Yup.number().nullable(),
});

const AddressListPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 40;

  const { builders, stores, products, loading: listsLoading } = useAdminLists();

  const navigate = useNavigate();
  const location = useLocation();

  const [searchTerm, setSearchTerm] = useState(
    location.state?.searchTerm || "",
  );
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  const [dateFilter, setDateFilter] = useState(
    location.state?.dateFilter || "all",
  );
  const [statusFilter, setStatusFilter] = useState(
    location.state?.statusFilter || "all",
  );
  const [builderFilter, setBuilderFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");

  const [isEditing, setIsEditing] = useState(false);
  const [editedAddresses, setEditedAddresses] = useState({});

  // Дебаунс для пошуку (затримка перед запитом на сервер)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAddresses = async (pageNumber = 1, reset = false) => {
    setAddressesLoading(true);
    const from = (pageNumber - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    // Базовий запит
    let query = supabase
      .from("addresses")
      .select("*, builders(name), stores(name), work_orders(*)", {
        count: "exact",
      })
      .eq("is_deleted", false)
      .order("date", { ascending: false, nullsLast: true });

    // СЕРВЕРНА ФІЛЬТРАЦІЯ (замість клієнтської)
    if (debouncedSearch) {
      query = query.ilike("address", `%${debouncedSearch}%`);
    }
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (builderFilter !== "all") {
      query = query.eq("builder_id", builderFilter);
    }
    if (storeFilter !== "all") {
      query = query.eq("store_id", storeFilter);
    }

    // Серверна фільтрація дат
    if (dateFilter === "today") {
      query = query.eq("date", format(new Date(), "yyyy-MM-dd"));
    } else if (dateFilter === "tomorrow") {
      query = query.eq("date", format(addDays(new Date(), 1), "yyyy-MM-dd"));
    } else if (dateFilter === "yesterday") {
      query = query.eq("date", format(subDays(new Date(), 1), "yyyy-MM-dd"));
    }

    // Запит з пагінацією
    const { data, error, count } = await query.range(from, to);

    if (error) {
      toast.error(`Error fetching projects: ${error.message}`);
    } else {
      let newItems = data || [];

      // Клієнтська фільтрація по продуктах (оскільки фільтрувати по вкладених масивах work_orders на сервері складно без RPC)
      if (productFilter !== "all") {
        newItems = newItems.filter(
          (item) =>
            item.work_orders &&
            item.work_orders.some(
              (wo) => wo.product_id?.toString() === productFilter,
            ),
        );
      }

      if (reset) {
        setAddresses(newItems);
      } else {
        setAddresses((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const filteredNew = newItems.filter((i) => !existingIds.has(i.id));
          return [...prev, ...filteredNew];
        });
      }

      if (count !== null) {
        setHasMore(from + (data?.length || 0) < count);
      } else {
        setHasMore((data?.length || 0) === PAGE_SIZE);
      }
    }
    setAddressesLoading(false);
  };

  // Перезавантажуємо дані з першої сторінки при зміні будь-якого фільтра
  useEffect(() => {
    setPage(1);
    fetchAddresses(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedSearch,
    dateFilter,
    statusFilter,
    builderFilter,
    storeFilter,
    productFilter,
  ]);

  const refetch = () => {
    setPage(1);
    fetchAddresses(1, true);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchAddresses(nextPage, false);
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === "date") setDateFilter(value);
    else if (filterType === "status") setStatusFilter(value);
  };

  // Групування дат залишається клієнтським, але воно тепер працює з коректно відфільтрованим на сервері масивом
  const groupedAddresses = useMemo(() => {
    const todayList = [];
    const tomorrowList = [];
    const upcomingMap = {};
    const pastMap = {};

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    const tomorrowDate = new Date(todayDate);
    tomorrowDate.setDate(todayDate.getDate() + 1);

    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(todayDate.getDate() - 1);

    addresses.forEach((item) => {
      if (!item.date) return;

      const dateOnly = new Date(parseISO(item.date));
      dateOnly.setHours(0, 0, 0, 0);

      if (dateOnly.getTime() === todayDate.getTime()) {
        todayList.push(item);
      } else if (dateOnly.getTime() === tomorrowDate.getTime()) {
        tomorrowList.push(item);
      } else if (dateOnly > tomorrowDate) {
        const dayAfterTomorrow = new Date(tomorrowDate);
        dayAfterTomorrow.setDate(tomorrowDate.getDate() + 1);

        const diffTime = dateOnly.getTime() - dayAfterTomorrow.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);

        const startChunk = new Date(dayAfterTomorrow);
        startChunk.setDate(dayAfterTomorrow.getDate() + weekIndex * 7);
        const endChunk = new Date(startChunk);
        endChunk.setDate(startChunk.getDate() + 6);

        const key = startChunk.getTime().toString();
        if (!upcomingMap[key])
          upcomingMap[key] = { start: startChunk, end: endChunk, items: [] };
        upcomingMap[key].items.push(item);
      } else if (dateOnly < todayDate) {
        const diffTime = yesterdayDate.getTime() - dateOnly.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const weekIndex = Math.floor(diffDays / 7);

        const endChunk = new Date(yesterdayDate);
        endChunk.setDate(yesterdayDate.getDate() - weekIndex * 7);
        const startChunk = new Date(endChunk);
        startChunk.setDate(endChunk.getDate() - 6);

        const key = endChunk.getTime().toString();
        if (!pastMap[key])
          pastMap[key] = { start: startChunk, end: endChunk, items: [] };
        pastMap[key].items.push(item);
      }
    });

    const formatDate = (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const upcomingChunks = Object.values(upcomingMap)
      .sort((a, b) => a.start - b.start)
      .map((chunk) => ({
        label: `${formatDate(chunk.start)} - ${formatDate(chunk.end)}`,
        items: chunk.items,
      }));

    const pastChunks = Object.values(pastMap)
      .sort((a, b) => b.end - a.end)
      .map((chunk) => ({
        label: `${formatDate(chunk.start)} - ${formatDate(chunk.end)}`,
        items: chunk.items.sort(
          (i1, i2) => parseISO(i2.date) - parseISO(i1.date),
        ),
      }));

    return {
      today: todayList,
      tomorrow: tomorrowList,
      upcoming: upcomingChunks,
      past: pastChunks,
    };
  }, [addresses]);

  const handleAddAddress = async (values, { setSubmitting, resetForm }) => {
    const newAddressObject = {
      address: values.address.trim(),
      date: values.date,
      total_amount: values.total_amount
        ? parseFloat(values.total_amount)
        : null,
      sq_ft: values.sq_ft ? parseFloat(values.sq_ft) : null,
      store_id: values.store_id ? parseInt(values.store_id) : null,
      builder_id: values.builder_id ? parseInt(values.builder_id) : null,
      status: "In Process",
      project_type: values.project_type,
      service_time: values.project_type === "Service" ? values.time : null,
    };

    const { error } = await supabase
      .from("addresses")
      .insert([newAddressObject]);

    if (error) {
      toast.error(`Error adding address: ${error.message}`);
    } else {
      toast.success("Project added successfully!");
      resetForm();
      refetch();
    }
    setSubmitting(false);
  };

  const handleUpdateAddressName = async (id, newName) => {
    if (!newName || newName.trim() === "") {
      toast.error("Address name cannot be empty.");
      setEditedAddresses((prev) => ({
        ...prev,
        [id]: addresses.find((a) => a.id === id).address,
      }));
      return;
    }
    const { error } = await supabase
      .from("addresses")
      .update({ address: newName.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update address name.");
    } else {
      toast.success("Address name updated successfully!");
      refetch();
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;
    const { error } = await supabase
      .from("addresses")
      .update({ is_deleted: true })
      .eq("id", id);
    if (error) {
      toast.error("Failed to delete address.");
    } else {
      toast.success("Address deleted successfully!");
      refetch();
    }
  };

  const handleNameChange = (id, value) => {
    setEditedAddresses((prev) => ({ ...prev, [id]: value }));
  };

  const handleAddressClick = (id) => {
    if (isEditing) return;
    navigate(`/address/${id}`, {
      state: { searchTerm, dateFilter, statusFilter },
    });
  };

  const renderAddressList = (list) => (
    <ul className={styles.addressList}>
      {list.map((item) => {
        const statusBackgroundClass =
          {
            Ready: styles.readyBackground,
            "In Process": styles.inProcessBackground,
            "Not Finished": styles.notFinishedBackground,
          }[item.status] || "";

        return (
          <li
            key={item.id}
            className={`${styles.addressItem} ${isEditing ? styles.editing : ""} ${statusBackgroundClass}`}
            onClick={() => handleAddressClick(item.id)}
          >
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={editedAddresses[item.id] || item.address}
                  onChange={(e) => handleNameChange(item.id, e.target.value)}
                  onBlur={() =>
                    handleUpdateAddressName(item.id, editedAddresses[item.id])
                  }
                  onClick={(e) => e.stopPropagation()}
                  className={styles.editInput}
                />
                <button
                  className={commonStyles.buttonIcon}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAddress(item.id);
                  }}
                >
                  <FaTrash />
                </button>
              </>
            ) : (
              <>
                <div className={styles.itemContent}>
                  <div className={styles.typeIcon}>
                    {item.project_type === "Service" ? (
                      <FaTools title="Service" />
                    ) : (
                      <FaMapMarkerAlt title="Address" />
                    )}
                  </div>
                  <div className={styles.itemDetails}>
                    <span className={styles.addressName}>{item.address}</span>
                    <div className={styles.itemMeta}>
                      {item.work_order_number && (
                        <span>WO: #{item.work_order_number}</span>
                      )}
                      {item.builders?.name && (
                        <span>Builder: {item.builders.name}</span>
                      )}
                      {item.stores?.name && (
                        <span>Store: {item.stores.name}</span>
                      )}
                      {item.date && <span>Date: {item.date}</span>}
                    </div>
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <button
                    type="button"
                    className={commonStyles.buttonIcon}
                    style={{
                      color: item.is_paid ? "#10b981" : "#9ca3af",
                      fontSize: "1.2rem",
                      cursor: "pointer",
                      background: "none",
                      border: "none",
                      padding: "4px",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toast("Invoice Payment tracking coming soon!");
                    }}
                    title="Invoice Payment Status"
                  >
                    <FaDollarSign />
                  </button>
                  <StatusIndicator status={item.status} />
                </div>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <button
          className={commonStyles.buttonSecondary}
          onClick={() => navigate("/")}
        >
          <FaArrowLeft /> Back to Main
        </button>
        <h1 className={styles.pageTitle}>Projects</h1>
        <div className={styles.controls}>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={
              isEditing
                ? commonStyles.buttonSuccess
                : commonStyles.buttonPrimary
            }
          >
            {isEditing ? <FaCheck /> : <FaEdit />} {isEditing ? "Done" : "Edit"}
          </button>
        </div>
      </div>

      <div className={styles.addFormSection}>
        <h3>Create New Project</h3>
        <Formik
          initialValues={{
            project_type: "Address",
            store_id: "",
            builder_id: "",
            address: "",
            date: "",
            time: "",
            sq_ft: "",
            total_amount: "",
          }}
          validationSchema={AddProjectSchema}
          onSubmit={handleAddAddress}
        >
          {({ isSubmitting, values }) => (
            <Form className={styles.addForm}>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="project_type">Project Type</label>
                  <Field as="select" id="project_type" name="project_type">
                    <option value="Address">Address</option>
                    <option value="Service">Service</option>
                  </Field>
                  <ErrorMessage
                    name="project_type"
                    component="div"
                    className={styles.errorMessage}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="store_id">Store</label>
                  <Field
                    as="select"
                    id="store_id"
                    name="store_id"
                    disabled={listsLoading}
                  >
                    <option value="">Select a store</option>
                    {stores?.map((store) => (
                      <option key={store.id} value={store.id}>
                        {store.name}
                      </option>
                    ))}
                  </Field>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="builder_id">Builder</label>
                  <Field
                    as="select"
                    id="builder_id"
                    name="builder_id"
                    disabled={listsLoading}
                  >
                    <option value="">Select a builder</option>
                    {builders?.map((builder) => (
                      <option key={builder.id} value={builder.id}>
                        {builder.name}
                      </option>
                    ))}
                  </Field>
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="address">Address / Service Name</label>
                  <Field
                    id="address"
                    type="text"
                    name="address"
                    placeholder="Job site address or service name"
                  />
                  <ErrorMessage
                    name="address"
                    component="div"
                    className={styles.errorMessage}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="date">Date</label>
                  <Field id="date" type="date" name="date" />
                  <ErrorMessage
                    name="date"
                    component="div"
                    className={styles.errorMessage}
                  />
                </div>
                {values.project_type === "Service" && (
                  <div className={styles.inputGroup}>
                    <label htmlFor="time">Time</label>
                    <Field id="time" type="time" name="time" />
                    <ErrorMessage
                      name="time"
                      component="div"
                      className={styles.errorMessage}
                    />
                  </div>
                )}

                <div className={styles.inputGroup} style={{ display: "none" }}>
                  <label htmlFor="sq_ft">Square Feet (sq ft)</label>
                  <Field id="sq_ft" type="number" name="sq_ft" />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="total_amount">Total Amount</label>
                  <Field
                    id="total_amount"
                    type="number"
                    name="total_amount"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.inputGroup}>
                  <button
                    type="submit"
                    className={commonStyles.buttonSuccess}
                    disabled={isSubmitting}
                  >
                    <FaPlus /> Add Project
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>

      <div
        style={{
          backgroundColor: "var(--color-surface)",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid var(--color-border)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
            color: "var(--color-text-primary)",
          }}
        >
          <FaFilter />{" "}
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Advanced Filters</h3>
        </div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <div
            style={{
              flex: "1 1 200px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <label
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
                fontWeight: "500",
              }}
            >
              Builder
            </label>
            <select
              value={builderFilter}
              onChange={(e) => setBuilderFilter(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            >
              <option value="all">All Builders</option>
              {builders?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              flex: "1 1 200px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <label
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
                fontWeight: "500",
              }}
            >
              Store
            </label>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            >
              <option value="all">All Stores</option>
              {stores?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              flex: "1 1 200px",
              display: "flex",
              flexDirection: "column",
              gap: "6px",
            }}
          >
            <label
              style={{
                fontSize: "0.85rem",
                color: "var(--color-text-secondary)",
                fontWeight: "500",
              }}
            >
              Product
            </label>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              style={{
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                backgroundColor: "var(--color-background)",
                color: "var(--color-text-primary)",
                outline: "none",
              }}
            >
              <option value="all">All Products</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <AddressFilter
        onFilterChange={handleFilterChange}
        dateFilter={dateFilter}
        statusFilter={statusFilter}
      />

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search by address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {addressesLoading && addresses.length === 0 ? (
        <div className={styles.addressList}>
          <SkeletonLoader count={5} />
        </div>
      ) : addresses.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {groupedAddresses.today.length > 0 && (
            <div className={styles.listSection}>
              <h2
                className={styles.sectionTitle}
                style={{
                  color: "var(--color-primary)",
                  borderBottom: "2px solid var(--color-primary)",
                  paddingBottom: "5px",
                }}
              >
                Today
              </h2>
              {renderAddressList(groupedAddresses.today)}
            </div>
          )}

          {groupedAddresses.tomorrow.length > 0 && (
            <div className={styles.listSection}>
              <h2
                className={styles.sectionTitle}
                style={{
                  color: "#f59e0b",
                  borderBottom: "2px solid #f59e0b",
                  paddingBottom: "5px",
                }}
              >
                Tomorrow
              </h2>
              {renderAddressList(groupedAddresses.tomorrow)}
            </div>
          )}

          {groupedAddresses.upcoming.map((chunk) => (
            <div key={chunk.label} className={styles.listSection}>
              <h2
                className={styles.sectionTitle}
                style={{
                  color: "#3b82f6",
                  borderBottom: "2px solid #3b82f6",
                  paddingBottom: "5px",
                }}
              >
                Upcoming: {chunk.label}
              </h2>
              {renderAddressList(chunk.items)}
            </div>
          ))}

          {groupedAddresses.past.map((chunk) => (
            <div key={chunk.label} className={styles.listSection}>
              <h2
                className={styles.sectionTitle}
                style={{
                  color: "#ef4444",
                  borderBottom: "2px solid #ef4444",
                  paddingBottom: "5px",
                }}
              >
                Past: {chunk.label}
              </h2>
              {renderAddressList(chunk.items)}
            </div>
          ))}

          {hasMore && (
            <div
              style={{
                textAlign: "center",
                marginTop: "20px",
                marginBottom: "40px",
              }}
            >
              <button
                onClick={loadMore}
                disabled={addressesLoading}
                className={commonStyles.buttonSecondary}
                style={{ padding: "10px 24px", cursor: "pointer" }}
              >
                {addressesLoading ? "Loading..." : "Load More Projects"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState message="No projects found matching your criteria." />
      )}
    </div>
  );
};

export default AddressListPage;
