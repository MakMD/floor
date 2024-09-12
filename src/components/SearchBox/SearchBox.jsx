import css from "./SearchBox.module.css";

const SearchBox = ({ value, onSearch }) => {
  return (
    <div className={css.searchWrapper}>
      <label htmlFor="searchInpId" className={css.searchLabel}>
        Find contacts by name
      </label>
      <input
        className={css.searchInp}
        type="text"
        value={value}
        onChange={(evt) => onSearch(evt.target.value)}
        id="searchInpId"
      />
    </div>
  );
};

export default SearchBox;
