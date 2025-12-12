import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { useAddresses } from "../hooks/useAddresses";
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
} from "react-icons/fa";
import styles from "./AddressListPage.module.css";
import commonStyles from "../styles/common.module.css";
import toast from "react-hot-toast";
import { isToday, isTomorrow, isYesterday, parseISO } from "date-fns";
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
  store_id: Yup.number().nullable(),
  builder_id: Yup.number().nullable(),
});

const AddressListPage = () => {
  const { addresses, loading: addressesLoading, refetch } = useAddresses();
  const { builders, stores, loading: listsLoading } = useAdminLists();
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedAddresses, setEditedAddresses] = useState({});
  const navigate = useNavigate();
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const handleFilterChange = (filterType, value) => {
    if (filterType === "date") {
      setDateFilter(value);
    } else if (filterType === "status") {
      setStatusFilter(value);
    }
  };

  const filteredAddresses = useMemo(() => {
    return addresses.filter((item) => {
      const searchMatch = (item.address || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const statusMatch =
        statusFilter === "all" || item.status === statusFilter;
      const dateMatch =
        dateFilter === "all" ||
        (dateFilter === "today" && isToday(parseISO(item.date))) ||
        (dateFilter === "tomorrow" && isTomorrow(parseISO(item.date))) ||
        (dateFilter === "yesterday" && isYesterday(parseISO(item.date)));
      return searchMatch && statusMatch && dateMatch;
    });
  }, [addresses, searchTerm, dateFilter, statusFilter]);

  const groupedAddresses = useMemo(() => {
    const today = [];
    const tomorrow = [];
    const past = [];

    filteredAddresses.forEach((item) => {
      const date = parseISO(item.date);
      if (isToday(date)) {
        today.push(item);
      } else if (isTomorrow(date)) {
        tomorrow.push(item);
      } else {
        past.push(item);
      }
    });

    past.sort((a, b) => parseISO(b.date) - parseISO(a.date));

    return { today, tomorrow, past };
  }, [filteredAddresses]);

  const handleAddAddress = async (values, { setSubmitting, resetForm }) => {
    const newAddressObject = {
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
    const { error } = await supabase.from("addresses").delete().eq("id", id);
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

  const renderAddressList = (list) => (
    <ul className={styles.addressList}>
      {list.map((item) => {
        // ОНОВЛЕНО: Додаємо клас для фону
        const statusBackgroundClass =
          {
            Ready: styles.readyBackground,
            "In Process": styles.inProcessBackground,
            "Not Finished": styles.notFinishedBackground,
          }[item.status] || "";

        return (
          <li
            key={item.id}
            className={`${styles.addressItem} ${
              isEditing ? styles.editing : ""
            } ${statusBackgroundClass}`} // Додано новий клас
            onClick={() => !isEditing && navigate(`/address/${item.id}`)}
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
                <StatusIndicator status={item.status} />
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
        <h1 className={styles.pageTitle}>Address Notes</h1>
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
                    {stores.map((store) => (
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
                    {builders.map((builder) => (
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
                <div className={styles.inputGroup}>
                  <label htmlFor="total_amount">Total Amount</label>
                  <Field
                    id="total_amount"
                    type="number"
                    name="total_amount"
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label>&nbsp;</label>
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

      <AddressFilter
        onFilterChange={handleFilterChange}
        dateFilter={dateFilter}
        statusFilter={statusFilter}
      />

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {addressesLoading ? (
        <div className={styles.addressList}>
          <SkeletonLoader count={5} />
        </div>
      ) : filteredAddresses.length > 0 ? (
        <>
          {groupedAddresses.tomorrow.length > 0 && (
            <div className={styles.listSection}>
              <h2 className={styles.sectionTitle}>Tomorrow</h2>
              {renderAddressList(groupedAddresses.tomorrow)}
            </div>
          )}
          {groupedAddresses.today.length > 0 && (
            <div className={styles.listSection}>
              <h2 className={styles.sectionTitle}>Today</h2>
              {renderAddressList(groupedAddresses.today)}
            </div>
          )}
          {groupedAddresses.past.length > 0 && (
            <div className={styles.listSection}>
              <h2 className={styles.sectionTitle}>Past</h2>
              {renderAddressList(groupedAddresses.past)}
            </div>
          )}
        </>
      ) : (
        <EmptyState message="No projects found matching your criteria." />
      )}
    </div>
  );
};

export default AddressListPage;
