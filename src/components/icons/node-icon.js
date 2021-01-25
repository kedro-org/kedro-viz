import React from 'react';
import modifiers from '../../utils/modifiers';

export const paths = {
  // database icon
  data:
    'M12 4c3.31 0 6 1.67 6 3.73l-.01.27H18v9h-.02a1.1 1.1 0 01-.16.42c-1.14 1.7-3.11 2.53-5.82 2.53s-4.68-.82-5.82-2.53a1.09 1.09 0 01-.16-.42H6V8h.01A2.33 2.33 0 016 7.73C6 5.67 8.69 4 12 4zm0 11.73c-1.6 0-2.94-.31-4-.94v1.64c.74.9 2.05 1.38 4 1.38 1.95 0 3.26-.48 4-1.38v-1.65c-1.06.64-2.4.95-4 .95zm0-4.26a8.33 8.33 0 01-4-.95v1.64c.75 1.1 2.04 1.65 4 1.65s3.25-.55 4-1.65V10.5c-1.06.6-2.46.96-4 .96zm0-5.34a6.3 6.3 0 00-3.23.8c-.56.35-.77.66-.77.8 0 .15.2.45.77.8.8.5 1.96.8 3.23.8s2.44-.3 3.23-.8c.56-.35.77-.65.77-.8 0-.14-.2-.45-.77-.8a6.3 6.3 0 00-3.23-.8z',
  // function icon
  task:
    'M20 4.2l.2.2L19 5.9c-2.3-1.8-3.8-.9-4.8 3.4h3.1v2h-3.5v.2l-.1.6c-1.2 7.9-4 11-8.3 8l-.2-.1 1.2-1.6c2.5 1.8 4.2.3 5.2-5.9l.2-1v-.2H9.2v-2h3c1.4-6 4.1-8 7.9-5z',
  // sliders icon
  parameters:
    'M10.2 14v1.5H20v2h-9.8V19H8.3v-1.5H5v-2h3.3V14h2zm7.4-9v1.5H20v2h-2.4V10h-1.8V8.5H5v-2h10.8V5h1.8z'
};

export default ({ className, type }) =>
  paths[type] ? (
    <svg
      className={modifiers('pipeline-node-icon', { type }, className)}
      viewBox="0 0 24 24">
      <path d={paths[type]} />
    </svg>
  ) : null;
