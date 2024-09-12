import { useState, useEffect } from "react";
import SearchBox from "../SearchBox/SearchBox";
import ContactForm from "../ContactForm/ContactForm";
import ContactList from "../ContactList/ContactList";

const initialContacts = [
  { id: "id-1", name: "Rosie Simpson", number: "459-12-56" },
  { id: "id-2", name: "Hermione Kline", number: "443-89-12" },
  { id: "id-3", name: "Eden Clements", number: "645-17-79" },
  { id: "id-4", name: "Annie Copeland", number: "227-91-26" },
];

const App = () => {
  // stan's
  const [search, setSearch] = useState("");
  const [contacts, setContacts] = useState(() => {
    const storageContacts = localStorage.getItem("contacts");
    return storageContacts ? JSON.parse(storageContacts) : initialContacts;
  });

  // func for adding contacts
  const addContact = (newContact) => {
    setContacts((contact) => {
      return [...contact, newContact];
    });
  };
  // func for deleting contacts
  const deleteContact = (contactId) => {
    setContacts((prevContacts) => {
      return prevContacts.filter((contact) => contact.id !== contactId);
    });
  };
  // func for searching contacts
  const visibleContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(search.toLowerCase())
  );
  // rendering contacts from local storage
  useEffect(() => {
    localStorage.setItem("contacts", JSON.stringify(contacts));
  }, [contacts]);
  // constructor
  return (
    <div>
      <h1>Phonebook</h1>
      <ContactForm onAdd={addContact} />
      <SearchBox value={search} onSearch={setSearch} />
      <ContactList users={visibleContacts} onDelete={deleteContact} />
    </div>
  );
};
export default App;
