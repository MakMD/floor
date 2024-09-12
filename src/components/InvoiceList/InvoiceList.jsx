import styles from "./InvoiceList.module.css"; // Підключення як styles

const InvoiceList = ({ data }) => {
  return (
    <table className={styles.invoiceTable}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Work Order</th>
          <th>Address</th>
          <th>Income Without GST</th>
          <th>GST</th>
          <th>Income With GST</th>
        </tr>
      </thead>
      <tbody>
        {data.map((invoice, index) => (
          <tr key={index}>
            <td>{invoice.date}</td>
            <td>{invoice.workOrder}</td>
            <td>{invoice.address}</td>
            <td>{invoice.incomeWithoutGst}</td>
            <td>{invoice.GST}</td>
            <td>{invoice.incomeWithGst}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default InvoiceList;
