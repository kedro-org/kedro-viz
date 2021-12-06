import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';

import './textarea.css';

const MIN_HEIGHT = 20;

const TextArea = ({ defaultValue = '', limit = 100, size = 'large' }) => {
  const textareaRef = useRef(null);
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useLayoutEffect(() => {
    textareaRef.current.style.height = 'inherit';

    textareaRef.current.style.height = `${Math.max(
      textareaRef.current.scrollHeight,
      MIN_HEIGHT
    )}px`;
  }, [value]);

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
        ref={textareaRef}
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
