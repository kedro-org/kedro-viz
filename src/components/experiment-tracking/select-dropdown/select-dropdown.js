import React, { useState, useEffect, useCallback } from 'react';

import Dropdown from '../../ui/dropdown';
import MenuOption from '../../ui/menu-option';

import './select-dropdown.css';

const CheckboxOption = ({ text, selectedValues, onChange }) => {
  return (
    <label className="select-dropdown__checkbox">
      <MenuOption
        primaryText={text}
        value={text}
        id={text}
        onSelected={() => onChange(text)}
      />
      <input
        type="checkbox"
        id={text}
        checked={selectedValues && selectedValues.includes(text)}
        // onClick={() => onChange(text)}
      />
    </label>
  );
};

const SelectDropdown = ({
  onToggleOpen,
  defaultText,
  dropdownValues,
  onChange,
}) => {
  const [selected, setSelected] = useState(dropdownValues);

  useEffect(() => {
    if (dropdownValues) {
      setSelected(dropdownValues);
    }
  }, [dropdownValues]);

  const onSelectedHandler = useCallback(
    (value) => {
      if (selected.includes(value)) {
        const selectedIds = selected.filter((each) => each !== value);
        setSelected(selectedIds);
      } else {
        setSelected([...selected, value]);
      }
    },
    [selected]
  );

  return (
    <Dropdown
      onOpened={() => onToggleOpen(true)}
      onClosed={() => onToggleOpen(false)}
      onChanged={() => {}}
      defaultText={defaultText}
    >
      {dropdownValues &&
        dropdownValues.map((text) => (
          <CheckboxOption
            key={text}
            text={text}
            selectedValues={selected}
            onChange={onSelectedHandler}
          />
        ))}
      <button onClick={() => onChange(selected)}>Save</button>
    </Dropdown>
  );
};

export default SelectDropdown;
