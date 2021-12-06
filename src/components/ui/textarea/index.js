import React, { useCallback, useEffect, useState } from 'react';

import './textarea.css';

const TextArea = ({
  defaultValue = '',
  limit = 100,
  rows = 2,
  size = 'large',
}) => {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const setLimitedLengthText = useCallback(
    (text) => {
      setValue(text.slice(0, limit));
    },
    [limit, setValue]
  );

  const handleChange = (e) => {
    setLimitedLengthText(e.target.value);
  };

  return (
    <>
      <textarea
        className={`textarea textarea--${size}`}
        onChange={handleChange}
        rows={rows}
        value={value}
      />
      <div className="textarea-character-count">
        <span>
          <span className="textarea-number-characters">{value.length}</span>/
          {limit} characters
        </span>
      </div>
    </>
  );
};

export default TextArea;
