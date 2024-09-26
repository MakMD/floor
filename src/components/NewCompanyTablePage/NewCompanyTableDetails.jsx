import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import styles from "./NewCompanyTableDetails.module.css"; // Імпорт стилів

const NewCompanyTableDetails = () => {
  const { tableId } = useParams();
  const [tableDetails, setTableDetails] = useState(null);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false); // Перемикання режиму редагування
  const navigate = useNavigate();

  // Стани для нових даних
  const [newInvoice, setNewInvoice] = useState({
    date: "",
    address: "",
    price: 0,
    sfStairs: 0,
  });

  // Стани для підсумкових значень
  const [totalSum, setTotalSum] = useState(0);
  const [gstSum, setGstSum] = useState(0);
  const [totalWithGstSum, setTotalWithGstSum] = useState(0);

  useEffect(() => {
    const fetchTableDetails = async () => {
      try {
        const response = await axios.get(
          "https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany"
        );
        const tableData = response.data[0]?.invoiceTables.find(
          (table) => table.tableId === tableId
        );
        if (tableData) {
          setTableDetails(tableData);
          calculateTotals(tableData.invoices);
        } else {
          setError("Table not found");
        }
      } catch (error) {
        setError("Error fetching table details");
        console.error("Error fetching table details:", error);
      }
    };

    fetchTableDetails();
  }, [tableId]);

  // Обчислення загальної суми, GST і Total with GST
  const calculateTotals = (invoices) => {
    const totalSum = invoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.total || 0),
      0
    );
    const gstSum = invoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.GSTCollected || 0),
      0
    );
    const totalWithGstSum = invoices.reduce(
      (sum, invoice) => sum + parseFloat(invoice.totalWithGst || 0),
      0
    );

    setTotalSum(totalSum.toFixed(2));
    setGstSum(gstSum.toFixed(2));
    setTotalWithGstSum(totalWithGstSum.toFixed(2));
  };

  // Обробка змін полів інвойсів у таблиці
  const handleFieldChange = async (e, index, field) => {
    const updatedInvoices = [...tableDetails.invoices];
    updatedInvoices[index][field] = e.target.value;

    if (field === "price" || field === "sf/stairs") {
      const price = parseFloat(updatedInvoices[index].price || 0);
      const sfStairs = parseFloat(updatedInvoices[index]["sf/stairs"] || 0);
      const total = price * sfStairs;
      const gst = total * 0.05;
      const totalWithGst = total + gst;

      updatedInvoices[index].total = total.toFixed(2);
      updatedInvoices[index].GSTCollected = gst.toFixed(2);
      updatedInvoices[index].totalWithGst = totalWithGst.toFixed(2);
    }

    setTableDetails((prev) => ({
      ...prev,
      invoices: updatedInvoices,
    }));

    try {
      // Оновлення даних на бекенді
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany/1`
      );
      const companyData = response.data;

      const updatedInvoiceTables = companyData.invoiceTables.map((table) => {
        if (table.tableId === tableId) {
          return { ...table, invoices: updatedInvoices };
        }
        return table;
      });

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany/1`,
        {
          ...companyData,
          invoiceTables: updatedInvoiceTables,
        }
      );

      console.log("Invoice updated successfully");
    } catch (error) {
      console.error("Error updating invoice to backend:", error);
    }

    calculateTotals(updatedInvoices);
  };

  // Додавання нового інвойсу
  const handleAddInvoice = async () => {
    if (
      !newInvoice.date ||
      !newInvoice.address ||
      !newInvoice.price ||
      !newInvoice.sfStairs
    ) {
      alert("Please fill all required fields");
      return;
    }

    const price = parseFloat(newInvoice.price);
    const sfStairs = parseFloat(newInvoice.sfStairs);
    const total = price * sfStairs;
    const gst = total * 0.05;
    const totalWithGst = total + gst;

    const newInvoiceData = {
      date: newInvoice.date,
      address: newInvoice.address,
      price: newInvoice.price,
      "sf/stairs": newInvoice.sfStairs,
      total: total.toFixed(2),
      GSTCollected: gst.toFixed(2),
      totalWithGst: totalWithGst.toFixed(2),
    };

    // Оновлення інвойсів локально
    const updatedInvoices = [...tableDetails.invoices, newInvoiceData];

    setTableDetails((prev) => ({
      ...prev,
      invoices: updatedInvoices,
    }));

    calculateTotals(updatedInvoices);

    try {
      const response = await axios.get(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany/1`
      );
      const companyData = response.data;

      const updatedInvoiceTables = companyData.invoiceTables.map((table) => {
        if (table.tableId === tableId) {
          return { ...table, invoices: updatedInvoices };
        }
        return table;
      });

      await axios.put(
        `https://66ac12f3f009b9d5c7310a1a.mockapi.io/newCompany/1`,
        {
          ...companyData,
          invoiceTables: updatedInvoiceTables,
        }
      );

      console.log("Invoice added successfully");
    } catch (error) {
      console.error("Error adding invoice to backend:", error);
    }

    // Очищення форми після додавання інвойсу
    setNewInvoice({
      date: "",
      address: "",
      price: 0,
      sfStairs: 0,
    });
  };

  // Друк сторінки
  const handlePrint = () => {
    window.print();
  };

  // Перемикання режиму редагування
  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (error) {
    return <p>{error}</p>;
  }

  if (!tableDetails) {
    return <p>Loading...</p>;
  }

  return (
    <div className={styles.invoicePage}>
      <div className={styles.buttonContainer}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          Back
        </button>
        <button className={styles.printButton} onClick={handlePrint}>
          Print
        </button>
        <button className={styles.editButton} onClick={toggleEditMode}>
          {isEditing ? "Save Changes" : "Edit Invoices"}
        </button>
      </div>

      <div className={styles.document}>
        {/* Верхня частина таблиці з даними компанії */}
        <div className={styles.companyInfo}>
          <h2>FLOORING BOSS LTD.</h2>
          <p>422 ALLARD BLVD SW, EDMONTON, ALBERTA, T6W3S7</p>
          <p>Mykhailo: (587) 937 7862 | Miroslav: (825) 461 1950</p>
          <p>Email: flooring.boss1@gmail.com</p>
          <p>GST: 704201813 RT 0001 | WCB: 9839473</p>
        </div>

        <div className={styles.invoiceHeader}>
          <p>
            <strong>Date:</strong> {tableDetails.invoiceDetails.date}
          </p>
          <p>
            <strong>PAY TO:</strong> {tableDetails.invoiceDetails.payTo}
          </p>
          <p>
            <strong>Invoice #:</strong>{" "}
            {tableDetails.invoiceDetails.invoiceNumber}
          </p>
          <p>
            <strong>BILL TO:</strong> {tableDetails.invoiceDetails.billTo}
          </p>
        </div>

        {/* Таблиця інвойсів */}
        <table className={styles.invoiceTable}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Address</th>
              <th>Price</th>
              <th>SF/Stairs</th>
              <th>Total</th>
              <th>GST Collected (5%)</th>
              <th>Total With Gst</th>
            </tr>
          </thead>
          <tbody>
            {tableDetails.invoices.map((invoice, index) => (
              <tr key={index}>
                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={invoice.date}
                      onChange={(e) => handleFieldChange(e, index, "date")}
                    />
                  ) : (
                    invoice.date
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="text"
                      value={invoice.address}
                      onChange={(e) => handleFieldChange(e, index, "address")}
                    />
                  ) : (
                    invoice.address
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={invoice.price}
                      onChange={(e) => handleFieldChange(e, index, "price")}
                    />
                  ) : (
                    invoice.price
                  )}
                </td>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={invoice["sf/stairs"]}
                      onChange={(e) => handleFieldChange(e, index, "sf/stairs")}
                    />
                  ) : (
                    invoice["sf/stairs"]
                  )}
                </td>
                <td>{invoice.total}</td>
                <td>{invoice.GSTCollected}</td>
                <td>{invoice.totalWithGst}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan="4" className={styles.totalLabel}>
                Total
              </td>
              <td>{totalSum}</td>
              <td>{gstSum}</td>
              <td>{totalWithGstSum}</td>
            </tr>
          </tfoot>
        </table>

        {/* Форма для додавання нового інвойсу */}
        <div className={styles.formContainer}>
          <h3>Add New Invoice</h3>
          <input
            type="date"
            name="date"
            value={newInvoice.date}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, date: e.target.value })
            }
            placeholder="Date"
            className={styles.inputField}
          />
          <input
            type="text"
            name="address"
            value={newInvoice.address}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, address: e.target.value })
            }
            placeholder="Address"
            className={styles.inputField}
          />
          <input
            type="number"
            name="price"
            value={newInvoice.price}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, price: e.target.value })
            }
            placeholder="Price"
            className={styles.inputField}
          />
          <input
            type="number"
            name="sfStairs"
            value={newInvoice.sfStairs}
            onChange={(e) =>
              setNewInvoice({ ...newInvoice, sfStairs: e.target.value })
            }
            placeholder="SF/Stairs"
            className={styles.inputField}
          />
          <button
            onClick={handleAddInvoice}
            className={styles.addInvoiceButton}
          >
            Add Invoice
          </button>
        </div>

        <p className={styles.dueUponReceipt}>DUE UPON RECEIPT</p>
      </div>
    </div>
  );
};

export default NewCompanyTableDetails;
