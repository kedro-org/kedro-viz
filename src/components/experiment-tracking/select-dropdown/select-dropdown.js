import React, { useState, useEffect, useCallback } from 'react';

import Dropdown from '../../ui/dropdown';

import './select-dropdown.css';

const CheckboxOption = ({ text, selectedValues, onChange }) => {
  return (
    <label className="select-dropdown__checkbox">
      <span className="select-dropdown__checkbox-text">{text}</span>
      <input
        type="checkbox"
        id={text}
        checked={selectedValues && selectedValues.includes(text)}
        onChange={() => onChange(text)}
      />
    </label>
  );
};

const SelectDropdown = ({
  dropdownValues,
  onChange,
  selectedDropdownValues,
}) => {
  const [selected, setSelected] = useState(selectedDropdownValues);

  useEffect(() => {
    if (selectedDropdownValues) {
      setSelected(selectedDropdownValues);
    }
  }, [selectedDropdownValues]);

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
    <div className="select-dropdown">
      <Dropdown
        onChanged={() => {}}
        // reset the valur if click close without Apply
        onClosed={() => setSelected(selectedDropdownValues)}
        defaultText={`Metrics ${selected ? selected.length : 0}/${
          dropdownValues ? dropdownValues.length : 0
        }`}
      >
        <div className="select-dropdown__title">Metrics</div>
        {dropdownValues &&
          dropdownValues.map((text) => (
            <CheckboxOption
              key={text}
              text={text}
              selectedValues={selected}
              onChange={onSelectedHandler}
            />
          ))}
        <div className="select-dropdown__apply-btn-wrapper">
          <button
            className="select-dropdown__apply-btn"
            onClick={() => {
              onChange(selected);
            }}
          >
            Apply
          </button>
        </div>
      </Dropdown>
    </div>
  );
};

export default SelectDropdown;
