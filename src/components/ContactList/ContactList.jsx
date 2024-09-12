import css from "./ContactList.module.css";
import Contact from "../Contact/Contact";

const ContactList = ({ users, onDelete }) => {
  return (
    <div className={css.contactWrapper}>
      {users.map((user) => (
        <Contact
          key={user.id}
          id={user.id}
          name={user.name}
          number={user.number}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default ContactList;
