import { useEffect, useState } from 'react';
import { isRunningLocally } from '../../utils';

const ShareableUrlTimestamp = () => {
  const [timestamp, setTimestamp] = useState(null);

  useEffect(() => {
    if (isRunningLocally()) {
      return;
    }

    async function fetchData() {
      const response = await fetch('/api/timestamp', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const result = await response.json();
      console.log('response: ', response);
      console.log('result: ', result);

      setTimestamp(result.timestamp);
    }

    fetchData();
  }, []);

  if (isRunningLocally()) {
    return null;
  }

  return (
    <div className="shareable-url-timestamp">
      <p>{timestamp}</p>
    </div>
  );
};

export default ShareableUrlTimestamp;
