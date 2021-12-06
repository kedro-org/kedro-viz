import React, { useEffect, useState } from 'react';

import './input.css';

const Input = ({ defaultValue = '', size = 'large' }) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const handleChange = (e) => {
    setValue(e.target.value);
  };

  return (
    <input
      className={`input input--${size}`}
      onChange={handleChange}
      type="text"
      value={value}
    />
  );
};

export default Input;
