import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAdminLists } from "../hooks/useAdminLists";
import SkeletonLoader from "../components/SkeletonLoader/SkeletonLoader";
import EmptyState from "../components/EmptyState/EmptyState";
import {
  FaArrowLeft,
  FaPlus,
  FaEdit,
  FaCheck,
  FaTrash,
  FaMapMarkerAlt,
  FaTools,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import { MdOutlineChevronRight } from "react-icons/md";
import styles from "./AddressListPage.module.css";
import commonStyles from "../styles/common.module.css";
import toast from "react-hot-toast";
import { format, addDays, subDays, parseISO } from "date-fns";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

const AddProjectSchema = Yup.object().shape({
  project_type: Yup.string().required("Project type is required"),
  work_order_number: Yup.string().nullable(),
  address: Yup.string()
    .trim()
    .min(3, "Address must be at least 3 characters")
    .required("Address is required"),
  date: Yup.date().required("Date is required"),
  time: Yup.string().when("project_type", {
    is: "Service",
    then: (schema) => schema.required("Time is required for services"),
    otherwise: (schema) => schema.notRequired(),
  }),
  total_amount: Yup.number().nullable(),
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
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchAddresses = async (pageNumber = 1, reset = false) => {
    setAddressesLoading(true);
    const from = (pageNumber - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from("addresses")
      .select("*, builders(name), stores(name), work_orders(*)", {
        count: "exact",
      })
      .eq("is_deleted", false)
      .order("date", { ascending: false, nullsLast: true });

    if (debouncedSearch) query = query.ilike("address", `%${debouncedSearch}%`);
    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (builderFilter !== "all") query = query.eq("builder_id", builderFilter);
    if (storeFilter !== "all") query = query.eq("store_id", storeFilter);

    if (dateFilter === "today")
      query = query.eq("date", format(new Date(), "yyyy-MM-dd"));
    else if (dateFilter === "tomorrow")
      query = query.eq("date", format(addDays(new Date(), 1), "yyyy-MM-dd"));
    else if (dateFilter === "yesterday")
      query = query.eq("date", format(subDays(new Date(), 1), "yyyy-MM-dd"));

    const { data, error, count } = await query.range(from, to);

    if (error) {
      toast.error(`Error: ${error.message}`);
    } else {
      let newItems = data || [];
      if (productFilter !== "all") {
        newItems = newItems.filter(
          (item) =>
            item.work_orders &&
            item.work_orders.some(
              (wo) => wo.product_id?.toString() === productFilter,
            ),
        );
      }

      if (reset) setAddresses(newItems);
      else {
        setAddresses((prev) => {
          const existingIds = new Set(prev.map((i) => i.id));
          const filteredNew = newItems.filter((i) => !existingIds.has(i.id));
          return [...prev, ...filteredNew];
        });
      }

      setHasMore(
        count !== null
          ? from + (data?.length || 0) < count
          : (data?.length || 0) === PAGE_SIZE,
      );
    }
    setAddressesLoading(false);
  };

  useEffect(() => {
    setPage(1);
    fetchAddresses(1, true);
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

      if (dateOnly.getTime() === todayDate.getTime()) todayList.push(item);
      else if (dateOnly.getTime() === tomorrowDate.getTime())
        tomorrowList.push(item);
      else if (dateOnly > tomorrowDate) {
        const startChunk = new Date(dateOnly);
        startChunk.setDate(dateOnly.getDate() - dateOnly.getDay() + 1);
        const endChunk = new Date(startChunk);
        endChunk.setDate(startChunk.getDate() + 6);
        const key = startChunk.getTime().toString();
        if (!upcomingMap[key])
          upcomingMap[key] = { start: startChunk, end: endChunk, items: [] };
        upcomingMap[key].items.push(item);
      } else if (dateOnly < todayDate) {
        const startChunk = new Date(dateOnly);
        startChunk.setDate(dateOnly.getDate() - dateOnly.getDay() + 1);
        const endChunk = new Date(startChunk);
        endChunk.setDate(startChunk.getDate() + 6);
        const key = startChunk.getTime().toString();
        if (!pastMap[key])
          pastMap[key] = { start: startChunk, end: endChunk, items: [] };
        pastMap[key].items.push(item);
      }
    });

    const formatDate = (d) =>
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const sortAndFormat = (map, isPast) =>
      Object.values(map)
        .sort((a, b) => (isPast ? b.start - a.start : a.start - b.start))
        .map((chunk) => ({
          label: `${formatDate(chunk.start)} - ${formatDate(chunk.end)}`,
          items: chunk.items.sort((i1, i2) =>
            isPast
              ? parseISO(i2.date) - parseISO(i1.date)
              : parseISO(i1.date) - parseISO(i2.date),
          ),
        }));

    return {
      today: todayList,
      tomorrow: tomorrowList,
      upcoming: sortAndFormat(upcomingMap, false),
      past: sortAndFormat(pastMap, true),
    };
  }, [addresses]);

  const handleAddAddress = async (values, { setSubmitting, resetForm }) => {
    const newAddressObject = {
      work_order_number: values.work_order_number?.trim() || null,
      address: values.address.trim(),
      date: values.date,
      total_amount: values.total_amount
        ? parseFloat(values.total_amount)
        : null,
      store_id: values.store_id ? parseInt(values.store_id) : null,
      builder_id: values.builder_id ? parseInt(values.builder_id) : null,
      status: "In Process",
      project_type: values.project_type,
      service_time: values.project_type === "Service" ? values.time : null,
    };
    const { error } = await supabase
      .from("addresses")
      .insert([newAddressObject]);
    if (error) toast.error(`Error adding address: ${error.message}`);
    else {
      toast.success("Project added successfully!");
      resetForm();
      setIsAddFormOpen(false);
      refetch();
    }
    setSubmitting(false);
  };

  const handleUpdateAddressName = async (id, newName) => {
    if (!newName || newName.trim() === "") {
      toast.error("Name cannot be empty.");
      return;
    }
    const { error } = await supabase
      .from("addresses")
      .update({ address: newName.trim() })
      .eq("id", id);
    if (!error) {
      toast.success("Address updated!");
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
    if (!error) {
      toast.success("Address deleted!");
      refetch();
    }
  };

  // --- РОЗУМНИЙ ПАРСЕР ТЕКСТУ ---
  const normalizeText = (text) => {
    if (!text) return "";
    return text
      .toLowerCase()
      .replace(/the\s|ltd\.?|inc\.?|corp\.?|canada/g, "") // Прибираємо часті слова
      .replace(/[^a-z0-9]/g, ""); // Залишаємо тільки букви та цифри
  };

  const isMatch = (dbName, aiName) => {
    const cleanDb = normalizeText(dbName);
    const cleanAi = normalizeText(aiName);
    if (!cleanDb || !cleanAi) return false;

    // 1. Стандартне включення
    if (cleanDb.includes(cleanAi) || cleanAi.includes(cleanDb)) return true;

    // 2. Специфічні кейси для вашої бази (Touchstone vs Touchtone, Floor Show vs Show Floor)
    if (
      (cleanDb.includes("touchstone") && cleanAi.includes("touchtone")) ||
      (cleanAi.includes("touchstone") && cleanDb.includes("touchtone"))
    ) {
      return true;
    }
    if (
      (cleanDb.includes("showfloor") && cleanAi.includes("floorshow")) ||
      (cleanAi.includes("showfloor") && cleanDb.includes("floorshow"))
    ) {
      return true;
    }

    return false;
  };

  const handleScanDocument = async (event, setFieldValue) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);
    const toastId = toast.loading("Scanning document...");

    try {
      const base64Image = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = (error) => reject(error);
      });

      const { data, error } = await supabase.functions.invoke(
        "scan-work-order",
        {
          body: { imageBase64: base64Image },
        },
      );

      if (error) throw new Error(error.message || "Помилка зв'язку з сервером");
      if (data && data.error) throw new Error(data.error);

      // Заповнюємо базові поля
      if (data.work_order_number)
        setFieldValue("work_order_number", data.work_order_number);
      if (data.type) setFieldValue("project_type", data.type);
      if (data.address) setFieldValue("address", data.address);
      if (data.date) setFieldValue("date", data.date);
      if (data.total_amount) setFieldValue("total_amount", data.total_amount);

      // Знаходимо Білдера
      if (data.builder_name && builders) {
        const matchedBuilder = builders.find((b) =>
          isMatch(b.name, data.builder_name),
        );
        if (matchedBuilder) setFieldValue("builder_id", matchedBuilder.id);
      }

      // Знаходимо Магазин
      if (data.store_name && stores) {
        const matchedStore = stores.find((s) =>
          isMatch(s.name, data.store_name),
        );
        if (matchedStore) setFieldValue("store_id", matchedStore.id);
      }

      toast.success("Document scanned successfully!", { id: toastId });
    } catch (error) {
      console.error("Full Scanning error:", error);
      toast.error(`Scan failed: ${error.message}`, { id: toastId });
    } finally {
      setIsScanning(false);
      event.target.value = null;
    }
  };

  const renderAddressList = (list) => (
    <div className={styles.cardsList}>
      {list.map((item) => (
        <div
          key={item.id}
          className={`${styles.card} ${isEditing ? styles.editing : ""}`}
          onClick={() =>
            !isEditing &&
            navigate(`/address/${item.id}`, {
              state: { searchTerm, dateFilter, statusFilter },
            })
          }
        >
          <div className={styles.cardContent}>
            {isEditing ? (
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <input
                  type="text"
                  value={
                    editedAddresses[item.id] !== undefined
                      ? editedAddresses[item.id]
                      : item.address
                  }
                  onChange={(e) =>
                    setEditedAddresses((prev) => ({
                      ...prev,
                      [item.id]: e.target.value,
                    }))
                  }
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
              </div>
            ) : (
              <>
                <div className={styles.cardTitle}>
                  {item.project_type === "Service" ? "Service: " : "WO #"}
                  {item.work_order_number || "N/A"} -{" "}
                  {item.builders?.name || "Unknown Builder"}
                  {item.project_type === "Service" && item.service_time
                    ? ` - ${item.service_time}`
                    : ""}
                </div>

                <div className={styles.cardAddress}>
                  <FaMapMarkerAlt className={styles.pinIcon} />
                  <span>{item.address}</span>
                </div>

                {item.project_type === "Service" && item.notes && (
                  <div className={styles.cardNotes}>{item.notes}</div>
                )}

                <div className={styles.cardBottomRow}>
                  {item.project_type !== "Service" && (
                    <button
                      className={styles.confirmBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.success("Materials confirmed!");
                      }}
                    >
                      Confirm Materials
                    </button>
                  )}

                  <span
                    className={`${styles.statusBadge} ${styles[item.status?.replace(/\s+/g, "")] || ""}`}
                  >
                    {item.status}
                  </span>
                </div>
              </>
            )}
          </div>
          {!isEditing && (
            <MdOutlineChevronRight className={styles.chevronIcon} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mobileLayout}>
        <div className={styles.header}>
          <button
            className={commonStyles.buttonSecondary}
            onClick={() => navigate("/")}
            style={{ border: "none" }}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className={styles.pageTitle}>Projects</h1>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className={commonStyles.buttonPrimary}
            >
              {isAddFormOpen ? <FaTimes /> : <FaPlus />}{" "}
              {isAddFormOpen ? "Close" : "New"}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={
                isEditing
                  ? commonStyles.buttonSuccess
                  : commonStyles.buttonSecondary
              }
            >
              {isEditing ? <FaCheck /> : <FaEdit />}{" "}
              {isEditing ? "Done" : "Edit"}
            </button>
          </div>
        </div>

        <div className={styles.darkFilterPanel}>
          <div className={styles.searchContainer}>
            <FaSearch className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search by address or WO..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.filterGrid}>
            <select
              value={builderFilter}
              onChange={(e) => setBuilderFilter(e.target.value)}
              className={styles.darkSelect}
            >
              <option value="all">All Builders</option>
              {builders?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className={styles.darkSelect}
            >
              <option value="all">All Stores</option>
              {stores?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className={styles.darkSelect}
            >
              <option value="all">All Products</option>
              {products?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={styles.darkSelect}
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="tomorrow">Tomorrow</option>
              <option value="yesterday">Yesterday</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={styles.darkSelect}
            >
              <option value="all">All Statuses</option>
              <option value="In Process">In Process</option>
              <option value="Ready">Ready</option>
              <option value="Not Finished">Not Finished</option>
            </select>
          </div>
        </div>

        {isAddFormOpen && (
          <div className={styles.addFormSection}>
            <div className={styles.sectionHeaderForm}>Create New Project</div>
            <Formik
              initialValues={{
                project_type: "Address",
                work_order_number: "",
                store_id: "",
                builder_id: "",
                address: "",
                date: "",
                time: "",
                total_amount: "",
              }}
              validationSchema={AddProjectSchema}
              onSubmit={handleAddAddress}
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form className={styles.addForm}>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label>Type</label>
                      <Field
                        as="select"
                        name="project_type"
                        className={styles.formInput}
                      >
                        <option value="Address">Address</option>
                        <option value="Service">Service</option>
                      </Field>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>WO Number</label>
                      <Field
                        type="text"
                        name="work_order_number"
                        placeholder="e.g. 47174-1"
                        className={styles.formInput}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Builder</label>
                      <Field
                        as="select"
                        name="builder_id"
                        className={styles.formInput}
                      >
                        <option value="">Select Builder</option>
                        {builders?.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </Field>
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Store</label>
                      <Field
                        as="select"
                        name="store_id"
                        className={styles.formInput}
                      >
                        <option value="">Select Store</option>
                        {stores?.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </Field>
                    </div>
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.inputGroup}>
                      <label>Address / Service Name</label>
                      <Field
                        type="text"
                        name="address"
                        placeholder="Job site address or service name"
                        className={styles.formInput}
                      />
                      <ErrorMessage
                        name="address"
                        component="div"
                        className={styles.errorMessage}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Date</label>
                      <Field
                        type="date"
                        name="date"
                        className={styles.formInput}
                      />
                    </div>
                    {values.project_type === "Service" && (
                      <div className={styles.inputGroup}>
                        <label>Time</label>
                        <Field
                          type="time"
                          name="time"
                          className={styles.formInput}
                        />
                      </div>
                    )}
                    <div className={styles.inputGroup}>
                      <label>Total Amount</label>
                      <Field
                        type="number"
                        name="total_amount"
                        placeholder="0.00"
                        className={styles.formInput}
                      />
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      marginTop: "16px",
                      width: "100%",
                    }}
                  >
                    <input
                      type="file"
                      id="cameraInput"
                      accept="image/*"
                      capture="environment"
                      style={{ display: "none" }}
                      onChange={(e) => handleScanDocument(e, setFieldValue)}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("cameraInput").click()
                      }
                      className={commonStyles.buttonSecondary}
                      disabled={isScanning || isSubmitting}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      {isScanning ? "Scanning..." : "📷 Scan"}
                    </button>

                    <button
                      type="submit"
                      className={commonStyles.buttonPrimary}
                      disabled={isSubmitting || isScanning}
                      style={{
                        flex: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                    >
                      <FaPlus /> Add Project
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        )}

        <div className={styles.content}>
          {addressesLoading && addresses.length === 0 ? (
            <div style={{ padding: "20px" }}>
              <SkeletonLoader count={5} />
            </div>
          ) : addresses.length > 0 ? (
            <div className={styles.listContainer}>
              {groupedAddresses.today.length > 0 && (
                <div className={styles.dayGroup}>
                  <div
                    className={styles.sectionHeader}
                    style={{ borderLeft: "4px solid var(--color-primary)" }}
                  >
                    Today Projects ({groupedAddresses.today.length})
                  </div>
                  {renderAddressList(groupedAddresses.today)}
                </div>
              )}
              {groupedAddresses.tomorrow.length > 0 && (
                <div className={styles.dayGroup}>
                  <div className={styles.sectionHeader}>
                    Tomorrow Projects ({groupedAddresses.tomorrow.length})
                  </div>
                  {renderAddressList(groupedAddresses.tomorrow)}
                </div>
              )}
              {groupedAddresses.upcoming.map((chunk) => (
                <div key={chunk.label} className={styles.dayGroup}>
                  <div className={styles.sectionHeader}>
                    Upcoming: {chunk.label} ({chunk.items.length})
                  </div>
                  {renderAddressList(chunk.items)}
                </div>
              ))}
              {groupedAddresses.past.map((chunk) => (
                <div key={chunk.label} className={styles.dayGroup}>
                  <div className={styles.sectionHeader}>
                    Past: {chunk.label} ({chunk.items.length})
                  </div>
                  {renderAddressList(chunk.items)}
                </div>
              ))}
              {hasMore && (
                <div style={{ textAlign: "center", padding: "20px" }}>
                  <button
                    onClick={loadMore}
                    disabled={addressesLoading}
                    className={commonStyles.buttonSecondary}
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
      </div>
    </div>
  );
};

export default AddressListPage;
