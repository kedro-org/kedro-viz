import { useEffect, useState } from 'react';
import { sanitizedPathname } from '../../utils';

const ShareableUrlMetadata = () => {
  const [metadata, setMetadata] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const request = await fetch(
          `${sanitizedPathname()}api/deploy-viz-metadata`,
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        );
        const response = await request.json();

        if (request.ok) {
          setMetadata(response);
        }
      } catch (error) {
        console.log('deploy-viz-metadata fetch error: ', error);
      }
    }

    fetchData();
  }, []);

  if (metadata === null) {
    return null;
  }

  return (
    <div className="shareable-url-timestamp">
      <p>{`Kedro-Viz ${metadata.version} – ${metadata.timestamp
        .split(' ')
        .join(' – ')} UTC`}</p>
    </div>
  );
};

export default ShareableUrlMetadata;
