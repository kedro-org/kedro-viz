import { useEffect, useState } from 'react';
import { isRunningLocally } from '../../utils';

const ShareableUrlMetadata = () => {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    if (!isRunningLocally()) {
      return;
    }

    async function fetchData() {
      const response = await fetch('/api/deploy-viz-metadata', {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });
      const result = await response.json();
      console.log('result: ', result);

      setMetadata(result);
    }

    fetchData();
  }, []);

  if (!isRunningLocally() || metadata === null) {
    return null;
  }

  return (
    <div className="shareable-url-timestamp">
      <p>{`Kedro-Viz ${metadata.version} – ${metadata.timestamp
        .split(' ')
        .join(' – ')}`}</p>
    </div>
  );
};

export default ShareableUrlMetadata;
